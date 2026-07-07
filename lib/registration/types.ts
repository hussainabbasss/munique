import type { Committee, PricingConfig } from "@/lib/types/admin";

export type Portal = "delegate" | "delegation";

export const DELEGATION_MIN_DELEGATES = 2;
export const DELEGATION_MAX_DELEGATES = 15;
export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;

export type DelegateMember = {
  fullName: string;
  email: string;
};

export type DelegateDraft = {
  fullName: string;
  email: string;
  school: string;
  committeePref1: string;
  committeePref2: string;
  committeePref3: string;
  munExperience: string;
};

export type DelegationDraft = {
  school: string;
  headName: string;
  headEmail: string;
  members: DelegateMember[];
  committeePref1: string;
  committeePref2: string;
  committeePref3: string;
  munExperience: string;
};

export type RegistrationDraft = DelegateDraft | DelegationDraft;

export type FeeBreakdown = {
  perDelegateFee: number;
  totalFee: number;
  delegateCount: number;
  isEarlyBird: boolean;
  standardPerDelegateFee: number;
};

export type RegistrationWizardProps = {
  portal: Portal;
  portalLabel: string;
  committees: Committee[];
  pricing: PricingConfig;
};

export type SubmitSuccess = {
  ok: true;
  registrationId: string;
  headEmail: string;
};

export type SubmitFailure = {
  ok: false;
  error: string;
};

export type SubmitResult = SubmitSuccess | SubmitFailure;

export function isDelegationDraft(
  draft: RegistrationDraft,
  portal: Portal,
): draft is DelegationDraft {
  return portal === "delegation";
}

export function emptyDelegateDraft(): DelegateDraft {
  return {
    fullName: "",
    email: "",
    school: "",
    committeePref1: "",
    committeePref2: "",
    committeePref3: "",
    munExperience: "",
  };
}

export function emptyDelegationDraft(): DelegationDraft {
  return {
    school: "",
    headName: "",
    headEmail: "",
    members: [{ fullName: "", email: "" }],
    committeePref1: "",
    committeePref2: "",
    committeePref3: "",
    munExperience: "",
  };
}
