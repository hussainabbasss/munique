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
      <p className="mt-6 rounded-sm border border-[rgba(63,107,74,0.35)] bg-[rgba(63,107,74,0.08)] px-4 py-3 text-sm text-ink-navy">
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.error && (
        <p className="text-sm text-[var(--status-error)]" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="submitter_name" className="mb-1 block text-sm font-medium">
          Your name
        </label>
        <input
          id="submitter_name"
          name="submitter_name"
          required
          className="w-full rounded-sm border border-[rgba(46,64,102,0.25)] bg-paper-white px-3 py-2 text-base"
        />
      </div>
      <div>
        <label htmlFor="submitter_email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="submitter_email"
          name="submitter_email"
          type="email"
          required
          className="w-full rounded-sm border border-[rgba(46,64,102,0.25)] bg-paper-white px-3 py-2 text-base"
        />
      </div>
      <div>
        <label htmlFor="registration_id" className="mb-1 block text-sm font-medium">
          Registration ID (optional)
        </label>
        <input
          id="registration_id"
          name="registration_id"
          placeholder="MUN-A7F2"
          className="w-full rounded-sm border border-[rgba(46,64,102,0.25)] bg-paper-white px-3 py-2 font-mono text-base"
        />
      </div>
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="w-full rounded-sm border border-[rgba(46,64,102,0.25)] bg-paper-white px-3 py-2 text-base"
        />
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          className="w-full rounded-sm border border-[rgba(46,64,102,0.25)] bg-paper-white px-3 py-2 text-base"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Submitting…" : "Submit query"}
      </button>
    </form>
  );
}
