import { CommitteePrefFields } from "@/components/registration/committee-pref-fields";
import type { Committee } from "@/lib/types/admin";
import type { DelegationDraft } from "@/lib/registration/types";

type SchoolHeadStepProps = {
  draft: DelegationDraft;
  committees: Committee[];
  onChange: (patch: Partial<DelegationDraft>) => void;
};

export function SchoolHeadStep({
  draft,
  committees,
  onChange,
}: SchoolHeadStepProps) {
  return (
    <div className="registration-field-group">
      <div>
        <label htmlFor="school" className="registration-label">
          Delegation / group name
        </label>
        <input
          id="school"
          className="registration-field"
          value={draft.school}
          onChange={(event) => onChange({ school: event.target.value })}
          autoComplete="organization"
          required
        />
      </div>
      <div>
        <label htmlFor="head_name" className="registration-label">
          Head delegate — full name
        </label>
        <input
          id="head_name"
          className="registration-field"
          value={draft.headName}
          onChange={(event) => onChange({ headName: event.target.value })}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label htmlFor="head_email" className="registration-label">
          Head delegate — email
        </label>
        <input
          id="head_email"
          type="email"
          className="registration-field"
          value={draft.headEmail}
          onChange={(event) => onChange({ headEmail: event.target.value })}
          autoComplete="email"
          required
        />
      </div>
      <div className="registration-field-optional">
        <label htmlFor="brand_ambassador_name" className="registration-label">
          Brand Ambassador
        </label>
        <input
          id="brand_ambassador_name"
          className="registration-field"
          value={draft.brandAmbassadorName}
          onChange={(event) =>
            onChange({ brandAmbassadorName: event.target.value })
          }
          autoComplete="off"
        />
        <p className="registration-field-hint">Optional — enter name if applicable</p>
      </div>

      <section className="registration-person-prefs">
        <h3 className="registration-person-prefs-title">
          Head — committee &amp; experience
        </h3>
        <CommitteePrefFields
          idPrefix="head"
          committees={committees}
          pref1={draft.headCommitteePref1}
          pref2={draft.headCommitteePref2}
          pref3={draft.headCommitteePref3}
          munExperience={draft.munExperience}
          hideIntro
          onPref1Change={(value) => onChange({ headCommitteePref1: value })}
          onPref2Change={(value) => onChange({ headCommitteePref2: value })}
          onPref3Change={(value) => onChange({ headCommitteePref3: value })}
          onMunExperienceChange={(value) => onChange({ munExperience: value })}
        />
      </section>
    </div>
  );
}
