import { Resend } from "resend";

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
}): Promise<EmailResult> {
  const html = baseHtml(`
    <p>Your registration has been received.</p>
    <p>Registration ID: <strong style="font-family: monospace;">${escapeHtml(params.registrationId)}</strong></p>
    <p>We have received your payment screenshot and will review it shortly. You will receive another email once we have processed your payment.</p>
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
