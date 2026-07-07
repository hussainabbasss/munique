# UI Context: Munique 2026 Conference Platform

**Companion to:** `project-overview.md`
**Purpose:** Single source of truth for visual identity, design tokens, component patterns, and page-level direction. Every build decision on this project should be traceable back to this file.
**Source material:** Munique's existing Instagram presence (@munique_2026) — this is a real, already-established brand identity. We are extending it, not inventing one.

---

## 1. Brand Identity Summary

Munique's existing visual world is doing something most MUN conference brands don't: it looks like a **diplomatic dossier**, not a school event poster. Key signals from the existing Instagram grid and profile:

- **Emblem-first identity** — a circular UN-style seal (silhouetted figures, laurel wreath, radar/globe backdrop) rendered in deep navy ink on aged parchment. This is treated like an official seal, not a logo icon.
- **Profile ring treatment** — the avatar is framed in a gradient gold-to-magenta ring, giving it a ceremonial, medal-like presence.
- **Parchment/aged-paper backgrounds** — tan, warm, slightly textured, not flat cream. Reads as "old treaty paper," not "Notion template."
- **Bold condensed display type for announcements** ("GB FORMS ARE LIVE NOW") — heavy, tight-tracked, all-caps sans, used sparingly for urgent/declarative moments.
- **Classic serif small-caps wordmark** ("MUNIQUE — MUN & Global Affairs") — restrained, editorial, institutional.
- **Bio copy tone**: short, declarative, slightly theatrical — *"Uniqueness Of Diplomacy," "Revealing Soon," "Edition I."* Confident, ceremonial, unveiling-oriented.

**Direction:** The platform should feel like **stepping into a chancellery** — an institution with weight and history — rendered through a clean, modern web interface. Parchment and ink, not clay and cream. Every generic "AI-cream-with-terracotta-accent" template must be explicitly avoided (see Section 8).

The one thing this brand has that almost no other MUN site has: it already looks **sealed and official**, like a physical artifact. That becomes our signature system (Section 5).

---

## 2. Design Tokens

### 2.1 Color

| Token | Hex | Usage |
|---|---|---|
| `--parchment` | `#E9DFC3` | Primary background — warm, aged paper, not flat white |
| `--parchment-light` | `#F6F1E3` | Card/surface background, sits above `--parchment` |
| `--ink-navy` | `#16233F` | Primary text, emblem strokes, primary buttons |
| `--ink-navy-soft` | `#2E4066` | Secondary text, borders, inactive states |
| `--gold-foil` | `#B4922E` | Accent — seals, dividers, active states, "Official Partner" badge |
| `--gold-foil-bright` | `#D8B857` | Hover/highlight state of gold accent, seal glow |
| `--magenta-accent` | `#A63D6B` | Rare accent, pulled from the profile-ring gradient — reserved for one ceremonial use per screen max (e.g. "Revealing Soon" states, live badges) |
| `--status-confirmed` | `#3F6B4A` | Payment confirmed / success states (muted forest, not neon green) |
| `--status-pending` | `#B4922E` | Reuses gold-foil — pending reads as "awaiting seal," not alarming |
| `--status-error` | `#8C3A32` | Errors, rejected — muted brick red, not fire-engine |
| `--paper-white` | `#FDFBF6` | Form fields, modals, admin dashboard base surface |

Do not substitute pure `#FFFFFF` or pure `#000000` anywhere — this brand has no true black or true white in its existing material, and introducing either will visually clash with the parchment world.

### 2.2 Typography

| Role | Typeface | Notes |
|---|---|---|
| **Display / Ceremonial** | Serif small-caps (e.g. Cormorant SC, or Cinzel for the emblem-adjacent moments) | Used for the Munique wordmark, page titles, section headers, certificate/seal text. Restrained tracking, never for body copy. |
| **Announcement / Declarative** | Heavy condensed grotesk (e.g. Anton, or Bebas Neue) | Reserved for urgent, high-energy moments only — "REGISTRATION IS LIVE," countdown banners, CTA headlines. Matches the "GB FORMS ARE LIVE NOW" energy. All-caps, tight tracking. Overusing this face flattens its impact — max one per screen. |
| **Body** | Clean modern sans (e.g. Inter or Source Sans) | All paragraph text, form labels, navigation, dashboard UI chrome. Must stay legible at small sizes on mobile. |
| **Utility / Data** | Monospace (e.g. IBM Plex Mono) | Registration IDs, timestamps, committee codes, Merit Score values in the admin dashboard. Signals "this is a system-generated fact," distinct from editorial content. |

**Type scale (base 16px):** 12 / 14 / 16 / 20 / 26 / 34 / 48 / 64 — display face only ever appears at 34px+.

### 2.3 Layout & Spacing

- Base spacing unit: **8px**, scale: 8 / 16 / 24 / 32 / 48 / 64 / 96
- Corner radius: **minimal** — 2–4px on forms and cards. This brand is sealed wax and paper, not soft rounded SaaS. No pill buttons, no heavy border-radius.
- Borders: **hairline** (1px), `--ink-navy-soft`, used to imply document structure (like ruled paper), not heavy card shadows.
- Max content width: 1200px desktop; single-column, generous margin (24px min) on mobile.

### 2.4 Texture & Surface

- Parchment background should carry a **subtle paper-grain texture** (very low-opacity noise/grain overlay, not a heavy skeuomorphic scan). This is the one place a "textured background" earns its keep — it's literally what the brand already uses.
- No drop shadows in the soft-SaaS style (large, blurry, colored shadows). Where elevation is needed, use a **thin offset line** (like a stamped card lifted off the page) instead — 2px hard offset in `--ink-navy-soft`, no blur.

---

## 3. Signature Element: The Seal

This is the one thing this design will be remembered by, and it's already latent in Munique's own branding — we're formalizing it into a functional UI pattern instead of leaving it as a static logo.

**The Seal** is a circular stamp component used anywhere the platform needs to communicate an official, finalized state:

- **Registration Received** → a seal "stamps" onto the confirmation screen (brief, weighty animation — not bouncy, more like a real stamp: fast down-strike, tiny paper-compression settle, done in under 400ms)
- **Payment Confirmed** → seal appears next to the applicant's row in the admin dashboard once an admin clicks Confirm
- **Allotment Issued** → the same seal motif appears in the confirmation email and on the delegate's portal view, reinforcing "this is now official"
- **"Official Digital Partner" credit** → rendered as a seal on the site footer, not a badge/logo lockup

Each seal uses the existing UN-style emblem silhouette in `--ink-navy` on a `--gold-foil` ring, sized down from the Instagram profile treatment. **Do not** invent a new icon system for status indicators (checkmarks, generic badges) — the seal *is* the status system across the entire platform. This gives structural consistency: numbering/badges only decorate, but a seal here actually encodes "this step is now official and irreversible," which is true of the content (payment confirmation, allotment issuance are exactly the irreversible-feeling actions flagged in the project overview's risk section).

---

## 4. Page-Level Direction

### 4.1 Home Page

```
┌─────────────────────────────────────────┐
│  [nav: wordmark serif]      Register →  │
├─────────────────────────────────────────┤
│                                           │
│        THE SEAL (large, centered)        │
│     "MUNIQUE 2026 — EDITION I"           │
│     condensed display: REGISTER NOW      │
│                                           │
├─────────────────────────────────────────┤
│  About | Committees | Schedule (cards,   │
│  parchment-light surface, hairline rule) │
├─────────────────────────────────────────┤
│  Secretariat / EB profiles (grid, seal-  │
│  framed portrait circles echoing the     │
│  Instagram avatar ring treatment)        │
├─────────────────────────────────────────┤
│  Sponsors & Partners strip                │
│  Footer: seal = "Official Digital        │
│  Partner, System Summit"                  │
└─────────────────────────────────────────┘
```

Hero is the seal itself, not a stock photo or generic gradient — it's the most characteristic thing in this brand's world. Committee/agenda cards read like index cards on a desk: hairline border, parchment-light surface, no shadow.

### 4.2 Registration Portal (Delegate-facing)

- `/register` is a portal chooser — two full-width cards (Individual Delegate / School Delegation), each showing the live fee. Forms live at `/register/delegate` and `/register/delegation` with independent pricing.
- Multi-step wizard, one step per screen on mobile — `--paper-white` form sheet on `--parchment` background. Reads like filling out an official form on a clean sheet of paper laid over a desk.
- On successful submission: **The Seal stamps down**, then transitions to a "Registration Received" state showing a monospace registration ID.
- Payment step: clear instructions for direct/manual payment (bank details from admin config), then a screenshot upload field. Set expectations explicitly in-copy: *"Upload your payment screenshot. Your registration is received immediately. Payment confirmation happens after an admin verifies your transfer — you will receive an email when that happens."* No fake progress bars implying instant automated verification.

### 4.3 EB Admin Dashboard

This is a working tool, not a marketing surface — it should shift the palette slightly toward function while staying in-brand.

```
┌───────────────────────────────────────────────┐
│ Sidebar          │ Main panel                   │
│ - Overview       │  [Live registration table]   │
│ - Registrations  │  Name | Committee(pref) |     │
│ - Allotments      │  Merit Score | Payment |      │
│ - Team            │  Allotment Status             │
│ - Queries         │                               │
│                   │  [Issue Allotments] ← gated,  │
│                   │   confirmation modal required │
└───────────────────────────────────────────────┘
```

- Table/data views use `--paper-white` surface, monospace for IDs/scores, hairline row dividers — dense but legible, not a generic admin-template dark mode.
- Payment status and allotment status are **visually distinct columns** — a gold seal-in-progress icon for pending, full seal for confirmed/issued, muted brick for rejected/error.
- **"Issue Allotments" is a deliberately weighty button** — larger, requires a confirmation modal (matching the risk flagged in `project-overview.md`: this action emails every delegate immediately). Modal copy should state plainly what's about to happen and how many delegates will be emailed: *"This will issue allotments to 214 delegates and send each an email immediately. This cannot be undone."*
- Team member management lives under its own sidebar tab — simple invite-by-email flow, role selection (Admin / Reviewer, roles TBD in build).

### 4.4 Query Management

- Ticket-style list (not a chat thread) — each delegate query is a discrete, resolvable item with a status (Open / Resolved), replacing the WhatsApp-thread chaos named directly in the project overview's problem statement. Resolving a query is a deliberate action, not a disappearing chat bubble.

---

## 5. Motion & Interaction

- **The stamp** (Section 3) is the one orchestrated motion moment in this product — reserve big, intentional animation for it. Everywhere else: fast, quiet, functional transitions (150–200ms fades/slides), nothing decorative.
- No scroll-jacking, no parallax on the marketing pages — the brand's authority comes from restraint, not spectacle.
- Respect `prefers-reduced-motion`: the seal should still appear, just without the strike animation (fade/scale-in instead).

---

## 6. Voice & Copy

Matches the tone already established in Munique's bio: **declarative, ceremonial, confident** — not corporate SaaS, not casual youth-brand.

- Do: *"Registration is now open."* / *"Your allotment has been issued."*
- Don't: *"Yay! You're all set 🎉"* / generic startup enthusiasm
- Errors speak plainly, in the system's voice, no apology theater: *"This registration ID was not found. Check the ID and try again."*
- Buttons name the exact action and stay consistent through the flow: a button that says **"Submit Registration"** should lead to a confirmation that says **"Registration Submitted"** — not "Application received!" or other drifted phrasing.

---

## 7. Accessibility & Responsive Baseline

- All interactive elements keyboard-navigable with a visible focus ring in `--gold-foil-bright` (not browser default blue — it clashes with the palette).
- Text contrast: body text on `--parchment` must meet WCAG AA — verify `--ink-navy` (#16233F) against `--parchment` (#E9DFC3) at build time; this pairing is close to compliant but should be checked at final font sizes.
- Mobile-first per the original proposal requirement — registration flow in particular must work cleanly on a single-hand-held phone, since most delegates will register from Instagram → mobile browser.

---

## 8. Explicit Anti-Patterns (Do Not Do This)

Called out directly because these are the default outputs most AI-assisted builds converge on, and none of them fit this brand:

- ❌ Warm cream background + terracotta/clay accent (`#D97757`-family) — this is a generic AI-template look, and this brand already has its own specific parchment/navy/gold palette from real existing material. Do not drift toward terracotta.
- ❌ Near-black background with a single neon accent — wrong register entirely for a "diplomatic dossier" brand.
- ❌ Heavy border-radius, pill buttons, soft blurred drop shadows — reads as generic SaaS, conflicts with the "sealed document" language.
- ❌ Checkmark icon systems for status — the Seal is the status system (Section 3). Don't run two competing status languages.
- ❌ Confetti/celebration animations on form submission — tone mismatch with the ceremonial voice; the stamp animation already carries that moment.

---

## 9. Open Items for Build

- Confirm exact serif and condensed-grotesk font licenses/availability (Google Fonts equivalents: Cormorant SC / Cinzel for display serif, Anton for condensed announcement face)
- Confirm role structure for Team Member management in the admin dashboard (Admin vs. Reviewer permissions)
- Confirm whether the paper-grain texture is a static asset or CSS-generated noise (affects load performance on mobile)
- Final seal artwork: source high-res version of the existing emblem from Munique for accurate reproduction, rather than recreating from the Instagram screenshot
