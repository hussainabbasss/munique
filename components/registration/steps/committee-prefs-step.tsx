import { CommitteePrefFields } from "@/components/registration/committee-pref-fields";
import type { Committee } from "@/lib/types/admin";
import type { DelegateDraft, DelegationDraft } from "@/lib/registration/types";

type CommitteePrefsStepProps = {
  committees: Committee[];
  draft: DelegateDraft | DelegationDraft;
  onChange: (patch: Partial<DelegateDraft | DelegationDraft>) => void;
};

export function CommitteePrefsStep({
  committees,
  draft,
  onChange,
}: CommitteePrefsStepProps) {
  if (committees.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink-navy-soft">
        Committee preferences are unavailable right now. Please contact the
        Executive Board before continuing.
      </p>
    );
  }

  return (
    <CommitteePrefFields
      committees={committees}
      pref1={draft.committeePref1}
      pref2={draft.committeePref2}
      pref3={draft.committeePref3}
      munExperience={draft.munExperience}
      onPref1Change={(value) => onChange({ committeePref1: value })}
      onPref2Change={(value) => onChange({ committeePref2: value })}
      onPref3Change={(value) => onChange({ committeePref3: value })}
      onMunExperienceChange={(value) => onChange({ munExperience: value })}
    />
  );
}
