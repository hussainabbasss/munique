"use client";

import { useActionState, useState } from "react";
import {
  confirmPaymentAction,
  rejectPaymentAction,
  resendRegistrationEmailAction,
} from "@/lib/admin/actions/registrations";
import { RegistrationProfileDialog } from "@/components/admin/registration-profile-dialog";
import { formatDate } from "@/lib/utils/format";

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
  brand_ambassador_name: string | null;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = registrations.find((r) => r.id === selectedId) ?? null;

  const [confirmState, confirmAction, confirming] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const id = String(formData.get("registration_id"));
      const result = await confirmPaymentAction(id);
      if (result.success) setSelectedId(null);
      return result;
    },
    null,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const id = String(formData.get("registration_id"));
      const result = await rejectPaymentAction(id);
      if (result.success) setSelectedId(null);
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
                  <td>
                    <button
                      type="button"
                      className="admin-name-link"
                      onClick={() => setSelectedId(r.id)}
                    >
                      {headName(r)}
                    </button>
                  </td>
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
                      onClick={() => setSelectedId(r.id)}
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

      <RegistrationProfileDialog
        registrationUuid={selectedId}
        onClose={() => setSelectedId(null)}
        paymentProofUrl={
          selected ? paymentProofUrls[selected.id] ?? null : null
        }
        footer={
          selected ? (
            <div className="admin-profile-footer">
              {confirmState?.success && (
                <p className="admin-toast admin-toast-success">
                  {confirmState.success}
                </p>
              )}
              {confirmState?.error && (
                <p className="admin-toast admin-toast-error">
                  {confirmState.error}
                </p>
              )}
              {rejectState?.success && (
                <p className="admin-toast admin-toast-success">
                  {rejectState.success}
                </p>
              )}
              {rejectState?.error && (
                <p className="admin-toast admin-toast-error">
                  {rejectState.error}
                </p>
              )}

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

              {selected.payment_status === "pending" && (
                <div className="admin-actions">
                  <form action={confirmAction}>
                    <input
                      type="hidden"
                      name="registration_id"
                      value={selected.id}
                    />
                    <button
                      type="submit"
                      className="btn-admin-primary"
                      disabled={confirming}
                    >
                      Confirm payment
                    </button>
                  </form>
                  <form
                    action={rejectAction}
                    style={{ display: "flex", gap: "0.5rem" }}
                  >
                    <input
                      type="hidden"
                      name="registration_id"
                      value={selected.id}
                    />
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
            </div>
          ) : null
        }
      />
    </>
  );
}
