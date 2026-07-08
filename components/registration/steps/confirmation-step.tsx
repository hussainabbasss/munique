"use client";

import { useState } from "react";
import Link from "next/link";
import { SealStamp } from "@/components/registration/seal-stamp";
import { clearRegistrationDraft } from "@/lib/registration/draft";
import type { Portal } from "@/lib/registration/types";

type ConfirmationStepProps = {
  portal: Portal;
  registrationId: string;
  headEmail: string;
};

export function ConfirmationStep({
  portal,
  registrationId,
  headEmail,
}: ConfirmationStepProps) {
  const [copied, setCopied] = useState(false);
  const [announced, setAnnounced] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="registration-confirmation">
      <SealStamp size={112} onComplete={() => setAnnounced(true)} />
      <h2 className="registration-confirmation-title">
        Registration received
      </h2>

      <div className="registration-confirmation-plate">
        <p className="registration-confirmation-plate-label">
          Registration ID
        </p>
        <div className="registration-confirmation-id">
          <span id="registration-id-value">{registrationId}</span>
          <button
            type="button"
            className="registration-copy-btn"
            onClick={handleCopy}
            aria-describedby="registration-id-value"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {announced && (
        <p className="sr-only" aria-live="polite">
          Registration ID {registrationId} recorded.
        </p>
      )}
      <p className="registration-confirmation-note">
        Save your registration ID. You will receive an email at {headEmail}.
        Payment verification is pending.
      </p>
      <div className="registration-confirmation-links">
        <Link
          href="/"
          className="btn btn-ink"
          onClick={() => clearRegistrationDraft(portal)}
        >
          Return to homepage
        </Link>
        <Link
          href="/committees"
          className="btn btn-outline"
          onClick={() => clearRegistrationDraft(portal)}
        >
          View committees
        </Link>
      </div>
    </div>
  );
}
