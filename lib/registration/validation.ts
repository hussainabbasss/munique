import type { Committee } from "@/lib/types/admin";
import {
  DELEGATION_MAX_DELEGATES,
  DELEGATION_MIN_DELEGATES,
  PAYMENT_PROOF_MAX_BYTES,
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
  if (!draft.school.trim()) return "School or institution is required.";
  return null;
}

export function validateDelegationSchoolHead(
  draft: DelegationDraft,
): string | null {
  if (!draft.school.trim()) return "School or institution is required.";
  if (!draft.headName.trim()) return "Head delegate name is required.";
  if (!draft.headEmail.trim() || !EMAIL_RE.test(draft.headEmail.trim())) {
    return "A valid head delegate email is required.";
  }
  return null;
}

export function validateDelegationMembers(
  draft: DelegationDraft,
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

  return null;
}

export function validateCommitteePrefs(
  draft: DelegateDraft | DelegationDraft,
  committees: Committee[],
): string | null {
  if (!draft.committeePref1) return "Committee preference 1 is required.";

  const publishedIds = new Set(committees.map((committee) => committee.id));
  const prefs = [
    draft.committeePref1,
    draft.committeePref2,
    draft.committeePref3,
  ].filter(Boolean);

  if (prefs.some((pref) => !publishedIds.has(pref))) {
    return "Selected committees are no longer available.";
  }

  if (!draft.munExperience.trim()) {
    return "MUN experience is required.";
  }

  return null;
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

export function getDelegateCount(portal: Portal, draft: DelegateDraft | DelegationDraft) {
  if (portal === "delegate") return 1;
  return 1 + (draft as DelegationDraft).members.length;
}
