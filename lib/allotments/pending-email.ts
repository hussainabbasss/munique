type DelegateEmailRow = {
  email: string | null;
  is_head_delegate?: boolean;
  allotment_email_sent_at: string | null;
};

type PendingEmailRegistration = {
  payment_status: string;
  type?: "delegate" | "delegation";
  delegates?: DelegateEmailRow[];
};

/** Count pending emails for a single allotment tied to one delegate. */
export function countPendingAllotmentEmails(
  reg: PendingEmailRegistration | null,
  hasCountry: boolean,
  delegate?: DelegateEmailRow | null,
) {
  if (!reg || reg.payment_status !== "confirmed" || !hasCountry) return 0;

  if (delegate) {
    if (!delegate.email || delegate.allotment_email_sent_at) return 0;
    return 1;
  }

  const delegates = reg.delegates ?? [];
  return delegates.filter((d) => d.email && !d.allotment_email_sent_at).length;
}

export function allotmentEmailStatus(
  reg: PendingEmailRegistration | null,
  hasCountry: boolean,
  delegate?: DelegateEmailRow | null,
) {
  if (!reg || !hasCountry) return "—";

  if (delegate) {
    if (!delegate.email) return "No email";
    return delegate.allotment_email_sent_at ? "Sent" : "Not sent";
  }

  const delegates = reg.delegates ?? [];
  const withEmail = delegates.filter((d) => d.email);
  if (!withEmail.length) return "No email";
  const sent = withEmail.filter((d) => d.allotment_email_sent_at).length;
  if (sent === 0) return "Not sent";
  if (sent === withEmail.length) return "All sent";
  return `${sent}/${withEmail.length} sent`;
}

export function isAllotmentIssuedTab(
  reg: PendingEmailRegistration | null,
  status: string,
  hasCountry: boolean,
  delegate?: DelegateEmailRow | null,
) {
  return (
    status === "issued" &&
    countPendingAllotmentEmails(reg, hasCountry, delegate) === 0
  );
}
