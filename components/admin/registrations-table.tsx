"use client";

import { useActionState, useState } from "react";
import {
  confirmPaymentAction,
  rejectPaymentAction,
  resendRegistrationEmailAction,
} from "@/lib/admin/actions/registrations";
import { formatDate, formatPkr } from "@/lib/utils/format";

type Delegate = {
  full_name: string;
  email: string | null;
  is_head_delegate: boolean;
};

type RegistrationRow = {
  id: string;
  registration_id: string;
  type: string;
  payment_status: string;
  fee_amount: number;
  school: string;
  head_email: string;
  mun_experience: string;
  created_at: string;
  payment_proof_path: string | null;
  registration_email_sent_at: string | null;
  payment_email_sent_at: string | null;
  delegates: Delegate[];
  committee_pref_1: { name: string } | null;
};

type Props = {
  registrations: RegistrationRow[];
  paymentProofUrls: Record<string, string | null>;
};

function paymentClass(status: string) {
  if (status === "confirmed") return "payment-confirmed";
  if (status === "rejected") return "payment-rejected";
  return "payment-pending";
}

function paymentLabel(status: string) {
  if (status === "confirmed") return "● Conf";
  if (status === "rejected") return "✕ Rej";
  return "◐ Pend";
}

export function RegistrationsTable({ registrations, paymentProofUrls }: Props) {
  const [selected, setSelected] = useState<RegistrationRow | null>(null);
  const [confirmState, confirmAction, confirming] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const id = String(formData.get("registration_id"));
      const result = await confirmPaymentAction(id);
      if (result.success) setSelected(null);
      return result;
    },
    null,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const id = String(formData.get("registration_id"));
      const result = await rejectPaymentAction(id);
      if (result.success) setSelected(null);
      return result;
    },
    null,
  );
  const [resendState, resendAction, resending] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const id = String(formData.get("registration_id"));
      return resendRegistrationEmailAction(id);
    },
    null,
  );

  const headName = (r: RegistrationRow) => {
    if (r.type === "delegation") {
      const count = r.delegates?.length ?? 0;
      const head =
        r.delegates?.find((d) => d.is_head_delegate)?.full_name ??
        r.delegates?.[0]?.full_name ??
        "—";
      return `${r.school || head} (${count})`;
    }

    return (
      r.delegates?.find((d) => d.is_head_delegate)?.full_name ??
      r.delegates?.[0]?.full_name ??
      "—"
    );
  };

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Committee pref</th>
              <th>Payment</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  No registrations yet
                </td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.registration_id}</td>
                  <td>{headName(r)}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {r.type === "delegate" ? "Delegate" : "Delegation"}
                  </td>
                  <td>{r.committee_pref_1?.name ?? "—"}</td>
                  <td className={paymentClass(r.payment_status)}>
                    {paymentLabel(r.payment_status)}
                  </td>
                  <td>{formatDate(r.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      onClick={() => setSelected(r)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div
            className="admin-modal-backdrop"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <div className="admin-modal" role="dialog" aria-labelledby="reg-detail-title">
            <h2 id="reg-detail-title" className="admin-modal-title mono">
              {selected.registration_id}
            </h2>
            <div className="admin-modal-body">
              <p>
                <strong>{headName(selected)}</strong> · {selected.head_email}
              </p>
              <p>Delegation: {selected.school || "—"}</p>
              <p>Fee: {formatPkr(selected.fee_amount)}</p>
              <p>MUN experience: {selected.mun_experience || "—"}</p>
              {selected.delegates?.length > 1 && (
                <div>
                  <p>
                    <strong>Delegation members:</strong>
                  </p>
                  <ul>
                    {selected.delegates.map((d) => (
                      <li key={d.full_name}>
                        {d.full_name}
                        {d.is_head_delegate ? " (head)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.payment_proof_path && paymentProofUrls[selected.id] && (
                <p>
                  <a
                    href={paymentProofUrls[selected.id]!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View payment proof
                  </a>
                </p>
              )}
              <p className="admin-field-hint">
                Reg email:{" "}
                {selected.registration_email_sent_at ? "Sent" : "Not sent"} · Payment
                email: {selected.payment_email_sent_at ? "Sent" : "Not sent"}
              </p>
              <form action={resendAction} className="admin-actions">
                <input type="hidden" name="registration_id" value={selected.id} />
                <button
                  type="submit"
                  className="btn-admin-secondary"
                  disabled={resending}
                >
                  {resending
                    ? "Sending…"
                    : selected.registration_email_sent_at
                      ? "Resend registration email"
                      : "Send registration email"}
                </button>
                {resendState?.success && (
                  <span className="admin-field-hint">{resendState.success}</span>
                )}
                {resendState?.error && (
                  <span className="admin-toast admin-toast-error">
                    {resendState.error}
                  </span>
                )}
              </form>
            </div>

            {confirmState?.success && (
              <p className="admin-toast admin-toast-success">{confirmState.success}</p>
            )}
            {confirmState?.error && (
              <p className="admin-toast admin-toast-error">{confirmState.error}</p>
            )}
            {rejectState?.success && (
              <p className="admin-toast admin-toast-success">{rejectState.success}</p>
            )}

            {selected.payment_status === "pending" && (
              <div className="admin-actions">
                <form action={confirmAction}>
                  <input type="hidden" name="registration_id" value={selected.id} />
                  <button
                    type="submit"
                    className="btn-admin-primary"
                    disabled={confirming}
                  >
                    Confirm payment
                  </button>
                </form>
                <form action={rejectAction} style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="hidden" name="registration_id" value={selected.id} />
                  <input name="reason" placeholder="Reject reason (optional)" />
                  <button
                    type="submit"
                    className="btn-admin-secondary btn-admin-danger"
                    disabled={rejecting}
                  >
                    Reject
                  </button>
                </form>
              </div>
            )}

            <button
              type="button"
              className="btn-admin-secondary"
              style={{ marginTop: "1rem" }}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </>
      )}
    </>
  );
}
