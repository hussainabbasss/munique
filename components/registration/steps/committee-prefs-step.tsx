"use client";

import { CommitteePrefFields } from "@/components/registration/committee-pref-fields";
import type { Committee } from "@/lib/types/admin";
import type { DelegateDraft, DelegationDraft } from "@/lib/registration/types";

type CommitteePrefsStepProps = {
  committees: Committee[];
  draft: DelegateDraft | DelegationDraft;
  portal: "delegate" | "delegation";
  onChange: (patch: Partial<DelegateDraft> | Partial<DelegationDraft>) => void;
};

/** Individual-delegate portal only — delegation prefs live on earlier steps. */
export function CommitteePrefsStep({
  committees,
  draft,
  portal,
  onChange,
}: CommitteePrefsStepProps) {
  if (portal !== "delegate") {
    return null;
  }

  if (committees.length === 0) {
    return (
      <p className="registration-empty-note">
        Committee preferences are unavailable right now. Please contact the
        Executive Board before continuing.
      </p>
    );
  }

  const delegateDraft = draft as DelegateDraft;
  return (
    <CommitteePrefFields
      committees={committees}
      pref1={delegateDraft.committeePref1}
      pref2={delegateDraft.committeePref2}
      pref3={delegateDraft.committeePref3}
      munExperience={delegateDraft.munExperience}
      onPref1Change={(value) => onChange({ committeePref1: value })}
      onPref2Change={(value) => onChange({ committeePref2: value })}
      onPref3Change={(value) => onChange({ committeePref3: value })}
      onMunExperienceChange={(value) => onChange({ munExperience: value })}
    />
  );
}
