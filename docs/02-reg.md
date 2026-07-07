# 02 — Registration Portal Blueprint

**Status:** Draft — pending confirmation before build  
**Companion docs:** `01-homepage.md`, `project-overview.md`, `ui-context.md`, `feature-spec/admin/03-data-model.md`  
**Routes:** `/register` (entry) · `/register/delegate` · `/register/delegation`  
**Stack:** Next.js App Router · Supabase (Postgres + Storage) · Resend (confirmation email)

---

## What we are building

The **Registration Portal** replaces Munique's Google Forms with two mobile-first, multi-step application flows — one for **individual delegates** and one for **school delegations** — that write directly to the existing `registrations` + `delegates` tables and surface instantly in the EB Admin Panel.

Delegates arrive from Instagram on a phone, one hand. The portal must feel like **filling an official form on parchment** — not a generic SaaS wizard — while keeping each step short enough to finish without abandoning mid-flow. On successful submit: the seal stamps, a monospace registration ID appears, and a confirmation email goes to the head delegate.

Payment is **manual v1**: bank transfer instructions + screenshot upload at submit. No payment gateway. EB confirms payment separately in `/admin/registrations`.

This document locks decisions that would change implementation. Confirm open items in Section 12 before coding starts.

---

## Language we agreed on

Before build — confirm these terms mean the same thing to everyone:

| Term | Definition |
|---|---|
| **Delegate** | One conference attendee. In the **Delegate portal**, exactly one person registers themselves. In the **Delegation portal**, multiple people register under one school group. |
| **Head delegate** | Primary contact for a registration. Delegate portal: the applicant. Delegation portal: designated leader — receives confirmation and payment emails. Stored as `head_email` on `registrations` and `is_head_delegate = true` on one `delegates` row. |
| **Registration** | A submitted record in Supabase — not the in-progress form. Has monospace `registration_id` (e.g. `MUN-A7F2`), `type` (`delegate` \| `delegation`), snapshotted `fee_amount`, and `payment_status` starting at `pending`. |
| **Portal** | One of two public routes with independent pricing: `/register/delegate` (`delegate_fee`) and `/register/delegation` (`delegation_fee` per delegate). `portal` column mirrors `type`. |
| **Payment proof** | Screenshot uploaded to Supabase Storage `payment-proofs` bucket. Required at submit in v1. Admin reviews in dashboard — **Confirm** sets `payment_status = confirmed` and triggers Resend email. |
| **Ceremonial moment** | The seal stamp animation on successful submit — the one orchestrated motion beat on this surface (`ui-context.md` §5). No confetti. |

**Correction gate:** If any term above is wrong, fix it here before implementation.

---

## Scene sentence (design north star)

> A delegate taps Register from Instagram on their phone, chooses Individual or Delegation, and completes the form in under eight minutes standing in a hallway — they need to trust this is Munique's official process, see the fee clearly before paying, and leave with a registration ID they can screenshot.

This forces: mobile-first step wizard, large touch targets, fee visible before payment step, plain ceremonial copy, no dark mode, no fake instant-payment UX.

---

## Design decisions

### 1. Entry: `/register` chooser, then two dedicated portals

**Decision:** `/register` is a **portal chooser** — two full-width tappable cards (Individual Delegate / School Delegation), each showing live fee from `pricing_config`. Actual forms live at `/register/delegate` and `/register/delegation`.

**Why:** Admin blueprint confirmed two routes with separate fees. `ui-context.md` §4.2 asks for both options visible at once (tab/toggle) — the chooser page satisfies that intent without merging incompatible pricing logic into one form. Homepage CTA and status banner can link to `/register`; chooser forwards to the correct portal.

**Reject:** Single combined form with runtime fee toggle (confuses snapshotted pricing); dropdown to pick portal (hides the second option).

### 2. Flow pattern: multi-step wizard, one step per screen (mobile-first)

**Decision:** Each portal is a **linear step wizard** — one primary step visible on mobile, with a compact progress indicator (`Step 2 of 5`) and persistent Back / Continue controls. Desktop: same steps, centered `--paper-white` form sheet (max ~40rem) on `--parchment` body.

**Why:** Instagram → mobile is the primary path. Long single-page forms fail on phones. Steps map to mental checkpoints: who → preferences → payment → review → done.

**Reject:** Accordion single page; sidebar stepper on mobile; modal-heavy sub-flows.

### 3. Delegate portal steps (5)

| Step | Title | Fields | Notes |
|---|---|---|---|
| 1 | **About you** | Full name, email, school / institution | Email becomes `head_email` + sole `delegates` row |
| 2 | **Committee preferences** | Pref 1 (required), Pref 2–3 (optional), MUN experience (textarea) | Committees from published `committees` table; show `difficulty_tier` as subtle label |
| 3 | **Payment** | Live fee display, bank details (from `pricing_config`), payment instructions, screenshot upload | Early bird applied if enabled and before deadline |
| 4 | **Review** | Read-only summary of all fields + fee | Edit links jump back to step |
| 5 | **Confirmation** | Seal stamp → registration ID (monospace) + copy-to-clipboard | Email sent async; copy explains manual verification |

### 4. Delegation portal steps (6)

| Step | Title | Fields | Notes |
|---|---|---|---|
| 1 | **School & head delegate** | School / institution, head full name, head email | `school` + `head_email` on registration |
| 2 | **Your delegation** | Dynamic delegate list: add/remove members (full name, email optional) | Head listed separately in step 1; members min 1 additional. Running delegate count shown |
| 3 | **Committee preferences** | Same as delegate portal — one set per registration | `mun_experience` describes delegation / head experience |
| 4 | **Payment** | Fee = `delegation_fee × delegate_count` (early bird per-delegate if active), bank details, screenshot | Sticky fee breakdown: `Rs 3,800 × 5 = Rs 19,000` |
| 5 | **Review** | School, all delegate names, prefs, total fee | |
| 6 | **Confirmation** | Same seal + ID treatment | Email to `head_email` only in v1 |

**Delegation size (default):** minimum **2** delegates total (head + 1 member), maximum **15** — confirm in Section 12.

### 5. Color & surface: parchment desk, paper form

**Decision:** `--parchment` page background with existing paper-grain overlay. Form steps on `--paper-white` sheet, 1px `--ink-navy-soft` hairline border, 3–4px radius. Primary actions: `--ink-navy` solid buttons (not pill). Progress indicator uses `--gold-foil` for current step.

**Why:** Matches public site tokens (`globals.css`) and `ui-context.md` §4.2. Registration is brand register (ceremonial) but still a task surface — restraint over decoration.

**Reject:** Cream/stone Tailwind defaults, dark mode, glass cards, border + 16px blur shadow pairs.

### 6. Typography: display for step titles, sans for forms

**Decision:**

| Element | Face | Size |
|---|---|---|
| Step title | Cinzel (`--font-display`) | 1.25rem fixed |
| Form labels / inputs | Libre Franklin (`--font-sans`) | 0.875–1rem |
| Registration ID | IBM Plex Mono (`--font-mono`) | 1.125rem+ on confirmation |
| Fee amounts | Mono, tabular nums | Payment + review steps |

**Reject:** Anton in form labels (reserved for status banner / live announcements); fluid clamp headings on form steps.

### 7. Payment UX: honest manual process

**Decision:** Payment step shows EB-configured bank details and instructions verbatim. Copy block (required):

> Upload your payment screenshot. Your registration is received immediately. **Payment confirmation** happens after an admin verifies your transfer — you will receive an email when that happens.

Screenshot: `accept="image/*"`, max 5MB, required at submit. Preview thumbnail after select. No spinner implying automated verification.

### 8. Submit & persistence

**Decision:**

- **Client:** `sessionStorage` persists wizard state between steps (survives refresh, cleared on confirmation). No account / login.
- **Server:** Next.js server action inserts `registrations` + `delegates` rows and uploads proof to Storage using **service role** (current RLS is admin-only on these tables — no anon insert policy in v1).
- **ID generation:** Server-side `MUN-` + 4 alphanumeric chars (collision retry).
- **Fee snapshot:** Computed server-side from active `pricing_config` — never trust client-submitted amounts.
- **Email:** `sendRegistrationReceived` to `head_email` on success; submit succeeds even if email fails (`registration_email_sent_at` nullable).

**Reject:** Client-side direct Supabase insert without server validation; trusting browser-reported fee.

### 9. Stamp confirmation (ceremonial moment)

**Decision:** On step 5/6 success, play seal stamp animation (~400ms ease-out, scale + opacity). `prefers-reduced-motion`: instant seal presence, no strike motion. Show:

- "Registration received" (serif)
- Registration ID in mono with copy button
- Subtext: check email, payment pending verification
- Link: Return to homepage · View committees

**Reject:** Confetti, checkmark icons, "Yay!" copy.

### 10. Registration closed / errors

**Decision:**

- If no active `pricing_config` row: portal shows closed state — *"Registration is not open yet."* with link home.
- Committee list empty: block pref step with message to contact EB.
- Upload failure: inline error, preserve form state.
- Duplicate email: allow (siblings / same school) — no uniqueness constraint in v1.

---

## Page architecture

```
/register
┌────────────────────────────────────────┐
│  Page title: Registration (Cinzel)     │
│  Lede: one sentence institutional      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Individual Delegate             │  │
│  │  Rs 4,500 / person               │  │
│  │  Register as yourself      →     │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  School Delegation               │  │
│  │  Rs 3,800 / delegate             │  │
│  │  Register your school group  →   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Link: ← Back to homepage              │
└────────────────────────────────────────┘

/register/delegate  ·  /register/delegation
┌────────────────────────────────────────┐
│  Compact header: seal (24px) + MUNIQUE │
│  Progress: ● ○ ○ ○ ○   Step 1 of 5    │
├────────────────────────────────────────┤
│  ┌─ paper-white form sheet ──────────┐  │
│  │  Step title (Cinzel)             │  │
│  │  [fields]                        │  │
│  │                                  │  │
│  │  [← Back]          [Continue →]  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘

Confirmation (final step, no back)
┌────────────────────────────────────────┐
│         [seal stamp animation]         │
│     Registration received              │
│         MUN-A7F2  [Copy]               │
│     Payment verification pending…      │
└────────────────────────────────────────┘
```

### Sections explicitly NOT in registration v1

- Post-submit payment upload portal (upload only at submit)
- Delegate login / status lookup by ID (future)
- Allotment display (separate email when EB issues)
- Auth / accounts for applicants
- Payment gateway (JazzCash, Stripe, etc.)
- PDF portfolio upload (MUN experience is textarea only)

---

## Component specs

### `RegisterChooser`

- Fetches active `pricing_config` server-side
- Two `<Link>` cards — entire card tappable, min height 88px
- Shows early bird strikethrough if applicable
- Fees formatted `Rs 4,500` via shared `formatPkr`

### `RegistrationWizard`

- Props: `portal: 'delegate' | 'delegation'`, `committees`, `pricing`
- Manages step index + `sessionStorage` sync
- Validates current step before Continue (inline errors, focus first invalid field)
- Delegation step 2: `DelegateListEditor` — add/remove rows, enforces min/max count

### `CommitteePrefFields`

- Three `<select>` elements; pref 1 required
- Options: published committees ordered by `display_order`
- Optional tier badge: Low / Medium / High (text only, no color coding overload)

### `PaymentStep`

- Renders `bank_account_title`, `bank_details`, `payment_instructions` from pricing
- File input with size/type validation
- Fee summary card (mono)

### `ReviewStep`

- Summary sections with "Edit" links setting step index
- Delegation: table of delegate names

### `ConfirmationStep`

- Client component for stamp animation
- `registrationId` from server action response
- Copy-to-clipboard with toast/fallback

### `SealStamp`

- Reuses seal asset (`logo.svg` / `logo.png`)
- CSS animation; reduced-motion fallback

---

## Data mapping (submit payload → Supabase)

### Delegate portal → 1 registration + 1 delegate

```ts
registrations: {
  registration_id,       // generated server-side
  type: 'delegate',
  portal: 'delegate',
  payment_status: 'pending',
  fee_amount,            // delegate_fee or early_bird_delegate_fee
  school,
  head_email: email,
  committee_pref_1, committee_pref_2?, committee_pref_3?,
  mun_experience,
  payment_proof_path,    // storage path after upload
}
delegates: [{
  full_name, email, is_head_delegate: true, display_order: 0
}]
```

### Delegation portal → 1 registration + N delegates

```ts
fee_amount = delegation_fee * delegates.length  // early bird per-delegate if active
delegates: [
  { full_name: headName, email: headEmail, is_head_delegate: true, display_order: 0 },
  ...members.map((m, i) => ({ full_name: m.name, email: m.email, is_head_delegate: false, display_order: i + 1 }))
]
```

---

## Copy requirements

Voice: declarative, ceremonial, confident (`ui-context.md` §6).

| Element | Copy (draft) |
|---|---|
| Chooser title | Registration |
| Chooser lede | Select how you are applying to Munique 2026, Edition I. |
| Delegate card | Individual Delegate — Register as yourself |
| Delegation card | School Delegation — Register your institution's group |
| Payment expectation | Upload your payment screenshot. Your registration is received immediately. Payment confirmation happens after an admin verifies your transfer — you will receive an email when that happens. |
| Submit button (review) | Submit registration |
| Confirmation title | Registration received |
| Confirmation sub | Save your registration ID. You will receive an email at [email]. |
| Closed state | Registration is not open yet. |
| Error: upload | Payment screenshot must be an image under 5 MB. |
| Error: delegation size | A delegation must include at least [min] delegates. |

**Consistency:** "Register" on homepage → "Registration" on chooser → "Submit registration" on review → "Registration received" on confirm. Never "Apply" or "Sign up".

---

## Anti-slop checklist (build-time gate)

- [ ] Body bg `--parchment` (#E9DFC3) — not cream/stone Tailwind
- [ ] No pill buttons on primary actions
- [ ] No gradient text, glass surfaces, or decorative grid overlays
- [ ] No checkmark success icons — seal is the status language
- [ ] No confetti or bounce easing on submit
- [ ] No fake payment verification progress bar
- [ ] No dark mode on registration routes
- [ ] No border + 16px blur shadow on form sheet
- [ ] Contrast ≥ 4.5:1 on labels and inputs
- [ ] Touch targets ≥ 44×44px on Continue, file upload, chooser cards
- [ ] `prefers-reduced-motion` honored on stamp
- [ ] Fee computed server-side — client display matches server snapshot

---

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| `< 640px` | Full-bleed form sheet with 16px horizontal padding; sticky footer with Back/Continue; chooser cards stack |
| `640–1024px` | Form sheet max-width 36rem centered; chooser cards stack with more padding |
| `> 1024px` | Form sheet max-width 40rem; chooser cards side-by-side `1fr 1fr` grid |

Single-column only — no side-by-side fields except delegation name/email pairs on `≥640px`.

---

## Accessibility

- One `<h1>` per route (chooser or portal name)
- Each step has `<h2>` for step title
- Progress: `aria-current="step"` on active step indicator
- File input: associated label + error announced via `role="alert"`
- Focus management: advancing step focuses step title
- Stamp animation: `aria-live="polite"` announces registration ID when animation completes
- Skip link inherited from public layout

---

## Technical implementation steps

Ordered for build after confirmation:

1. **RLS / server actions** — `lib/registration/submit.ts` using Supabase service role; validate all fields server-side
2. **ID generator** — `lib/registration/id.ts` (`MUN-XXXX`, collision retry)
3. **Fee calculator** — `lib/registration/fees.ts` reads active pricing + early bird
4. **Storage upload** — `payment-proofs/{registration_id}/{uuid}.jpg` in submit action
5. **Public queries** — `lib/registration/queries.ts` for pricing + published committees
6. **Shared wizard** — `components/registration/registration-wizard.tsx` + step components
7. **`/register`** — chooser page replacing stub `app/(public)/register/page.tsx`
8. **`/register/delegate`** — 5-step wizard page
9. **`/register/delegation`** — 6-step wizard with `DelegateListEditor`
10. **`SealStamp` + confirmation** — client animation component
11. **sessionStorage hook** — `useRegistrationDraft(portal)` with schema validation
12. **Email** — wire `sendRegistrationReceived` in submit action
13. **Update status banner default** — href `/register` (chooser) in seed if needed
14. **E2E smoke** — submit delegate + delegation test rows appear in `/admin/registrations`

### File map (expected)

```
app/(public)/
  register/
    page.tsx                    ← chooser
    delegate/page.tsx           ← delegate wizard
    delegation/page.tsx         ← delegation wizard
    register.css                ← portal-specific tokens (optional)
components/registration/
  register-chooser.tsx
  registration-wizard.tsx
  steps/
    about-step.tsx
    committee-prefs-step.tsx
    delegation-members-step.tsx
    payment-step.tsx
    review-step.tsx
    confirmation-step.tsx
  committee-pref-fields.tsx
  delegate-list-editor.tsx
  seal-stamp.tsx
  wizard-progress.tsx
lib/registration/
  submit.ts
  fees.ts
  id.ts
  queries.ts
  types.ts
  draft.ts                      ← sessionStorage schema
```

---

## Assumptions

- Two-portal split with separate fees is confirmed (`00-blueprint.md` §2)
- Payment proof required at initial submit — no "pay later" upload portal in v1
- `mun_experience` is one textarea per registration (delegation describes group/head experience collectively)
- Committee preferences are per registration, not per delegate
- Member delegate emails are optional; head email is required
- Registration insert uses server actions + service role (no new anon RLS policies in v1)
- English only for v1
- Portals read pricing/bank details live from DB — always current instructions
- Early bird: when enabled and before deadline, per-portal early bird fee replaces standard fee

---

## Open items (confirm before build)

| # | Question | Default if no answer |
|---|---|---|
| 1 | Delegation minimum delegates (total including head)? | **2** |
| 2 | Delegation maximum delegates? | **15** |
| 3 | Are committee prefs 2 and 3 required or optional? | **Optional** (pref 1 required) |
| 4 | Is payment screenshot **required** to submit, or can applicants submit and upload later? | **Required at submit** |
| 5 | Should `/register` chooser show both fees, or should homepage Register link go directly to delegate portal? | **Chooser at `/register`**; banner links to `/register` |
| 6 | Collect member delegate emails in delegation flow? | **Optional** for members; required for head |
| 7 | MUN experience: minimum character count? | **50 characters** soft minimum |
| 8 | Allow same `head_email` on multiple registrations (e.g. teacher registering twice)? | **Yes** — no duplicate block |
| 9 | Registration ID format — confirm `MUN-XXXX`? | **Yes** |
| 10 | Update `ui-context.md` §4.2 toggle wording to match chooser + two routes? | **Yes** — doc patch alongside build |

---

## Confirmation

**Blueprint ready.**

Reply with corrections to the language table (Section 2), any rejected decisions (Section 4), and answers to open items (Section 12). Implementation of `/register`, `/register/delegate`, and `/register/delegation` begins only after explicit confirmation.

---

*Design guardrails sourced from `ui-context.md` §4.2 and impeccable product register. Identity-preservation applies: parchment/ink/gold dossier aesthetic, seal-as-status-language, honest manual-payment UX.*
