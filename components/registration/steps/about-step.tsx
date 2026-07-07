import type { DelegateDraft } from "@/lib/registration/types";

type AboutStepProps = {
  draft: DelegateDraft;
  onChange: (patch: Partial<DelegateDraft>) => void;
};

export function AboutStep({ draft, onChange }: AboutStepProps) {
  return (
    <div className="registration-field-group">
      <div>
        <label htmlFor="full_name" className="registration-label">
          Full name
        </label>
        <input
          id="full_name"
          className="registration-field"
          value={draft.fullName}
          onChange={(event) => onChange({ fullName: event.target.value })}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="registration-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="registration-field"
          value={draft.email}
          onChange={(event) => onChange({ email: event.target.value })}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label htmlFor="school" className="registration-label">
          School / institution
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
    </div>
  );
}
