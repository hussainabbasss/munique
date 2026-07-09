import { Resend } from "resend";
import { formatPkr } from "@/lib/utils/format";

export type EmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export type RegistrationEmailPayment = {
  feeAmount: number;
  bankAccountTitle: string;
  bankDetails: string;
  paymentInstructions: string;
};

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

function formatMultiline(text: string) {
  return escapeHtml(text).replace(/\n/g, "<br>");
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
  payment: RegistrationEmailPayment;
}): Promise<EmailResult> {
  const html = baseHtml(`
    <p>Your registration has been received.</p>
    <p>Registration ID: <strong style="font-family: monospace;">${escapeHtml(params.registrationId)}</strong></p>
    <p>Amount due: <strong>${escapeHtml(formatPkr(params.payment.feeAmount))}</strong></p>
    <div style="margin: 1.5rem 0; padding: 1rem 1.125rem; background: rgba(22, 35, 63, 0.04); border-left: 3px solid #B4922E;">
      <p style="margin: 0 0 0.75rem; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #2E4066;">Payment details</p>
      <p style="margin: 0 0 0.5rem;"><strong>Account title</strong><br>${formatMultiline(params.payment.bankAccountTitle)}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Bank details</strong><br>${formatMultiline(params.payment.bankDetails)}</p>
      <p style="margin: 0;"><strong>Instructions</strong><br>${formatMultiline(params.payment.paymentInstructions)}</p>
    </div>
    <p>Transfer the fee using the bank details above. Your registration is confirmed once staff verify your payment — you will receive another email when that happens.</p>
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
    <p>Committee: <strong>${params.committee}</strong><br>
    Country: <strong>${params.country}</strong></p>
  `);

  return sendEmail({
    kind: "sendAllotmentIssued",
    to: params.to,
    subject: "Your allotment — Munique 2026",
    html,
  });
}
