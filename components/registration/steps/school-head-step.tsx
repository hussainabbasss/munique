import type { DelegationDraft } from "@/lib/registration/types";

type SchoolHeadStepProps = {
  draft: DelegationDraft;
  onChange: (patch: Partial<DelegationDraft>) => void;
};

export function SchoolHeadStep({ draft, onChange }: SchoolHeadStepProps) {
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
    </div>
  );
}
