import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  isP5Country,
  P5_COUNTRIES,
  STANDARD_COUNTRIES,
} from "@/lib/allotments/countries";
import type {
  MeritCommittee,
  MeritRegistration,
  MeritSuggestion,
} from "@/lib/allotments/types";

const EXPERIENCE_KEYWORDS = [
  "award",
  "best delegate",
  "chair",
  "secretary",
  "mun",
  "conference",
  "diplomacy",
  "resolution",
  "crisis",
  "ga",
  "unsc",
  "security council",
  "delegate",
  "head delegate",
  "verbal",
  "position paper",
];

function clampScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function heuristicMeritScore(reg: MeritRegistration, difficultyTier: string) {
  const text = reg.mun_experience.toLowerCase();
  let score = 35 + Math.min(30, reg.mun_experience.length / 6);

  for (const keyword of EXPERIENCE_KEYWORDS) {
    if (text.includes(keyword)) score += 4;
  }

  if (reg.type === "delegation") {
    score += Math.min(12, reg.delegates.length * 2);
  }

  const tierBonus =
    difficultyTier === "high" ? 12 : difficultyTier === "medium" ? 6 : 0;

  return clampScore(score + tierBonus);
}

function pickCommitteeFromPrefs(
  reg: MeritRegistration,
  committees: MeritCommittee[],
  meritScore: number,
) {
  const prefIds = [
    reg.committee_pref_1,
    reg.committee_pref_2,
    reg.committee_pref_3,
  ].filter(Boolean) as string[];

  const byId = new Map(committees.map((c) => [c.id, c]));

  if (meritScore >= 75 && prefIds[0] && byId.has(prefIds[0])) {
    return prefIds[0];
  }
  if (meritScore >= 55 && prefIds[1] && byId.has(prefIds[1])) {
    return prefIds[1];
  }
  if (prefIds[2] && byId.has(prefIds[2])) return prefIds[2];
  if (prefIds[0] && byId.has(prefIds[0])) return prefIds[0];

  const tierOrder =
    meritScore >= 70
      ? (["high", "medium", "low"] as const)
      : meritScore >= 45
        ? (["medium", "low", "high"] as const)
        : (["low", "medium", "high"] as const);

  for (const tier of tierOrder) {
    const match = committees.find((c) => c.difficulty_tier === tier);
    if (match) return match.id;
  }

  return committees[0]?.id ?? "";
}

function agendaKeywordScore(agenda: string, country: string) {
  const agendaLower = agenda.toLowerCase();
  const countryLower = country.toLowerCase();
  const tokens = countryLower.split(/\s+/).filter((t) => t.length > 2);

  let score = 0;
  for (const token of tokens) {
    if (agendaLower.includes(token)) score += 3;
  }

  const regionalHints: Record<string, string[]> = {
    "middle east": ["saudi", "iran", "egypt", "qatar", "uae", "israel", "turkey"],
    africa: ["nigeria", "kenya", "south africa", "ethiopia", "ghana", "morocco"],
    asia: ["india", "pakistan", "japan", "china", "korea", "indonesia", "vietnam"],
    europe: ["germany", "france", "uk", "italy", "spain", "poland", "sweden"],
    americas: ["brazil", "mexico", "argentina", "colombia", "canada", "chile"],
    climate: ["norway", "sweden", "germany", "netherlands", "brazil"],
    nuclear: ["iran", "pakistan", "india", "israel"],
    refugee: ["turkey", "germany", "jordan", "lebanon", "bangladesh"],
    trade: ["china", "usa", "germany", "japan", "singapore"],
  };

  for (const [topic, countries] of Object.entries(regionalHints)) {
    if (!agendaLower.includes(topic)) continue;
    for (const hint of countries) {
      if (countryLower.includes(hint)) score += 5;
    }
  }

  return score;
}

function heuristicCountry(
  reg: MeritRegistration,
  committee: MeritCommittee | undefined,
  meritScore: number,
  takenCountries: Set<string>,
) {
  const agenda = committee?.agenda ?? "";
  const ranked = [...STANDARD_COUNTRIES]
    .map((country) => ({
      country,
      relevance: agendaKeywordScore(agenda, country),
      meritFit: meritScore / 100,
    }))
    .sort((a, b) => {
      const aScore = a.relevance * 2 + a.meritFit;
      const bScore = b.relevance * 2 + b.meritFit;
      return bScore - aScore;
    });

  const highMerit = meritScore >= 65;
  const pool = highMerit ? ranked.slice(0, 15) : ranked.slice(5, 35);

  for (const entry of pool) {
    const key = entry.country.toLowerCase();
    if (!takenCountries.has(key)) {
      return entry.country;
    }
  }

  for (const country of STANDARD_COUNTRIES) {
    const key = country.toLowerCase();
    if (!takenCountries.has(key)) return country;
  }

  return STANDARD_COUNTRIES[0];
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

async function suggestWithGemini(
  reg: MeritRegistration,
  committees: MeritCommittee[],
  takenCountries: Set<string>,
): Promise<MeritSuggestion | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const committeeBlock = committees
    .map(
      (c) =>
        `- id: ${c.id}\n  name: ${c.name}\n  difficulty: ${c.difficulty_tier}\n  agenda: ${c.agenda.slice(0, 500)}`,
    )
    .join("\n");

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
2. Choose country ONLY from this standard pool: ${STANDARD_COUNTRIES.join(", ")}
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
  "country": "<from standard pool, never P5>",
  "reasoning": "<one sentence>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseGeminiJson(text);
    if (!parsed) return null;

    const committeeExists = committees.some((c) => c.id === parsed.committee_id);
    if (!committeeExists) return null;
    if (isP5Country(parsed.country)) return null;
    if (
      !STANDARD_COUNTRIES.some(
        (c) => c.toLowerCase() === parsed.country.toLowerCase(),
      )
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[merit-engine] Gemini failed", error);
    return null;
  }
}

export async function suggestAllotment(params: {
  registration: MeritRegistration;
  committees: MeritCommittee[];
  takenCountries: Set<string>;
}): Promise<MeritSuggestion> {
  const { registration, committees, takenCountries } = params;

  if (!committees.length) {
    throw new Error("No published committees available for allotment.");
  }

  const gemini = await suggestWithGemini(
    registration,
    committees,
    takenCountries,
  );

  if (gemini) {
    takenCountries.add(gemini.country.toLowerCase());
    return gemini;
  }

  const prefCommitteeId = pickCommitteeFromPrefs(
    registration,
    committees,
    heuristicMeritScore(
      registration,
      committees.find((c) => c.id === registration.committee_pref_1)
        ?.difficulty_tier ?? "medium",
    ),
  );
  const committee =
    committees.find((c) => c.id === prefCommitteeId) ?? committees[0];
  const meritScore = heuristicMeritScore(
    registration,
    committee.difficulty_tier,
  );
  const country = heuristicCountry(
    registration,
    committee,
    meritScore,
    takenCountries,
  );

  takenCountries.add(country.toLowerCase());

  return {
    merit_score: meritScore,
    committee_id: committee.id,
    country,
    reasoning: process.env.GEMINI_API_KEY
      ? "Gemini unavailable — heuristic fallback used."
      : "Heuristic scoring (set GEMINI_API_KEY for AI allotments).",
  };
}
