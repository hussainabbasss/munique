"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getRegistrationProfileAction } from "@/lib/admin/actions/registration-profile";
import type { RegistrationProfile } from "@/lib/admin/registration-profile";
import { formatDate, formatPkr } from "@/lib/utils/format";

type Props = {
  registrationUuid: string | null;
  focusDelegateId?: string | null;
  onClose: () => void;
  paymentProofUrl?: string | null;
  footer?: ReactNode;
};

function prefsLabel(delegate: RegistrationProfile["delegates"][number]) {
  const names = [delegate.pref1_name, delegate.pref2_name, delegate.pref3_name]
    .filter(Boolean)
    .join(" · ");
  return names || "—";
}

function paymentLabel(status: string) {
  if (status === "confirmed") return "Confirmed";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export function RegistrationProfileDialog({
  registrationUuid,
  focusDelegateId = null,
  onClose,
  paymentProofUrl = null,
  footer,
}: Props) {
  const [profile, setProfile] = useState<RegistrationProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!registrationUuid) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);

    void getRegistrationProfileAction(registrationUuid).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("profile" in result) {
        setProfile(result.profile);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [registrationUuid]);

  if (!registrationUuid) return null;

  const isDelegation = profile?.type === "delegation";

  return (
    <>
      <div
        className="admin-modal-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="admin-modal admin-profile-modal"
        role="dialog"
        aria-labelledby="admin-profile-title"
        aria-busy={loading}
      >
        <div className="admin-profile-modal-head">
          <div>
            <p className="admin-profile-kicker mono">
              {loading
                ? "Loading…"
                : profile
                  ? profile.type === "delegation"
                    ? "Delegation profile"
                    : "Delegate profile"
                  : "Profile"}
            </p>
            <h2 id="admin-profile-title" className="admin-modal-title mono">
              {profile?.registration_id ?? "—"}
            </h2>
          </div>
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="admin-modal-body admin-profile-modal-body">
          {loading && (
            <p className="admin-field-hint">Loading registration details…</p>
          )}
          {error && (
            <p className="admin-toast admin-toast-error" role="alert">
              {error}
            </p>
          )}

          {profile && (
            <>
              <dl className="admin-profile-meta">
                <div>
                  <dt>Type</dt>
                  <dd style={{ textTransform: "capitalize" }}>{profile.type}</dd>
                </div>
                <div>
                  <dt>School / group</dt>
                  <dd>{profile.school || "—"}</dd>
                </div>
                <div>
                  <dt>Contact email</dt>
                  <dd>{profile.head_email}</dd>
                </div>
                <div>
                  <dt>Fee</dt>
                  <dd>{formatPkr(profile.fee_amount)}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>{paymentLabel(profile.payment_status)}</dd>
                </div>
                <div>
                  <dt>Registered</dt>
                  <dd>{formatDate(profile.created_at)}</dd>
                </div>
                {profile.brand_ambassador_name && (
                  <div>
                    <dt>Brand Ambassador</dt>
                    <dd>{profile.brand_ambassador_name}</dd>
                  </div>
                )}
              </dl>

              {paymentProofUrl && (
                <p>
                  <a
                    href={paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View payment proof
                  </a>
                </p>
              )}

              <p className="admin-field-hint">
                Reg email:{" "}
                {profile.registration_email_sent_at ? "Sent" : "Not sent"} ·
                Payment email:{" "}
                {profile.payment_email_sent_at ? "Sent" : "Not sent"}
              </p>

              {!isDelegation && profile.delegates[0] && (
                <section className="admin-profile-section">
                  <h3 className="admin-profile-section-title">Delegate</h3>
                  <DelegateDetail
                    delegate={profile.delegates[0]}
                    highlighted={
                      focusDelegateId
                        ? profile.delegates[0].id === focusDelegateId
                        : true
                    }
                  />
                </section>
              )}

              {isDelegation && (
                <section className="admin-profile-section">
                  <h3 className="admin-profile-section-title">
                    Members ({profile.delegates.length})
                  </h3>
                  <div className="admin-table-wrap admin-profile-table-wrap">
                    <table className="admin-table admin-profile-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Committee prefs</th>
                          <th>Experience</th>
                          <th>Allotment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.delegates.map((delegate) => {
                          const highlighted =
                            focusDelegateId != null &&
                            delegate.id === focusDelegateId;
                          return (
                            <tr
                              key={delegate.id}
                              className={
                                highlighted
                                  ? "admin-profile-row-focus"
                                  : undefined
                              }
                            >
                              <td>
                                {delegate.full_name}
                                {delegate.is_head_delegate ? " (head)" : ""}
                              </td>
                              <td>{delegate.email || "—"}</td>
                              <td>{prefsLabel(delegate)}</td>
                              <td className="admin-profile-experience">
                                {delegate.mun_experience || "—"}
                              </td>
                              <td>
                                {delegate.allotment?.country ||
                                delegate.allotment?.committee_name ? (
                                  <>
                                    {delegate.allotment.committee_name ?? "—"}
                                    {delegate.allotment.country
                                      ? ` · ${delegate.allotment.country}`
                                      : ""}
                                  </>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {footer}
      </div>
    </>
  );
}

function DelegateDetail({
  delegate,
  highlighted,
}: {
  delegate: RegistrationProfile["delegates"][number];
  highlighted: boolean;
}) {
  return (
    <div
      className={`admin-profile-person${highlighted ? " admin-profile-person-focus" : ""}`}
    >
      <p className="admin-profile-person-name">
        <strong>{delegate.full_name}</strong>
        {delegate.email ? ` · ${delegate.email}` : ""}
      </p>
      <dl className="admin-profile-meta">
        <div>
          <dt>1st choice</dt>
          <dd>{delegate.pref1_name ?? "—"}</dd>
        </div>
        <div>
          <dt>2nd choice</dt>
          <dd>{delegate.pref2_name ?? "—"}</dd>
        </div>
        <div>
          <dt>3rd choice</dt>
          <dd>{delegate.pref3_name ?? "—"}</dd>
        </div>
        <div className="admin-profile-meta-span">
          <dt>MUN experience</dt>
          <dd className="admin-profile-experience">
            {delegate.mun_experience || "—"}
          </dd>
        </div>
        {(delegate.allotment?.country ||
          delegate.allotment?.committee_name) && (
          <>
            <div>
              <dt>Allotted committee</dt>
              <dd>{delegate.allotment?.committee_name ?? "—"}</dd>
            </div>
            <div>
              <dt>Allotted country</dt>
              <dd>{delegate.allotment?.country ?? "—"}</dd>
            </div>
            <div>
              <dt>Allotment status</dt>
              <dd style={{ textTransform: "capitalize" }}>
                {delegate.allotment?.status ?? "—"}
                {delegate.allotment?.merit_score != null
                  ? ` · merit ${delegate.allotment.merit_score}`
                  : ""}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}
