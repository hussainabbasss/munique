"use client";

import { useActionState, useState } from "react";
import { PageLinkPicker } from "@/components/admin/page-link-picker";
import { saveBannerAction } from "@/lib/admin/actions/overview";
import type { StatusBannerSettings } from "@/lib/types/admin";

type Props = {
  initial: StatusBannerSettings;
};

export function BannerEditor({ initial }: Props) {
  const [message, setMessage] = useState(initial.message);
  const [visible, setVisible] = useState(initial.visible);

  const [state, action, pending] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) =>
      saveBannerAction(formData),
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
        <p className="admin-banner-preview-label">Public site preview</p>
        <div className="admin-banner-preview-track">
          {visible ? (
            <p className="admin-banner-preview-message">{message || "…"}</p>
          ) : (
            <p className="admin-banner-preview-hidden">Banner hidden</p>
          )}
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="banner_message">Message</label>
        <input
          id="banner_message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={120}
          required
        />
      </div>
      <div className="admin-field">
        <label htmlFor="banner_href">Link</label>
        <PageLinkPicker
          id="banner_href"
          name="href"
          value={initial.href}
          required
        />
      </div>
      <div className="admin-checkbox-row">
        <input
          id="banner_visible"
          name="visible"
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        <label htmlFor="banner_visible">Show on public site</label>
      </div>
      <div className="admin-actions">
        <button type="submit" className="btn-admin-primary" disabled={pending}>
          {pending ? "Saving…" : "Save banner"}
        </button>
      </div>
    </form>
  );
}
