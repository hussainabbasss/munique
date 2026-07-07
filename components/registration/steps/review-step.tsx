"use client";

import { formatPkr } from "@/lib/utils/format";
import type { Committee } from "@/lib/types/admin";
import type {
  DelegateDraft,
  DelegationDraft,
  FeeBreakdown,
  Portal,
} from "@/lib/registration/types";

type ReviewStepProps = {
  portal: Portal;
  draft: DelegateDraft | DelegationDraft;
  committees: Committee[];
  fees: FeeBreakdown;
  onEdit: (stepIndex: number) => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
};

function committeeName(committees: Committee[], id: string) {
  return committees.find((committee) => committee.id === id)?.name ?? "—";
}

export function ReviewStep({
  portal,
  draft,
  committees,
  fees,
  onEdit,
  onBack,
  submitting,
  error,
  onSubmit,
}: ReviewStepProps) {
  const isDelegation = portal === "delegation";
  const delegationDraft = draft as DelegationDraft;
  const delegateDraft = draft as DelegateDraft;

  return (
    <div>
      {error && (
        <p className="registration-error" role="alert">
          {error}
        </p>
      )}

      {isDelegation ? (
        <>
          <section className="registration-review-section">
            <div className="registration-review-heading">
              <span>School &amp; head delegate</span>
              <button
                type="button"
                className="registration-review-edit"
                onClick={() => onEdit(0)}
              >
                Edit
              </button>
            </div>
            <div className="registration-review-body">
              <p>{delegationDraft.school}</p>
              <p>{delegationDraft.headName}</p>
              <p>{delegationDraft.headEmail}</p>
            </div>
          </section>

          <section className="registration-review-section">
            <div className="registration-review-heading">
              <span>Delegation members</span>
              <button
                type="button"
                className="registration-review-edit"
                onClick={() => onEdit(1)}
              >
                Edit
              </button>
            </div>
            <div className="registration-review-body">
              <ul className="list-none space-y-1 p-0">
                {delegationDraft.members.map((member, index) => (
                  <li key={index}>
                    {member.fullName}
                    {member.email ? ` · ${member.email}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : (
        <section className="registration-review-section">
          <div className="registration-review-heading">
            <span>About you</span>
            <button
              type="button"
              className="registration-review-edit"
              onClick={() => onEdit(0)}
            >
              Edit
            </button>
          </div>
          <div className="registration-review-body">
            <p>{delegateDraft.fullName}</p>
            <p>{delegateDraft.email}</p>
            <p>{delegateDraft.school}</p>
          </div>
        </section>
      )}

      <section className="registration-review-section">
        <div className="registration-review-heading">
          <span>Committee preferences</span>
          <button
            type="button"
            className="registration-review-edit"
            onClick={() => onEdit(isDelegation ? 2 : 1)}
          >
            Edit
          </button>
        </div>
        <div className="registration-review-body">
          <p>1. {committeeName(committees, draft.committeePref1)}</p>
          {draft.committeePref2 && (
            <p>2. {committeeName(committees, draft.committeePref2)}</p>
          )}
          {draft.committeePref3 && (
            <p>3. {committeeName(committees, draft.committeePref3)}</p>
          )}
          <p className="mt-2 whitespace-pre-wrap break-words registration-review-text">
            {draft.munExperience}
          </p>
        </div>
      </section>

      <section className="registration-review-section">
        <div className="registration-review-heading">
          <span>Payment</span>
          <button
            type="button"
            className="registration-review-edit"
            onClick={() => onEdit(isDelegation ? 3 : 2)}
          >
            Edit
          </button>
        </div>
        <div className="registration-review-body">
          {fees.delegateCount > 1 ? (
            <p>
              {formatPkr(fees.perDelegateFee)} × {fees.delegateCount} ={" "}
              {formatPkr(fees.totalFee)}
            </p>
          ) : (
            <p>{formatPkr(fees.totalFee)}</p>
          )}
          <p className="mt-2 text-sm text-ink-navy-soft">
            Payment will be verified by staff after you submit.
          </p>
        </div>
      </section>

      <div className="registration-wizard-nav">
        <button
          type="button"
          className="registration-btn-back"
          onClick={onBack}
          disabled={submitting}
        >
          ← Back
        </button>
        <button
          type="button"
          className="btn-primary registration-nav-primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit registration"}
        </button>
      </div>
    </div>
  );
}
