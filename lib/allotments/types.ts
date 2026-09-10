export type MeritCommittee = {
  id: string;
  name: string;
  agenda: string;
  difficulty_tier: "low" | "medium" | "high";
  country_pool: string[];
};

export type MeritDelegateInput = {
  id: string;
  registration_id: string;
  full_name: string;
  is_head_delegate: boolean;
  type: "delegate" | "delegation";
  school: string;
  mun_experience: string;
  committee_pref_1: string | null;
  committee_pref_2: string | null;
  committee_pref_3: string | null;
};

export type MeritSuggestion = {
  merit_score: number;
  committee_id: string;
  country: string;
  reasoning?: string;
};

export type MeritResult =
  | ({ ok: true } & MeritSuggestion)
  | { ok: false; reason: string };

/** @deprecated Use MeritDelegateInput — kept for transitional imports */
export type MeritRegistration = MeritDelegateInput;
export type MeritDelegate = {
  full_name: string;
  is_head_delegate: boolean;
};
