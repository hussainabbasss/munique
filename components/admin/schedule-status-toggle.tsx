"use client";

import { useActionState, useState } from "react";
import { saveScheduleStatusAction } from "@/lib/admin/actions/overview";
import type { ScheduleStatusSettings } from "@/lib/types/admin";

type Props = {
  initial: ScheduleStatusSettings;
};

export function ScheduleStatusToggle({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled);

  const [state, action, pending] = useActionState(
    async (
      _prev: { success?: string; error?: string } | null,
      formData: FormData,
    ) => saveScheduleStatusAction(formData),
    null,
  );

  return (
    <form action={action} className="admin-form-grid">
      {state?.success && (
        <p className="admin-toast admin-toast-success" role="status">
          {state.success}
        </p>
      )}
      {state?.error && (
        <p className="admin-toast admin-toast-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="admin-banner-preview" aria-live="polite">
        <p className="admin-banner-preview-label">Schedule page</p>
        <div className="admin-banner-preview-track">
          {enabled ? (
            <p className="admin-banner-preview-message">
              Live — order of proceedings is public
            </p>
          ) : (
            <p className="admin-banner-preview-hidden">
              Coming soon — nav link dimmed, route shows a placeholder
            </p>
          )}
        </div>
      </div>

      <div className="admin-checkbox-row">
        <input
          id="schedule_enabled"
          name="enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <label htmlFor="schedule_enabled">
          Schedule published (uncheck to show “Coming soon”)
        </label>
      </div>

      <div className="admin-actions">
        <button type="submit" className="btn-admin-primary" disabled={pending}>
          {pending ? "Saving…" : "Save schedule status"}
        </button>
      </div>
    </form>
  );
}
