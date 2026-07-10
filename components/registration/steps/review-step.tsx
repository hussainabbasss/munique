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
              <span>Delegation &amp; head</span>
              <button
                type="button"
                className="registration-review-edit"
                onClick={() => onEdit(0)}
              >
                Edit
              </button>
            </div>
            <div className="registration-review-body">
              <div className="registration-review-row">
                <span className="registration-review-key">Delegation</span>
                <span className="registration-review-value">
                  {delegationDraft.school}
                </span>
              </div>
              <div className="registration-review-row">
                <span className="registration-review-key">Head delegate</span>
                <span className="registration-review-value">
                  {delegationDraft.headName}
                </span>
              </div>
              <div className="registration-review-row">
                <span className="registration-review-key">Email</span>
                <span className="registration-review-value">
                  {delegationDraft.headEmail}
                </span>
              </div>
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
              <ul className="registration-review-list">
                {delegationDraft.members.map((member, index) => (
                  <li key={index} className="registration-review-row">
                    <span className="registration-review-key">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="registration-review-value">
                      {member.fullName}
                      {member.email ? ` · ${member.email}` : ""}
                    </span>
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
            <div className="registration-review-row">
              <span className="registration-review-key">Name</span>
              <span className="registration-review-value">
                {delegateDraft.fullName}
              </span>
            </div>
            <div className="registration-review-row">
              <span className="registration-review-key">Email</span>
              <span className="registration-review-value">
                {delegateDraft.email}
              </span>
            </div>
            <div className="registration-review-row">
              <span className="registration-review-key">School</span>
              <span className="registration-review-value">
                {delegateDraft.school}
              </span>
            </div>
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
          <div className="registration-review-row">
            <span className="registration-review-key">Choice 1</span>
            <span className="registration-review-value">
              {committeeName(committees, draft.committeePref1)}
            </span>
          </div>
          {draft.committeePref2 && (
            <div className="registration-review-row">
              <span className="registration-review-key">Choice 2</span>
              <span className="registration-review-value">
                {committeeName(committees, draft.committeePref2)}
              </span>
            </div>
          )}
          {draft.committeePref3 && (
            <div className="registration-review-row">
              <span className="registration-review-key">Choice 3</span>
              <span className="registration-review-value">
                {committeeName(committees, draft.committeePref3)}
              </span>
            </div>
          )}
          <div className="registration-review-row">
            <span className="registration-review-key">Experience</span>
            <span className="registration-review-value registration-review-prewrap">
              {draft.munExperience}
            </span>
          </div>
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
          <div className="registration-review-row">
            <span className="registration-review-key">Fee</span>
            <span className="registration-review-value">
              {fees.delegateCount > 1 ? (
                <>
                  {formatPkr(fees.perDelegateFee)} × {fees.delegateCount} ={" "}
                  {formatPkr(fees.totalFee)}
                </>
              ) : (
                <>{formatPkr(fees.totalFee)}</>
              )}
            </span>
          </div>
          <p className="registration-review-footnote">
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
          <span className="arrow" aria-hidden="true">
            ←
          </span>
          Back
        </button>
        <button
          type="button"
          className="btn btn-signal registration-nav-primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit registration"}
        </button>
      </div>
    </div>
  );
}
