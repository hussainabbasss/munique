"use client";

import { useActionState, useState } from "react";
import { saveRegistrationStatusAction } from "@/lib/admin/actions/overview";
import type { RegistrationStatusSettings } from "@/lib/types/admin";

type Props = {
  initial: RegistrationStatusSettings;
};

export function RegistrationStatusToggle({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);

  const [state, action, pending] = useActionState(
    async (
      _prev: { success?: string; error?: string } | null,
      formData: FormData,
    ) => saveRegistrationStatusAction(formData),
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
        <p className="admin-banner-preview-label">Register button</p>
        <div className="admin-banner-preview-track">
          {enabled ? (
            <p className="admin-banner-preview-message">
              Live — links to the registration portal
            </p>
          ) : (
            <p className="admin-banner-preview-hidden">
              Disabled — shows “{message || "…"}”
            </p>
          )}
        </div>
      </div>

      <div className="admin-checkbox-row">
        <input
          id="registration_enabled"
          name="enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <label htmlFor="registration_enabled">
          Registration open (register button links to the portal)
        </label>
      </div>

      <div className="admin-field">
        <label htmlFor="registration_message">Message when disabled</label>
        <input
          id="registration_message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={120}
          placeholder="Registrations aren’t live right now."
        />
      </div>

      <div className="admin-actions">
        <button type="submit" className="btn-admin-primary" disabled={pending}>
          {pending ? "Saving…" : "Save registration status"}
        </button>
      </div>
    </form>
  );
}
