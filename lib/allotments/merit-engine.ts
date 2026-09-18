import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  freeCommitteeSeats,
  isP5Country,
  P5_COUNTRIES,
  resolveCommitteePool,
  seatKey,
} from "@/lib/allotments/countries";
import type {
  MeritCommittee,
  MeritDelegateInput,
  MeritResult,
  MeritSuggestion,
} from "@/lib/allotments/types";

/** Current free-tier friendly default; override with GEMINI_MODEL. */
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
const MAX_RETRIES = 3;
/** Free tier is ~15 RPM — allow waiting out a full minute window. */
const RETRY_FALLBACK_MS = 55_000;
const MAX_RETRY_DELAY_MS = 65_000;

function clampScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sameCountry(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function freeSeats(committee: MeritCommittee, takenSeats: ReadonlySet<string>) {
  return freeCommitteeSeats(committee.id, committee.country_pool, takenSeats);
}

/** Committees the engine can still place someone in — at least one free non-P5 seat. */
function committeesWithFreeSeats(
  committees: MeritCommittee[],
  takenSeats: ReadonlySet<string>,
) {
  return committees.filter(
    (committee) => freeSeats(committee, takenSeats).length > 0,
  );
}

function parseGeminiJson(text: string): MeritSuggestion | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const payload = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(payload) as Partial<MeritSuggestion>;
    if (
      typeof parsed.merit_score !== "number" ||
      typeof parsed.committee_id !== "string" ||
      typeof parsed.country !== "string"
    ) {
      return null;
    }

    return {
      merit_score: clampScore(parsed.merit_score),
      committee_id: parsed.committee_id,
      country: parsed.country.trim(),
      reasoning:
        typeof parsed.reasoning === "string" ? parsed.reasoning : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Check Gemini's pick against committee, pool and P5 rules, then make sure the
 * seat is still free in that committee. Seats are per committee — the same
 * country can be taken in one committee and free in another.
 */
function resolveSeat(
  parsed: MeritSuggestion,
  person: MeritDelegateInput,
  committees: MeritCommittee[],
  takenSeats: ReadonlySet<string>,
): MeritSuggestion | null {
  const committee = committees.find((c) => c.id === parsed.committee_id);
  if (!committee) return null;
  if (isP5Country(parsed.country)) return null;

  // Store the pool's spelling so pickers and the country matrix match exactly
  const poolCountry = resolveCommitteePool(committee.country_pool).find(
    (entry) => sameCountry(entry, parsed.country),
  );
  if (!poolCountry) return null;

  if (!takenSeats.has(seatKey(committee.id, poolCountry))) {
    return { ...parsed, country: poolCountry };
  }

  // Seat already held — another free seat in the same committee, then preferences
  const fallbackOrder = [
    committee.id,
    person.committee_pref_1,
    person.committee_pref_2,
    person.committee_pref_3,
    ...committees.map((c) => c.id),
  ];

  for (const committeeId of fallbackOrder) {
    const candidate = committees.find((c) => c.id === committeeId);
    if (!candidate) continue;
    const free = freeSeats(candidate, takenSeats);
    if (!free.length) continue;

    const note = `${poolCountry} was already taken in ${committee.name} — moved to a free seat.`;
    return {
      ...parsed,
      committee_id: candidate.id,
      country: free[free.length - 1],
      reasoning: parsed.reasoning ? `${parsed.reasoning} ${note}` : note,
    };
  }

  return null;
}

/**
 * Keep first preference unless it is a high-difficulty committee.
 * Low/no experience alone must not push beginners (e.g. PNA/PAC first pref)
 * to pref_2 or pref_3 — Gemini sometimes does that incorrectly.
 */
function honorEasyFirstPreference(
  suggestion: MeritSuggestion,
  person: MeritDelegateInput,
  committees: MeritCommittee[],
  takenSeats: ReadonlySet<string>,
): MeritSuggestion {
  const pref1Id = person.committee_pref_1;
  if (!pref1Id || suggestion.committee_id === pref1Id) {
    return suggestion;
  }

  const pref1 = committees.find((c) => c.id === pref1Id);
  if (!pref1 || pref1.difficulty_tier === "high") {
    return suggestion;
  }

  const pool = freeSeats(pref1, takenSeats);

  if (!pool.length) {
    return suggestion;
  }

  // Keep Gemini's country if it is still free in pref_1; otherwise take a quieter seat
  const country =
    pool.find((entry) => sameCountry(entry, suggestion.country)) ??
    pool[pool.length - 1];

  return {
    ...suggestion,
    committee_id: pref1.id,
    country,
    reasoning: suggestion.reasoning
      ? `${suggestion.reasoning} Kept first preference (${pref1.name}) — not high difficulty.`
      : `Assigned to first preference (${pref1.name}).`,
  };
}

function isQuotaError(message: string) {
  return (
    message.includes("429") ||
    /quota|rate.?limit|too many requests/i.test(message)
  );
}

/** Daily free-tier caps won't clear with short retries — stop the batch. */
export function isDailyQuotaExhausted(message: string) {
  return (
    /GenerateRequestsPerDayPerProjectPerModel|RequestsPerDayPerProject/i.test(
      message,
    ) && /quota|exceeded|429/i.test(message)
  );
}

/** Per-minute free-tier — wait and retry; do not abort the whole run. */
export function isMinuteQuotaExceeded(message: string) {
  return (
    /GenerateRequestsPerMinutePerProjectPerModel|RequestsPerMinute/i.test(
      message,
    ) && /quota|exceeded|429/i.test(message)
  );
}

/** Model removed / wrong id — retrying every delegate just hangs the UI. */
export function isModelUnavailable(message: string) {
  return (
    /\[404|404 Not Found|no longer available|not found for API version|is not found/i.test(
      message,
    ) || /Please update your code to use models\//i.test(message)
  );
}

function parseRetryDelayMs(message: string): number | null {
  const retryInfo = message.match(/retryDelay["\s:]+"?(\d+(?:\.\d+)?)s/i);
  if (retryInfo) {
    return Math.min(
      Math.ceil(Number(retryInfo[1]) * 1000) + 1500,
      MAX_RETRY_DELAY_MS,
    );
  }
  const pleaseRetry = message.match(/Please retry in ([\d.]+)s/i);
  if (pleaseRetry) {
    return Math.min(
      Math.ceil(Number(pleaseRetry[1]) * 1000) + 1500,
      MAX_RETRY_DELAY_MS,
    );
  }
  return null;
}

async function suggestWithGemini(
  person: MeritDelegateInput,
  committees: MeritCommittee[],
  takenSeats: ReadonlySet<string>,
): Promise<{ suggestion: MeritSuggestion | null; detail?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      suggestion: null,
      detail: "GEMINI_API_KEY is not set.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });

  const committeeBlock = committees
    .map((c) => {
      const available = freeSeats(c, takenSeats);
      return `- id: ${c.id}\n  name: ${c.name}\n  difficulty: ${c.difficulty_tier}\n  agenda: ${c.agenda.slice(0, 500)}\n  available_seats: ${available.join(", ")}`;
    })
    .join("\n");

  if (!committeeBlock) {
    return {
      suggestion: null,
      detail: "No committees with free seats left.",
    };
  }

  function describePref(prefId: string | null, rank: 1 | 2 | 3) {
    if (!prefId) return `pref_${rank}: none`;
    const committee = committees.find((c) => c.id === prefId);
    if (!committee) return `pref_${rank}: ${prefId}`;
    return `pref_${rank}: ${committee.name} (id: ${committee.id}, difficulty: ${committee.difficulty_tier})`;
  }

  const prompt = `You are the allotment advisor for Munique 2026, a Model UN conference.

Score this individual delegate and suggest ONE committee and ONE country/seat assignment.

RULES (strict):
1. NEVER assign P5 countries (${P5_COUNTRIES.join(", ")}). Those are reserved for manual EB assignment only.
2. Choose country/seat ONLY from the selected committee's available_seats (listed per committee below). Never use a seat outside that committee's list.
3. Committee preference order is the primary rule — honor pref_1 whenever it is listed below (every listed committee still has seats).
4. Low / no MUN experience does NOT mean demote from pref_1. Beginners who chose an easy or beginner-friendly first preference (difficulty low, or committees like PNA / PAC) MUST stay in pref_1. Do not push them to pref_2 or pref_3 just because they are new.
5. Only move to pref_2 (then pref_3) when pref_1 is genuinely unsuitable: difficulty is high AND experience is clearly too weak for that committee, OR pref_1 is not listed below (it is full). Never demote from a low or medium difficulty first preference because of low/no experience.
6. Within the chosen committee, more experienced delegates get seats more central to the agenda; less experienced get still-plausible but less agenda-central seats. That is a seat choice inside the committee — never a reason to change committees.
7. Seats are per committee: the same country can be free in one committee and taken in another. Taken seats are already removed from each available_seats list — a committee missing from the list is full.
8. Allot this person independently — even if they registered with a school delegation.

Delegate:
- name: ${person.full_name}
- role: ${person.is_head_delegate ? "head" : "member"}
- registration_type: ${person.type}
- school/group: ${person.school}
- mun_experience: ${person.mun_experience}
- ${describePref(person.committee_pref_1, 1)}
- ${describePref(person.committee_pref_2, 2)}
- ${describePref(person.committee_pref_3, 3)}

Published committees:
${committeeBlock}

Return JSON only:
{
  "merit_score": <integer 0-100>,
  "committee_id": "<uuid from list>",
  "country": "<from that committee's available_seats, never P5>",
  "reasoning": "<one sentence>"
}`;

  let lastDetail: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseGeminiJson(text);
      if (!parsed) {
        return {
          suggestion: null,
          detail: "Gemini returned invalid JSON.",
        };
      }

      const validated = resolveSeat(parsed, person, committees, takenSeats);
      if (!validated) {
        return {
          suggestion: null,
          detail:
            "Gemini suggestion failed validation (committee, pool, or P5 rules).",
        };
      }

      return {
        suggestion: honorEasyFirstPreference(
          validated,
          person,
          committees,
          takenSeats,
        ),
      };
    } catch (error) {
      console.error("[merit-engine] Gemini failed", error);
      const message =
        error instanceof Error ? error.message : "Unknown Gemini error";
      lastDetail = message;

      // Permanent: wrong/retired model — do not retry or continue the batch
      if (isModelUnavailable(message)) {
        break;
      }

      // Daily quota — retries won't help until tomorrow
      if (isDailyQuotaExhausted(message)) {
        break;
      }

      if (!isQuotaError(message) || attempt === MAX_RETRIES) {
        break;
      }

      const delay =
        parseRetryDelayMs(message) ??
        (isMinuteQuotaExceeded(message) ? RETRY_FALLBACK_MS : 10_000);
      console.warn(
        `[merit-engine] Rate limited — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay / 1000)}s`,
      );
      await sleep(delay);
    }
  }

  return {
    suggestion: null,
    detail: lastDetail,
  };
}

export async function suggestAllotment(params: {
  person: MeritDelegateInput;
  committees: MeritCommittee[];
  /** Seats already held, keyed by seatKey(committeeId, country). Added to on success. */
  takenSeats: Set<string>;
}): Promise<MeritResult> {
  const { person, committees, takenSeats } = params;

  const eligible = committeesWithFreeSeats(committees, takenSeats);
  if (!eligible.length) {
    return {
      ok: false,
      reason:
        "No free seats left in any published committee — add countries to a committee pool or set this allotment manually.",
      // Nobody after this person can be seated either
      abortBatch: true,
    };
  }

  const { suggestion, detail } = await suggestWithGemini(
    person,
    eligible,
    takenSeats,
  );

  if (!suggestion) {
    const modelGone = detail ? isModelUnavailable(detail) : false;
    const dailyGone = detail ? isDailyQuotaExhausted(detail) : false;
    return {
      ok: false,
      reason: modelGone
        ? `Gemini model unavailable — set GEMINI_MODEL in .env.local (suggested: gemini-3.5-flash-lite).${detail ? ` (${detail})` : ""}`
        : `Model failed — set allotment manually.${detail ? ` (${detail})` : ""}`,
      // Only stop the whole run for permanent problems (not per-minute 429)
      abortBatch: modelGone || dailyGone,
      quotaExhausted: dailyGone,
    };
  }

  takenSeats.add(seatKey(suggestion.committee_id, suggestion.country));
  return {
    ok: true,
    ...suggestion,
  };
}
