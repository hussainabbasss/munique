"use client";

import { useActionState } from "react";
import { submitQueryAction } from "@/lib/admin/actions/team-queries";

export function ContactQueryForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) =>
      submitQueryAction(formData),
    null,
  );

  if (state?.success) {
    return (
      <div className="story-form-success" role="status">
        <p className="story-form-success-label">Query lodged</p>
        <p className="story-form-success-text">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={action} className="story-form">
      {state?.error && (
        <p className="story-form-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="story-field">
        <label htmlFor="submitter_name" className="story-label">
          Your name
        </label>
        <input
          id="submitter_name"
          name="submitter_name"
          required
          className="story-input"
        />
      </div>
      <div className="story-field">
        <label htmlFor="submitter_email" className="story-label">
          Email
        </label>
        <input
          id="submitter_email"
          name="submitter_email"
          type="email"
          required
          className="story-input"
        />
      </div>
      <div className="story-field">
        <label htmlFor="registration_id" className="story-label">
          Registration ID (optional)
        </label>
        <input
          id="registration_id"
          name="registration_id"
          placeholder="MUN-A7F2"
          className="story-input story-input-mono"
        />
      </div>
      <div className="story-field">
        <label htmlFor="subject" className="story-label">
          Subject
        </label>
        <input id="subject" name="subject" required className="story-input" />
      </div>
      <div className="story-field">
        <label htmlFor="body" className="story-label">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          className="story-textarea"
        />
      </div>
      <button
        type="submit"
        className="btn btn-signal story-submit"
        disabled={pending}
      >
        {pending ? "Submitting…" : "Submit query"}
      </button>
    </form>
  );
}
