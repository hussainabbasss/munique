export type MeritCommittee = {
  id: string;
  name: string;
  agenda: string;
  difficulty_tier: "low" | "medium" | "high";
};

export type MeritDelegate = {
  full_name: string;
  is_head_delegate: boolean;
};

export type MeritRegistration = {
  id: string;
  type: "delegate" | "delegation";
  mun_experience: string;
  school: string;
  committee_pref_1: string | null;
  committee_pref_2: string | null;
  committee_pref_3: string | null;
  delegates: MeritDelegate[];
};

export type MeritSuggestion = {
  merit_score: number;
  committee_id: string;
  country: string;
  reasoning?: string;
};
