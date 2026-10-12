import { Resend } from "resend";
import {
  PAYMENT_WHATSAPP,
  paymentWhatsAppLink,
} from "@/lib/registration/payment";

export type EmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/** Verified Resend sending domain (munique.systemsummit.online). */
const FROM = "Munique 2026 <registration@munique.systemsummit.online>";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseHtml(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; color: #16233F; background: #FDFBF6; padding: 2rem;">
  <div style="max-width: 520px; margin: 0 auto;">
    ${body}
    <p style="margin-top: 2rem; font-size: 0.875rem; color: #2E4066;">— Munique 2026, Edition I</p>
  </div>
</body>
</html>`;
}

async function sendEmail(params: {
  kind: string;
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  if (!resend) {
    const error = "Resend not configured — set RESEND_API_KEY in .env.local";
    console.error(`[email] ${params.kind}: ${error}`);
    return { ok: false, error };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error(`[email] ${params.kind} failed`, {
      to: params.to,
      from: FROM,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}

export async function sendRegistrationReceived(params: {
  to: string;
  registrationId: string;
  feeAmount: number;
  bankAccountTitle: string;
  bankDetails: string;
  paymentInstructions: string;
}): Promise<EmailResult> {
  const {
    registrationId,
    feeAmount,
    bankAccountTitle,
    bankDetails,
    paymentInstructions,
  } = params;

  const feeLabel = `PKR ${feeAmount.toLocaleString("en-PK")}`;
  const whatsapp = PAYMENT_WHATSAPP;
  const whatsappHref = paymentWhatsAppLink();

  const html = baseHtml(`
    <p>Your registration has been received.</p>
    <p>Registration ID: <strong style="font-family: monospace;">${escapeHtml(registrationId)}</strong></p>
    <p>Amount due: <strong>${escapeHtml(feeLabel)}</strong></p>
    <p style="margin-top: 1.5rem;"><strong>Payment details</strong></p>
    <p>Account title: ${escapeHtml(bankAccountTitle)}</p>
    <p style="white-space: pre-wrap;">${escapeHtml(bankDetails)}</p>
    <p style="white-space: pre-wrap;">${escapeHtml(paymentInstructions)}</p>
    <p style="margin-top: 1.5rem;"><strong>Submit your payment screenshot</strong></p>
    <p>After transferring, send your payment screenshot on WhatsApp to
      <a href="${whatsappHref}">${escapeHtml(whatsapp)}</a>
      and include your registration ID (<strong style="font-family: monospace;">${escapeHtml(registrationId)}</strong>).
    </p>
    <p>You will receive another email once staff have verified your payment.</p>
  `);

  return sendEmail({
    kind: "sendRegistrationReceived",
    to: params.to,
    subject: "Registration received — Munique 2026",
    html,
  });
}

export async function sendPaymentConfirmed(params: {
  to: string;
  registrationId: string;
}): Promise<EmailResult> {
  const html = baseHtml(`
    <p>Your payment has been verified.</p>
    <p>Registration ID: <strong style="font-family: monospace;">${params.registrationId}</strong></p>
    <p>Your registration is now confirmed. Allotment details will be sent separately when the Executive Board issues allotments.</p>
  `);

  return sendEmail({
    kind: "sendPaymentConfirmed",
    to: params.to,
    subject: "Payment confirmed — Munique 2026",
    html,
  });
}

export async function sendAllotmentIssued(params: {
  to: string;
  committee: string;
  country: string;
}): Promise<EmailResult> {
  const html = baseHtml(`
    <p>Your allotment has been issued.</p>
    <p>Committee: <strong>${escapeHtml(params.committee)}</strong><br>
    Country: <strong>${escapeHtml(params.country)}</strong></p>
  `);

  return sendEmail({
    kind: "sendAllotmentIssued",
    to: params.to,
    subject: "Your allotment — Munique 2026",
    html,
  });
}

/** Sent when an already-issued allotment is changed — replaces the earlier email. */
export async function sendAllotmentChanged(params: {
  to: string;
  committee: string;
  country: string;
  previousCommittee: string;
  previousCountry: string;
}): Promise<EmailResult> {
  const html = baseHtml(`
    <p>Your allotment has been updated.</p>
    <p>Committee: <strong>${escapeHtml(params.committee)}</strong><br>
    Country: <strong>${escapeHtml(params.country)}</strong></p>
    <p>This replaces your earlier allotment (${escapeHtml(params.previousCommittee)} — ${escapeHtml(params.previousCountry)}), which is no longer valid.</p>
  `);

  return sendEmail({
    kind: "sendAllotmentChanged",
    to: params.to,
    subject: "Your allotment has changed — Munique 2026",
    html,
  });
}

export async function sendDelegationAllotmentIssued(params: {
  to: string;
  groupName: string;
  committee: string;
  country: string;
  memberNames: string[];
  delegateCount: number;
}): Promise<EmailResult> {
  const membersHtml = params.memberNames
    .map((name) => `<li>${escapeHtml(name)}</li>`)
    .join("");

  const html = baseHtml(`
    <p>Your delegation&apos;s allotment has been issued.</p>
    <p>Delegation: <strong>${escapeHtml(params.groupName)}</strong><br>
    Committee: <strong>${escapeHtml(params.committee)}</strong><br>
    Country: <strong>${escapeHtml(params.country)}</strong> (shared by all ${params.delegateCount} delegates)</p>
    <p>Delegates in your delegation:</p>
    <ul style="margin: 0; padding-left: 1.25rem;">${membersHtml}</ul>
    <p>Each member of your delegation represents the same country in committee.</p>
  `);

  return sendEmail({
    kind: "sendDelegationAllotmentIssued",
    to: params.to,
    subject: "Your delegation allotment — Munique 2026",
    html,
  });
}

/**
 * One email to the head delegate with every member's allotment, sent when some
 * members of the delegation have no email of their own.
 */
export async function sendDelegationAllotmentsToHead(params: {
  to: string;
  registrationId: string;
  delegationName: string;
  members: {
    name: string;
    committee: string | null;
    country: string | null;
    hasOwnEmail: boolean;
  }[];
}): Promise<EmailResult> {
  return sendEmail({
    kind: "sendDelegationAllotmentsToHead",
    to: params.to,
    subject: `Your delegation's allotments (${params.registrationId}) — Munique 2026`,
    html: delegationAllotmentsToHeadHtml(params),
  });
}

export function delegationAllotmentsToHeadHtml(params: {
  registrationId: string;
  delegationName: string;
  members: {
    name: string;
    committee: string | null;
    country: string | null;
    hasOwnEmail: boolean;
  }[];
}) {
  const cell = "padding: 0.375rem 0.5rem; border-bottom: 1px solid #E3DED2; text-align: left;";
  const rows = params.members
    .map(
      (m) => `<tr>
        <td style="${cell}">${escapeHtml(m.name)}${m.hasOwnEmail ? "" : " *"}</td>
        <td style="${cell}">${escapeHtml(m.committee ?? "To be announced")}</td>
        <td style="${cell}">${escapeHtml(m.country ?? "To be announced")}</td>
      </tr>`,
    )
    .join("");
  const anyWithout = params.members.some((m) => !m.hasOwnEmail);

  return baseHtml(`
    <p>Your delegation&apos;s allotments have been issued.</p>
    <p>Delegation: <strong>${escapeHtml(params.delegationName)}</strong><br>
    MUN code: <strong style="font-family: monospace;">${escapeHtml(params.registrationId)}</strong></p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.9375rem;">
      <thead><tr>
        <th style="${cell}">Delegate</th>
        <th style="${cell}">Committee</th>
        <th style="${cell}">Country</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${
      anyWithout
        ? `<p style="font-size: 0.875rem;">* No email on file for this delegate — please pass their allotment on to them.</p>`
        : ""
    }
  `);
}
