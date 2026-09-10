import type { Committee, PricingConfig } from "@/lib/types/admin";

export type Portal = "delegate" | "delegation";

export const DELEGATION_MIN_DELEGATES = 2;
export const DELEGATION_MAX_DELEGATES = 15;
export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;

export type CommitteePrefs = {
  committeePref1: string;
  committeePref2: string;
  committeePref3: string;
};

export type DelegateMember = {
  fullName: string;
  email: string;
  munExperience: string;
} & CommitteePrefs;

export type DelegateDraft = {
  fullName: string;
  email: string;
  school: string;
  brandAmbassadorName: string;
  munExperience: string;
} & CommitteePrefs;

export type DelegationDraft = {
  school: string;
  headName: string;
  headEmail: string;
  brandAmbassadorName: string;
  members: DelegateMember[];
  headCommitteePref1: string;
  headCommitteePref2: string;
  headCommitteePref3: string;
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

export function emptyCommitteePrefs(): CommitteePrefs {
  return {
    committeePref1: "",
    committeePref2: "",
    committeePref3: "",
  };
}

export function emptyDelegateDraft(): DelegateDraft {
  return {
    fullName: "",
    email: "",
    school: "",
    brandAmbassadorName: "",
    munExperience: "",
    ...emptyCommitteePrefs(),
  };
}

export function emptyDelegateMember(): DelegateMember {
  return {
    fullName: "",
    email: "",
    munExperience: "",
    ...emptyCommitteePrefs(),
  };
}

export function emptyDelegationDraft(): DelegationDraft {
  return {
    school: "",
    headName: "",
    headEmail: "",
    brandAmbassadorName: "",
    members: [emptyDelegateMember()],
    headCommitteePref1: "",
    headCommitteePref2: "",
    headCommitteePref3: "",
    munExperience: "",
  };
}
