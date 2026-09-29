import { GoogleGenerativeAI } from "@google/generative-ai";
import { freeCommitteeSeats, seatKey } from "@/lib/allotments/countries";
import {
  isDailyQuotaExhausted,
  isMinuteQuotaExceeded,
} from "@/lib/allotments/merit-engine";
import type {
  MeritCommittee,
  MeritDelegateInput,
} from "@/lib/allotments/types";

/**
 * Batch merit engine.
 *
 * 1. Score everyone's MUN experience in one Gemini call per 40 people (the
 *    model only reads text — it never picks seats). If Gemini fails, a keyword
 *    heuristic scores that chunk so a quota error never blocks allotments.
 * 2. Seat people in code, highest merit first: first preference unless it is a
 *    high-difficulty committee and their merit is low, then later preferences.
 *    Within a committee the next free country in pool order is taken, so the
 *    pool's order decides which seats go to the strongest delegates.
 * 3. People in a "fill" group are seated only in the 3 committees with the
 *    most free seats: their first preference among those (UNSC → PNA skips
 *    UNSC if it is not one of them), otherwise the emptiest of the three.
 */

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
const SCORE_CHUNK = 40;
/** Below this, a high-difficulty first preference moves to a later preference. */
const HIGH_DIFFICULTY_MIN_SCORE = 40;
const MAX_RETRY_DELAY_MS = 65_000;
/** A fill group is seated only in this many committees with the most free seats. */
const FILL_COMMITTEES = 3;

export type EnginePerson = MeritDelegateInput & {
  /** Seat by most free seats instead of preferences */
  fill: boolean;
};

export type ScoreSource = "gemini" | "heuristic";

export type SeatResult =
  | {
      ok: true;
      person: EnginePerson;
      merit_score: number;
      committee_id: string;
      country: string;
      reasoning: string;
    }
  | { ok: false; person: EnginePerson; merit_score: number; reason: string };

// ── Scoring ────────────────────────────────────────────────────────────────

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, first: 1, single: 1, once: 1, twice: 2, several: 3,
  multiple: 3, many: 4,
};

/** Fallback when Gemini is unavailable: counts MUNs, awards and roles. */
export function heuristicScore(experience: string): number {
  const text = experience.toLowerCase().trim();
  if (!text || /^(none|no|nil|n\/?a|nothing|-|no experience)\.?$/.test(text)) {
    return 5;
  }

  let muns = 0;
  for (const match of text.matchAll(/(\d+|[a-z]+)\s*(?:\+\s*)?(?:x\s*)?(?:muns?|model un|conferences?)/g)) {
    const raw = match[1];
    const n = /^\d+$/.test(raw) ? Number(raw) : (NUMBER_WORDS[raw] ?? 0);
    muns = Math.max(muns, Math.min(n, 15));
  }
  if (muns === 0 && /\bmun|model un/.test(text)) muns = 1;

  let score = 15 + muns * 10;
  if (/best delegate|outstanding|honou?rable|verbal mention|special mention|award|position paper|winner|won/.test(text)) {
    score += 15;
  }
  if (/\bchair|\beb\b|executive board|director|secretariat|usg|secretary|president|moderator/.test(text)) {
    score += 15;
  }
  if (/debat|declam|parliament/.test(text)) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseRetryDelayMs(message: string): number | null {
  const match =
    message.match(/retryDelay["\s:]+"?(\d+(?:\.\d+)?)s/i) ??
    message.match(/Please retry in ([\d.]+)s/i);
  if (!match) return null;
  return Math.min(Math.ceil(Number(match[1]) * 1000) + 1500, MAX_RETRY_DELAY_MS);
}

async function scoreChunkWithGemini(
  chunk: EnginePerson[],
): Promise<Map<string, number>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  });

  const list = chunk
    .map(
      (person, i) =>
        `${i}. ${JSON.stringify((person.mun_experience || "none").slice(0, 600))}`,
    )
    .join("\n");

  const prompt = `You score Model UN delegates' past experience for Munique 2026.

Give each numbered answer a merit score from 0 to 100:
- 0–10: no MUN or debating experience
- 10–30: school debating/declamation only, or one MUN as a first-timer
- 30–55: 1–3 MUNs, no awards
- 55–75: 3–6 MUNs, or awards (honourable/verbal mention, best delegate), or debating titles
- 75–100: many MUNs with multiple awards, or chairing / executive board / secretariat roles

Judge only what is written. Be consistent: equal experience gets equal scores.

Answers:
${list}

Return JSON only: {"scores":[{"i":<number>,"score":<integer 0-100>}, ...]} with one entry per answer.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text()) as {
        scores?: { i?: unknown; score?: unknown }[];
      };
      const scores = new Map<string, number>();
      for (const entry of parsed.scores ?? []) {
        const i = Number(entry.i);
        const score = Number(entry.score);
        if (!Number.isInteger(i) || !chunk[i] || !Number.isFinite(score)) continue;
        scores.set(chunk[i].id, Math.max(0, Math.min(100, Math.round(score))));
      }
      if (scores.size === 0) throw new Error("Gemini returned no scores.");
      return scores;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // One wait for a per-minute limit; anything else falls back immediately
      if (attempt === 0 && isMinuteQuotaExceeded(message) && !isDailyQuotaExhausted(message)) {
        await new Promise((r) => setTimeout(r, parseRetryDelayMs(message) ?? 30_000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gemini scoring failed.");
}

export async function scoreMerit(people: EnginePerson[]): Promise<{
  scores: Map<string, { score: number; source: ScoreSource }>;
  geminiCalls: number;
  fallbackReason: string | null;
}> {
  const scores = new Map<string, { score: number; source: ScoreSource }>();
  let geminiCalls = 0;
  let fallbackReason: string | null = null;

  for (let start = 0; start < people.length; start += SCORE_CHUNK) {
    const chunk = people.slice(start, start + SCORE_CHUNK);
    let gemini = new Map<string, number>();

    // After one failure, stop spending time on Gemini for this run
    if (!fallbackReason) {
      try {
        geminiCalls++;
        gemini = await scoreChunkWithGemini(chunk);
      } catch (error) {
        fallbackReason = error instanceof Error ? error.message : String(error);
        console.error("[batch-engine] Gemini scoring failed", fallbackReason);
      }
    }

    for (const person of chunk) {
      const fromGemini = gemini.get(person.id);
      scores.set(
        person.id,
        fromGemini !== undefined
          ? { score: fromGemini, source: "gemini" }
          : { score: heuristicScore(person.mun_experience), source: "heuristic" },
      );
    }
  }

  return { scores, geminiCalls, fallbackReason };
}

// ── Seating ────────────────────────────────────────────────────────────────

export function assignSeats(params: {
  people: EnginePerson[];
  scores: Map<string, number>;
  committees: MeritCommittee[];
  /** Seats already held — added to as people are seated */
  takenSeats: Set<string>;
}): SeatResult[] {
  const { people, scores, committees, takenSeats } = params;
  const byId = new Map(committees.map((c) => [c.id, c]));
  const free = (c: MeritCommittee) =>
    freeCommitteeSeats(c.id, c.country_pool, takenSeats);

  const ordered = [...people].sort(
    (a, b) =>
      (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
      a.full_name.localeCompare(b.full_name),
  );

  return ordered.map((person): SeatResult => {
    const merit = scores.get(person.id) ?? 0;
    const prefs = [
      person.committee_pref_1,
      person.committee_pref_2,
      person.committee_pref_3,
    ]
      .map((id) => (id ? byId.get(id) : undefined))
      .filter((c): c is MeritCommittee => Boolean(c));

    const open = committees.filter((c) => free(c).length > 0);
    if (!open.length) {
      return {
        ok: false,
        person,
        merit_score: merit,
        reason: "No free seats left in any published committee — set manually.",
      };
    }

    let committee: MeritCommittee;
    let why: string;

    if (person.fill) {
      // Only the emptiest committees count; preferences choose among them
      const emptiest = [...open]
        .sort((a, b) => free(b).length - free(a).length)
        .slice(0, FILL_COMMITTEES);
      const preferred = prefs.find((p) => emptiest.some((c) => c.id === p.id));
      committee = preferred ?? emptiest[0];
      const top = emptiest.map((c) => c.name).join(", ");
      why = preferred
        ? `Group fill — preference ${prefs.indexOf(preferred) + 1} (${preferred.name}) is among the emptiest committees (${top}).`
        : `Group fill — no preference among the emptiest committees (${top}); placed in ${committee.name} (${free(committee).length} free).`;
    } else {
      const openPrefs = prefs.filter((c) => free(c).length > 0);
      const suitable = openPrefs.find(
        (c) => c.difficulty_tier !== "high" || merit >= HIGH_DIFFICULTY_MIN_SCORE,
      );
      const choice = suitable ?? openPrefs[0];

      if (choice) {
        committee = choice;
        const rank = prefs.findIndex((p) => p.id === choice.id) + 1;
        why =
          rank === 1
            ? `First preference (${choice.name}).`
            : `Preference ${rank} (${choice.name}) — ${
                prefs[0] && free(prefs[0]).length === 0
                  ? `${prefs[0].name} is full`
                  : "earlier choice is high difficulty for this experience level"
              }.`;
      } else {
        committee = [...open].sort((a, b) => free(b).length - free(a).length)[0];
        why = prefs.length
          ? `Preferred committees are full — placed in ${committee.name} (most free seats).`
          : `No preferences — placed in ${committee.name} (most free seats).`;
      }
    }

    const country = free(committee)[0];
    takenSeats.add(seatKey(committee.id, country));

    return {
      ok: true,
      person,
      merit_score: merit,
      committee_id: committee.id,
      country,
      reasoning: `Merit ${merit}. ${why}`,
    };
  });
}
