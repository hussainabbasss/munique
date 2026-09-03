import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  isCountryInPool,
  isP5Country,
  P5_COUNTRIES,
  resolveCommitteePool,
} from "@/lib/allotments/countries";
import type {
  MeritCommittee,
  MeritRegistration,
  MeritResult,
  MeritSuggestion,
} from "@/lib/allotments/types";

function clampScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function committeesWithPool(committees: MeritCommittee[]) {
  return committees.filter(
    (committee) => resolveCommitteePool(committee.country_pool).length > 0,
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

function validateSuggestion(
  parsed: MeritSuggestion,
  committees: MeritCommittee[],
) {
  const committee = committees.find((c) => c.id === parsed.committee_id);
  if (!committee) return null;
  if (isP5Country(parsed.country)) return null;

  const pool = resolveCommitteePool(committee.country_pool);
  if (!pool.length) return null;

  if (!isCountryInPool(parsed.country, pool)) return null;

  return parsed;
}

async function suggestWithGemini(
  reg: MeritRegistration,
  committees: MeritCommittee[],
  takenCountries: Set<string>,
): Promise<{ suggestion: MeritSuggestion | null; detail?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      suggestion: null,
      detail: "GEMINI_API_KEY is not set.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });

  const committeeBlock = committees
    .filter((c) => resolveCommitteePool(c.country_pool).length > 0)
    .map((c) => {
      const pool = resolveCommitteePool(c.country_pool);
      return `- id: ${c.id}\n  name: ${c.name}\n  difficulty: ${c.difficulty_tier}\n  agenda: ${c.agenda.slice(0, 500)}\n  allotment_pool: ${pool.join(", ")}`;
    })
    .join("\n");

  if (!committeeBlock) {
    return {
      suggestion: null,
      detail: "No committees with an allotment pool.",
    };
  }

  const delegateBlock =
    reg.type === "delegation"
      ? reg.delegates
          .map((d) => `  - ${d.full_name}${d.is_head_delegate ? " (head)" : ""}`)
          .join("\n")
      : `  - ${reg.delegates[0]?.full_name ?? "Delegate"}`;

  const takenList = [...takenCountries].join(", ") || "none";

  const prompt = `You are the allotment advisor for Munique 2026, a Model UN conference.

Score this registration and suggest ONE committee and ONE country assignment.

RULES (strict):
1. NEVER assign P5 countries (${P5_COUNTRIES.join(", ")}). Those are reserved for manual EB assignment only.
2. Choose country ONLY from the selected committee's allotment_pool (listed per committee below). Never use a country outside that committee's pool.
3. More experienced delegates/delegations should receive countries MORE central/relevant to the committee agenda.
4. Less experienced delegates should receive countries still plausible but less agenda-central.
5. For delegations: score the ENTIRE group as one unit using combined experience. Assign ONE shared country for all delegates in the delegation.
6. Prefer committee preferences when merit supports the difficulty tier (pref 1 = ambitious, pref 3 = fallback).
7. Avoid countries already assigned in this batch when possible: ${takenList}

Registration:
- type: ${reg.type}
- group/school: ${reg.school}
- mun_experience: ${reg.mun_experience}
- committee_pref_1: ${reg.committee_pref_1 ?? "none"}
- committee_pref_2: ${reg.committee_pref_2 ?? "none"}
- committee_pref_3: ${reg.committee_pref_3 ?? "none"}
- delegates (${reg.delegates.length}):
${delegateBlock}

Published committees:
${committeeBlock}

Return JSON only:
{
  "merit_score": <integer 0-100>,
  "committee_id": "<uuid from list>",
  "country": "<from that committee's allotment_pool, never P5>",
  "reasoning": "<one sentence>"
}`;

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

    const validated = validateSuggestion(parsed, committees);
    if (!validated) {
      return {
        suggestion: null,
        detail:
          "Gemini suggestion failed validation (committee, pool, or P5 rules).",
      };
    }

    return { suggestion: validated };
  } catch (error) {
    console.error("[merit-engine] Gemini failed", error);
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    return {
      suggestion: null,
      detail: message,
    };
  }
}

export async function suggestAllotment(params: {
  registration: MeritRegistration;
  committees: MeritCommittee[];
  takenCountries: Set<string>;
}): Promise<MeritResult> {
  const { registration, committees, takenCountries } = params;

  const eligible = committeesWithPool(committees);
  if (!eligible.length) {
    return {
      ok: false,
      reason:
        "No published committees with an allotment pool — add allotments on each committee first.",
    };
  }

  const { suggestion, detail } = await suggestWithGemini(
    registration,
    eligible,
    takenCountries,
  );

  if (!suggestion) {
    return {
      ok: false,
      reason: `Model failed — set allotment manually.${detail ? ` (${detail})` : ""}`,
    };
  }

  takenCountries.add(suggestion.country.toLowerCase());
  return {
    ok: true,
    ...suggestion,
  };
}
