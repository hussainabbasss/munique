"use client";

import { useActionState } from "react";
import { confirmPaymentAction } from "@/lib/admin/actions/registrations";
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
  created_at: string;
  delegates: Delegate[];
};

type Props = {
  registrations: RegistrationRow[];
};

function headName(reg: RegistrationRow) {
  return (
    reg.delegates?.find((d) => d.is_head_delegate)?.full_name ??
    reg.delegates?.[0]?.full_name ??
    "—"
  );
}

function PaymentToggle({
  registration,
  confirming,
  onConfirm,
}: {
  registration: RegistrationRow;
  confirming: boolean;
  onConfirm: (formData: FormData) => void;
}) {
  const isConfirmed = registration.payment_status === "confirmed";

  if (isConfirmed) {
    return (
      <span
        className="staff-payment-toggle staff-payment-toggle-on"
        aria-label="Payment confirmed"
      >
        <span className="staff-payment-toggle-thumb" />
        <span className="staff-payment-toggle-label">Paid</span>
      </span>
    );
  }

  if (registration.payment_status === "rejected") {
    return <span className="admin-field-hint">Rejected</span>;
  }

  return (
    <form action={onConfirm}>
      <input type="hidden" name="registration_id" value={registration.id} />
      <button
        type="submit"
        className="staff-payment-toggle"
        disabled={confirming}
        aria-label="Confirm payment"
        title="Confirm payment"
      >
        <span className="staff-payment-toggle-thumb" />
        <span className="staff-payment-toggle-label">
          {confirming ? "…" : "Confirm"}
        </span>
      </button>
    </form>
  );
}

export function RegistrationsStaffBoard({ registrations }: Props) {
  const [confirmState, confirmAction, confirming] = useActionState(
    async (
      _prev: { success?: string; error?: string } | null,
      formData: FormData,
    ) => {
      const id = String(formData.get("registration_id"));
      return confirmPaymentAction(id);
    },
    null,
  );

  return (
    <>
      {confirmState?.success && (
        <p className="admin-toast admin-toast-success" role="status">
          {confirmState.success}
        </p>
      )}
      {confirmState?.error && (
        <p className="admin-toast admin-toast-error" role="alert">
          {confirmState.error}
        </p>
      )}

      {registrations.length === 0 ? (
        <p className="admin-empty">No registrations yet</p>
      ) : (
        <ul className="staff-reg-list">
          {registrations.map((reg) => (
            <li key={reg.id} className="staff-reg-card">
              <div className="staff-reg-main">
                <div>
                  <p className="staff-reg-id">{reg.registration_id}</p>
                  <p className="staff-reg-name">{headName(reg)}</p>
                  <p className="staff-reg-meta">
                    {reg.school} · {reg.type} · {formatPkr(reg.fee_amount)}
                  </p>
                  <p className="staff-reg-meta">{reg.head_email}</p>
                  <p className="staff-reg-meta">
                    Submitted {formatDate(reg.created_at)}
                  </p>
                </div>

                <div className="staff-reg-actions">
                  <PaymentToggle
                    registration={reg}
                    confirming={confirming}
                    onConfirm={confirmAction}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
