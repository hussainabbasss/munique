# 04 — Resend Email Integration

**Parent:** `00-blueprint.md`  
**Provider:** [Resend](https://resend.com)

---

## Setup

| Env var | Usage |
|---|---|
| `RESEND_API_KEY` | Server-only |
| `RESEND_FROM_EMAIL` | e.g. `Munique 2026 <registrations@munique2026.com>` — domain must be verified in Resend |

**Package:** `resend` npm package, called from Next.js server actions or route handlers only.

**Helper:** `lib/email/send.ts` — thin wrapper with typed template IDs.

---

## Email triggers

| Event | Trigger location | Recipient | Admin involvement |
|---|---|---|---|
| Registration received | Registration portal submit | Head delegate email | Automatic |
| Payment confirmed | Admin clicks Confirm in Registrations tab | Head delegate email | **Automatic** (confirmed) |
| Allotment issued | "Issue Allotments" on Allotments tab | Each delegate email | Manual batch gate |

Admin panel does **not** include a general-purpose email composer in v1.

---

## Template 1 — Registration received

**Subject:** `Registration received — Munique 2026`

**Body (plain + simple HTML):**

- Ceremonial tone per `ui-context.md` §6
- Monospace registration ID prominent
- State plainly: payment verification is manual
- Link to conference site

**Example copy:**

> Your registration has been received.
>
> Registration ID: **MUN-A7F2**
>
> Upload your payment screenshot if you have not already. Your registration is confirmed once an admin verifies your payment — you will receive an email when that happens.
>
> — Munique 2026, Edition I

**No** confetti, no emoji, no "Yay!" — seal motif optional as static image in HTML template.

---

## Template 2 — Payment confirmed

**Subject:** `Payment confirmed — Munique 2026`

**Trigger:** Server action after admin Confirm — **always sent**; no toggle in v1.

**Example copy:**

> Your payment has been verified.
>
> Registration ID: **MUN-A7F2**
>
> Your registration is now confirmed. Allotment details will be sent separately when the Executive Board issues allotments.
>
> — Munique 2026, Edition I

---

## Template 3 — Allotment issued

**Subject:** `Your allotment — Munique 2026`

**Trigger:** Batch send on "Issue Allotments" confirmation modal.

**Example copy:**

> Your allotment has been issued.
>
> Committee: **UN Women**
> Country: **France**
>
> — Munique 2026, Edition I

Include seal stamp graphic in HTML footer. Modal before send must state delegate count: *"This will email 214 delegates immediately. This cannot be undone."* (`ui-context.md` §4.3)

---

## Implementation pattern

```ts
// lib/email/send.ts — illustrative
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRegistrationReceived(params: {
  to: string;
  registrationId: string;
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: "Registration received — Munique 2026",
    html: renderRegistrationReceived(params),
  });
}
```

### Error handling

- Log Resend API errors server-side
- Registration submit **succeeds** even if email fails — store `email_sent_at` nullable, show admin warning on row if null
- Payment confirm: show toast "Payment confirmed. Email could not be sent — retry from row actions." if Resend fails (retry action optional v1.1)

---

## Admin visibility

Registrations row expand shows:

- `registration_email_sent_at`
- `payment_email_sent_at`

No PII in logs beyond registration ID.

---

## Domain & deliverability checklist

- [ ] Verify sending domain in Resend before go-live
- [ ] SPF/DKIM records on EB's DNS
- [ ] Test send to Gmail + local Pakistani providers common among delegates
- [ ] `reply-to` set to EB operations email if different from `from`
