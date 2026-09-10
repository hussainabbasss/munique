import type { Committee } from "@/lib/types/admin";
import {
  DELEGATION_MAX_DELEGATES,
  DELEGATION_MIN_DELEGATES,
  PAYMENT_PROOF_MAX_BYTES,
  type CommitteePrefs,
  type DelegateDraft,
  type DelegationDraft,
  type Portal,
} from "@/lib/registration/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDelegateAbout(draft: DelegateDraft): string | null {
  if (!draft.fullName.trim()) return "Full name is required.";
  if (!draft.email.trim() || !EMAIL_RE.test(draft.email.trim())) {
    return "A valid email is required.";
  }
  if (!draft.school.trim()) return "Delegation or group name is required.";
  return null;
}

export function validateDelegationSchoolHead(
  draft: DelegationDraft,
  committees: Committee[] = [],
): string | null {
  if (!draft.school.trim()) return "Delegation or group name is required.";
  if (!draft.headName.trim()) return "Head delegate name is required.";
  if (!draft.headEmail.trim() || !EMAIL_RE.test(draft.headEmail.trim())) {
    return "A valid head delegate email is required.";
  }

  if (committees.length === 0) {
    return "Committee preferences are unavailable. Please contact the EB.";
  }

  const publishedIds = new Set(committees.map((committee) => committee.id));
  const headError = validatePrefsForPerson(
    "Head delegate",
    {
      committeePref1: draft.headCommitteePref1,
      committeePref2: draft.headCommitteePref2,
      committeePref3: draft.headCommitteePref3,
    },
    publishedIds,
  );
  if (headError) return headError;

  if (!draft.munExperience.trim()) {
    return "Head delegate: MUN experience is required.";
  }

  return null;
}

export function validateDelegationMembers(
  draft: DelegationDraft,
  committees: Committee[] = [],
): string | null {
  const totalCount = 1 + draft.members.length;

  if (draft.members.some((member) => !member.fullName.trim())) {
    return "Every delegation member needs a full name.";
  }

  for (const member of draft.members) {
    if (member.email.trim() && !EMAIL_RE.test(member.email.trim())) {
      return "Member emails must be valid when provided.";
    }
  }

  if (totalCount < DELEGATION_MIN_DELEGATES) {
    return `A delegation must include at least ${DELEGATION_MIN_DELEGATES} delegates.`;
  }

  if (totalCount > DELEGATION_MAX_DELEGATES) {
    return `A delegation cannot exceed ${DELEGATION_MAX_DELEGATES} delegates.`;
  }

  if (committees.length === 0) {
    return "Committee preferences are unavailable. Please contact the EB.";
  }

  const publishedIds = new Set(committees.map((committee) => committee.id));
  for (let i = 0; i < draft.members.length; i++) {
    const member = draft.members[i];
    const label = `Member ${i + 1} (${member.fullName || "unnamed"})`;
    const prefsError = validatePrefsForPerson(label, member, publishedIds);
    if (prefsError) return prefsError;
    if (!member.munExperience.trim()) {
      return `${label}: MUN experience is required.`;
    }
  }

  return null;
}

function validatePrefsForPerson(
  label: string,
  prefs: CommitteePrefs,
  publishedIds: Set<string>,
): string | null {
  if (!prefs.committeePref1) {
    return `${label}: 1st committee choice is required.`;
  }

  const selected = [
    prefs.committeePref1,
    prefs.committeePref2,
    prefs.committeePref3,
  ].filter(Boolean);

  if (selected.some((pref) => !publishedIds.has(pref))) {
    return `${label}: selected committees are no longer available.`;
  }

  return null;
}

export function validateCommitteePrefs(
  draft: DelegateDraft | DelegationDraft,
  committees: Committee[],
  portal: Portal = "delegate",
): string | null {
  const publishedIds = new Set(committees.map((committee) => committee.id));

  if (portal === "delegate") {
    const delegateDraft = draft as DelegateDraft;
    const prefsError = validatePrefsForPerson(
      "You",
      delegateDraft,
      publishedIds,
    );
    if (prefsError) return prefsError;
    if (!delegateDraft.munExperience.trim()) {
      return "MUN experience is required.";
    }
    return null;
  }

  const delegationDraft = draft as DelegationDraft;
  const headError = validateDelegationSchoolHead(delegationDraft, committees);
  if (headError) return headError;
  return validateDelegationMembers(delegationDraft, committees);
}

export function validatePaymentProof(file: File | null): string | null {
  if (!file) return "Payment screenshot is required.";
  if (!file.type.startsWith("image/")) {
    return "Payment screenshot must be an image under 5 MB.";
  }
  if (file.size > PAYMENT_PROOF_MAX_BYTES) {
    return "Payment screenshot must be an image under 5 MB.";
  }
  return null;
}

export function getDelegateCount(
  portal: Portal,
  draft: DelegateDraft | DelegationDraft,
) {
  if (portal === "delegate") return 1;
  return 1 + (draft as DelegationDraft).members.length;
}
