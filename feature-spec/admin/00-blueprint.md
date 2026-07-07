# 00 — EB Admin Panel Blueprint

**Status:** Confirmed — ready for implementation  
**Confirmed:** 2026-07-05  
**Companion docs:** `docs/project-overview.md`, `docs/ui-context.md` §4.3  
**Route:** `/admin` (protected — not linked from public nav)  
**Stack:** Supabase (Postgres, Auth, Storage) · Resend (transactional email) · Next.js App Router

---

## What we are building

The **EB Admin Panel** is the Executive Board's operational control surface for Munique 2026. It replaces Google Forms exports, spreadsheet tracking, and WhatsApp coordination with a single authenticated dashboard where the EB can see live registration metrics, manage conference content (pricing, committees, sponsors), review and confirm payments, control the public status banner, run allotment review, manage team access, and resolve delegate queries.

The panel is a **working tool**, not a marketing page — `--paper-white` surfaces, dense data tables, monospace for system facts (`ui-context.md` §4.3). It stays in the Munique palette but prioritizes legibility and workflow speed over ceremony.

---

## Language we agreed on

| Term | Definition |
|---|---|
| **Delegate** | A single conference attendee. The **Delegate portal** (`/register/delegate`) registers one person. The **Delegation portal** (`/register/delegation`) registers a school/institution group with multiple delegates. The **Delegate count card** shows total headcount across both. |
| **Registration** | A submitted application record in Supabase — not the act of filling the form. Each registration has a monospace ID, `type` (`delegate` \| `delegation`), payment status, and linked delegate rows. |
| **Payment confirmed** | EB verified the payment screenshot and clicked **Confirm**. Sets `payment_status = confirmed`. Triggers Resend email automatically. Independent from allotment issuance. |
| **Total amount** | Sum of fees for **payment-confirmed** registrations only, from fee snapshotted at submission. Not bank reconciliation. |
| **Status banner** | Auto-scrolling Anton ticker on the public site. Admin edits message, link, visibility without redeploying. |
| **Tab** | Horizontal nav within `/admin`. Seven tabs + Overview landing: Pricing · Committees · Registrations · Sponsors · Allotments · Team · Queries. |
| **Study guide** | Per-committee PDF uploaded by EB in Committees tab. Published on public `/committees` when file exists. No chair assignments in v1. |

---

## Scene sentence (design north star)

> An EB member opens `/admin` on their laptop during peak registration week — they need to know within five seconds how many delegates have applied, how much confirmed revenue exists, and which registrations still need payment review, without exporting a spreadsheet or opening WhatsApp.

---

## Decisions made

### 1. Navigation: Overview + seven tabs

**Decision:** Overview landing (stats + graph + banner) plus tabs: **Pricing · Committees · Registrations · Sponsors · Allotments · Team · Queries**.

**Why:** User confirmed all operational features in v1 — no Phase 2 deferral. Full `project-overview.md` §5.4 scope included.

### 2. Two registration portals with separate pricing

**Decision:** Public registration splits into two routes:

| Portal | Route | Pricing field |
|---|---|---|
| **Delegate** | `/register/delegate` | `delegate_fee` (PKR, per person) |
| **Delegation** | `/register/delegation` | `delegation_fee` (PKR, per delegate in group) |

EB updates both fees independently in the **Pricing** tab. Fee snapshotted at submission; changing pricing does not retroactively alter existing registrations.

**Why:** User confirmed two distinct portals. Delegation fee applies per delegate in the group (standard MUN model) — total delegation fee = `delegation_fee × delegate_count`.

### 3. Stats cards on Overview

Five stat cards: Total Delegates · Registrations (with delegate/delegation split) · Payment Pending · Payment Confirmed · Total Amount (PKR, confirmed only).

### 4. Graph: registrations over time

Daily registration count, last 30 days. Line chart.

### 5. Status banner control

Overview banner editor → `site_settings` → public `StatusBanner`. Default link `/register` (or split CTAs to both portals when EB configures).

### 6. Auth: Supabase Auth + team roles

`admin_users` allowlist. Roles: **Admin** (full access) and **Reviewer** (read + payment confirm + queries; cannot issue allotments or edit pricing/team).

### 7. Email: Resend — payment confirmed is automatic

| Event | Auto? |
|---|---|
| Registration received | Yes — on portal submit |
| Payment confirmed | **Yes** — on admin Confirm (confirmed 2026-07-05) |
| Allotment issued | Yes — on Issue Allotments batch |

### 8. Committees: agendas + study guide only

**No chair fields.** Committee edit form: name, slug, short description, **agenda** (textarea), difficulty tier, display order, published flag, **study guide upload** (PDF). Public `/committees` shows agenda text and download link when study guide exists.

### 9. Registrations tab

Dense table + payment screenshot review + Confirm (auto-email). Allotment merit data surfaced in Allotments tab, not duplicated here.

### 10. Allotments, Team, Queries — all v1

See `05-operations.md` for full UX. Issue Allotments is gated with confirmation modal per `ui-context.md`.

---

## Confirmed answers (2026-07-05)

| # | Question | Answer |
|---|---|---|
| 1 | Phase 2 scope (Team, Queries, Allotments) | **All in v1** |
| 2 | Registration pricing model | **Two portals** (Delegate + Delegation); EB updates fees independently |
| 3 | Payment confirmed email | **Yes** — automatic on Confirm |
| 4 | Committee CMS depth | **Agendas + study guide upload only** — no chairs |

---

## Assumptions

- Currency: **PKR**
- No payment gateway — screenshot verification only
- Merit-Logic engine uses **Gemini** (Beta) — EB opted in by including Allotments in v1
- Study guides: PDF only, max 10MB, stored in Supabase Storage
- Admin UI uses existing design tokens from `globals.css`

---

## Implementation Plan — EB Admin Panel

### What we are building

Authenticated `/admin` with Overview (stats, graph, banner editor) and seven tabs — Pricing, Committees, Registrations, Sponsors, Allotments, Team, Queries — backed by Supabase and Resend. Two public registration portals at `/register/delegate` and `/register/delegation`.

### How to build it

1. **Foundation** — `@supabase/supabase-js`, `@supabase/ssr`, `resend`, `recharts`. Env vars + `lib/supabase/` clients.

2. **Schema** — `03-data-model.md` + `05-operations.md` tables: `allotments`, `queries`, role column on `admin_users`, `study_guide_path` on `committees`, simplified `pricing_config` (delegate_fee + delegation_fee).

3. **Auth shell** — `/admin/login`, middleware, role checks for gated actions.

4. **Admin layout** — Seven-tab horizontal nav + Overview on `/admin`.

5. **Overview** — Stat cards, line chart, banner editor, quick actions (pending payments, open queries, export CSV).

6. **Public banner** — `StatusBanner` reads `site_settings`.

7. **Pricing tab** — Delegate fee + Delegation fee (per delegate), early bird optional, bank details.

8. **Committees tab** — Agenda textarea + study guide PDF upload. No chairs.

9. **Registrations tab** — Table, payment confirm + auto Resend email.

10. **Sponsors tab** — Logo CMS for homepage.

11. **Allotments tab** — Merit engine run, override, Issue Allotments batch + emails.

12. **Team tab** — Invite by email, Admin/Reviewer roles.

13. **Queries tab** — Ticket list, open/resolved workflow.

14. **Registration portals** — `/register/delegate` and `/register/delegation` (separate spec: `feature-spec/registration/` when created).

### Build order

```
Schema + Auth
  → Overview stats + banner
  → Registrations tab (payment confirm + email)
  → Pricing tab
  → Registration portals (delegate + delegation)
  → Committees + study guides
  → Sponsors
  → Queries
  → Team
  → Allotments + merit engine
  → Graph polish
```

---

## Document index

| File | Contents |
|---|---|
| `00-blueprint.md` | This file — alignment, decisions, build order |
| `01-overview-dashboard.md` | Stats cards, graph, banner editor |
| `02-tabs.md` | Pricing · Committees · Registrations · Sponsors |
| `03-data-model.md` | Supabase tables, RLS, Storage |
| `04-email.md` | Resend templates and triggers |
| `05-operations.md` | Allotments · Team · Queries |

---

**Blueprint confirmed. Ready for implementation.**
