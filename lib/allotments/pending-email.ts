type DelegateEmailRow = {
  email: string | null;
  is_head_delegate: boolean;
  allotment_email_sent_at: string | null;
};

type PendingEmailRegistration = {
  payment_status: string;
  type: "delegate" | "delegation";
  delegates: DelegateEmailRow[];
};

export function countPendingAllotmentEmails(
  reg: PendingEmailRegistration | null,
  hasCountry: boolean,
) {
  if (!reg || reg.payment_status !== "confirmed" || !hasCountry) return 0;

  const delegates = reg.delegates ?? [];

  if (reg.type === "delegation") {
    const head =
      delegates.find((d) => d.is_head_delegate && d.email) ??
      delegates.find((d) => d.email);
    if (!head || head.allotment_email_sent_at) return 0;
    return 1;
  }

  return delegates.filter((d) => d.email && !d.allotment_email_sent_at).length;
}

export function allotmentEmailStatus(
  reg: PendingEmailRegistration | null,
  hasCountry: boolean,
) {
  if (!reg || !hasCountry) return "—";

  const delegates = reg.delegates ?? [];
  const withEmail = delegates.filter((d) => d.email);

  if (reg.type === "delegation") {
    const head =
      withEmail.find((d) => d.is_head_delegate) ?? withEmail[0];
    if (!head) return "No head email";
    return head.allotment_email_sent_at ? "Head sent" : "Head not sent";
  }

  if (!withEmail.length) return "No email";
  const sent = withEmail.filter((d) => d.allotment_email_sent_at).length;
  if (sent === 0) return "Not sent";
  if (sent === withEmail.length) return "All sent";
  return `${sent}/${withEmail.length} sent`;
}

export function hasUnsentAllotmentEmails(
  reg: PendingEmailRegistration | null,
  status: string,
  hasCountry: boolean,
) {
  return countPendingAllotmentEmails(reg, hasCountry) > 0;
}

export function isAllotmentIssuedTab(
  reg: PendingEmailRegistration | null,
  status: string,
  hasCountry: boolean,
) {
  return status === "issued" && countPendingAllotmentEmails(reg, hasCountry) === 0;
}
