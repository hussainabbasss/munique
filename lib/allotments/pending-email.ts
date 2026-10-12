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

/**
 * A delegation member with no email of their own is told through their head
 * delegate: one summary email per delegation with everyone's allotment.
 */
export function isViaHeadDelegate(
  reg: PendingEmailRegistration | null,
  delegate?: DelegateEmailRow | null,
) {
  return reg?.type === "delegation" && Boolean(delegate) && !delegate?.email;
}

/** Waiting on the head delegate's summary email. */
export function awaitsHeadSummary(
  reg: PendingEmailRegistration | null,
  hasCountry: boolean,
  delegate?: DelegateEmailRow | null,
) {
  return (
    reg?.payment_status === "confirmed" &&
    hasCountry &&
    isViaHeadDelegate(reg, delegate) &&
    !delegate?.allotment_email_sent_at
  );
}

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
    if (isViaHeadDelegate(reg, delegate)) {
      return delegate.allotment_email_sent_at ? "Sent to head" : "Not sent (via head)";
    }
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
    countPendingAllotmentEmails(reg, hasCountry, delegate) === 0 &&
    !awaitsHeadSummary(reg, hasCountry, delegate)
  );
}
