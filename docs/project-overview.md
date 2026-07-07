# Project Overview: Munique 2026 Conference Platform

**Client:** Munique 2026 (Executive Board)
**Delivered by:** System Summit — PR & Outreach / Digital Architects for Diplomacy
**Proposal Date:** 4th July 2026
**Document Type:** Project Overview & Technical Scope
**Status:** Draft — pending EB confirmation

---

## 1. Product Definition

The Munique 2026 Conference Platform is a purpose-built digital system replacing Munique's current fragmented workflow (Google Forms + spreadsheets + WhatsApp threads) with a single, cohesive stack consisting of:

1. A **public-facing conference website**
2. A **registration portal** for individual and delegation applicants
3. A **Merit-Logic Allotment Engine** (AI-assisted country/committee allotment, Beta)
4. An **EB Admin Dashboard** for the Executive Board to manage the entire delegate lifecycle from one place

The platform is delivered to Munique at **zero monetary cost**, in exchange for digital partnership credit and sponsorship-tier benefits (see Section 6). This is a System Summit-built product, not a bespoke agency engagement — meaning delivery timelines are aggressive and the system is designed to be reusable across future MUN conferences.

---

## 2. Background & Problem Statement

Munique currently relies on:
- Google Forms for registration (no automation, no sync, manual exports)
- Manual, spreadsheet-based country/committee allotment for an estimated **250–300 applications**, taking the admin team **2–3 days** of manual work per cycle
- WhatsApp threads for delegate queries, with no central record or accountability trail

This creates operational drag on the Executive Board during the highest-pressure part of the conference cycle (pre-conference admin) and produces a fragmented, inconsistent experience for delegates.

---

## 3. Goals

| Goal | Description |
|---|---|
| **Eliminate manual allotment work** | Reduce 2–3 days of manual country/committee assignment to minutes via a Weighted Merit Score system |
| **Unify delegate data** | Single source of truth for all registration, allotment, and query data — no more scattered forms/sheets/chats |
| **Professionalize Munique's public presence** | A fast, mobile-first website that reflects Munique's credibility to delegates, schools, and sponsors |
| **Give the EB operational control** | One dashboard for live registration, allotment management, and delegate queries |
| **Establish System Summit as a recurring MUN infrastructure partner** | Position this build as a case study / beta deployment for future conferences beyond Munique 2026 |

---

## 4. Target Users

- **Delegates / Applicants** — individuals and delegations applying to Munique 2026
- **Executive Board (EB)** — Munique's admin/operations team, responsible for reviewing allotments and managing the conference
- **Secretariat** — profile/content owners, featured on the website
- **Sponsors & Partners** — displayed on a dedicated section of the site
- **General public / schools** — visitors researching the conference, schedule, and study guides

---

## 5. Feature Scope

### 5.1 Conference Website (Public)
Custom-built, fast, mobile-first site specific to Munique.

**Pages/Sections:**
- Home
- About
- Secretariat & Executive Board profiles
- Committee details & agendas
- Registration forms (entry point into Registration Portal)
- Schedule & venue information
- Contact information
- Sponsor & partner section
- Gallery (populated post-conference)
- Study Guide reveal
- AI-based allotments status (Beta Programme surface)

**Delivery milestones:**
- Website live within **3 days** of confirmation
- Executive Login Panel (Admin Dashboard access) live within **4 days** of confirmation

### 5.2 Registration Portal
Fully replaces Google Forms.

- Supports both **individual** and **delegation** registration flows
- All submitted data syncs automatically to the EB Admin Dashboard/registration panel — no manual export/import
- **Automatic confirmation emails** triggered on submission
- **Payment is in scope**, but handled as a **direct, manual process** — no payment gateway integration for v1:
  - Delegate pays via direct/manual means (e.g., bank transfer) outside the platform
  - Delegate attaches a **payment screenshot** as proof, uploaded through the registration/admin panel
  - An admin reviews the screenshot in the dashboard and clicks **Confirm** — this sets the applicant's **payment status to `true`**
  - Payment confirmation is independent from allotment issuance (see 5.4) — confirming payment does not automatically release an allotment

### 5.3 Merit-Logic Allotment Engine (Beta Programme)
> Note: This is explicitly flagged in the proposal as a Beta feature — **can be removed on request** if Munique's EB does not want to pilot it.

Designed to handle **250–300 applications** without manual spreadsheet work.

- Every applicant receives a **Weighted Merit Score**, computed from their **MUN experience** and stated preferences
- Scoring accounts for **committee difficulty/prestige**, not just raw preference matching. Example logic: an average-experience delegate can realistically be placed in a country like USA within a lower-stakes committee (e.g., UN Women, SPECPOL), but should **not** be placed in USA within UNSC — due to veto-power status and the small number of seats in that committee raising the competitive bar significantly
- System **automatically suggests** the most suitable country/committee allotment per applicant based on this weighted logic
- EB retains final authority: reviews and confirms suggested allotments — the system assists, it does not auto-finalize
- **LLM provider: Gemini** — used to power the merit scoring / suggestion logic
- Goal: compress a 2–3 day manual process into minutes

**Deferred (not blocking initial build):**
- Tie-breaking logic for allotment conflicts (e.g., two high-merit applicants preferring the same country/committee) — left unspecified for now, to be handled manually by EB on a case-by-case basis if it arises
- Formal audit trail for EB overrides — not required for v1

### 5.4 EB Admin Dashboard
Central operational control panel for the Executive Board. Built to show **everything** — no data or workflow step should require leaving the dashboard.

- **Live registration overview** — real-time view of all incoming applications, including payment status per applicant
- **Team member management** — EB can add team/staff members to the admin panel (implies role-based access; exact permission levels TBD)
- **Payment confirmation workflow** — admin reviews uploaded payment screenshots and manually clicks Confirm to set payment status to `true`
- **Allotment management** — review/override Merit-Logic Engine suggestions
- **Manual allotment issuance gate** — allotments are **never auto-released** on generation. Suggested allotments sit in a pending state until an **EB member manually clicks "Issue Allotments."** On click, the system:
  1. Auto-issues the finalized allotments
  2. Automatically sends each delegate an email containing their allotment
- **Delegate query management** — structured intake/resolution of delegate questions, replacing ad hoc WhatsApp threads

**Note:** Payment confirmation and allotment issuance are two separate, independently-triggered actions. An applicant can be payment-confirmed without yet having an allotment, and allotments are only released conference-wide (or in batches) at the EB's discretion via the issuance button.

---

## 6. Commercial Terms (What System Summit Receives)

In exchange for the platform being delivered at zero cost, System Summit requests:

- **"Official Digital Partner, Munique 2026"** credit on the website and all conference banners
- An **Instagram post reveal** announcing the partnership
- **Benefits equivalent to the mid-tier Sponsorship plan** (specific benefits to be pulled from Munique's sponsorship deck and itemized in the final agreement)

---

## 7. Tech Stack (Decided)

| Layer | Choice |
|---|---|
| Backend / Database | **Supabase** (Postgres, auth, storage — payment screenshots likely land in Supabase Storage) |
| Allotment Engine / LLM | **Gemini** (merit scoring + suggestion logic) |
| Frontend | TBD in `ui-context.md` — expected to follow standard System Summit stack (React-based) given prior project patterns |

---

## 8. Out of Scope (for this phase)

The proposal does not explicitly commit to the following — these should be confirmed with the EB before assuming inclusion:

- **Automated payment gateway integration** — payment is in scope but handled manually via screenshot upload + admin confirmation (see 5.2); no Stripe/JazzCash/EasyPaisa API integration in v1
- Post-conference certificate generation
- Multi-conference/multi-tenant support (this is a single-conference build; reusability for future conferences is a System Summit internal goal, not a contracted deliverable)
- Native mobile app (site is mobile-first web, not a packaged app)
- Long-term hosting/maintenance SLA beyond initial delivery (to be clarified)

---

## 9. Timeline

| Milestone | Target |
|---|---|
| EB confirmation received | Day 0 |
| Conference website live | Day 3 |
| Executive Login Panel (Admin Dashboard) live | Day 4 |
| Registration Portal live | Bundled with website (Day 3) |
| Merit-Logic Allotment Engine | Beta — timeline to be confirmed separately, contingent on EB opt-in |

---

## 10. Success Criteria

- Registration fully migrated off Google Forms with zero manual data re-entry
- EB reports reduced admin time on allotments (target: hours instead of days)
- No delegate queries handled outside the dashboard's query management system post-launch
- Munique EB approves "Official Digital Partner" branding placement
- Platform stable and live for the full registration-to-conference window without critical downtime

---

## 11. Risks & Considerations

- **Beta risk:** Merit-Logic Allotment Engine is unproven at this scale for Munique specifically — EB should be given a clear opt-out path if trust in AI-suggested allotments is low in year one.
- **Aggressive timeline:** 3–4 day live deadlines require scope to be tightly locked before build starts — any scope creep post-confirmation risks the delivery date.
- **Data sensitivity:** Delegate personal data (registration, portfolios) needs a clear data-handling/privacy statement, especially since portfolios feed the Merit Score engine.
- **Sponsorship benefit ambiguity:** "Mid-tier Sponsorship plan" benefits should be itemized in writing to avoid disputes post-delivery.
- **Screenshot-based payment verification is manual and trust-based:** no automated reconciliation against a bank statement/gateway — fraud/error relies entirely on admin diligence. Acceptable for v1 given no gateway integration, but worth flagging to EB.
- **Allotment issuance is a one-way, irreversible-feeling action from the delegate's perspective:** once "Issue Allotments" is clicked, emails go out automatically. EB should be confident in the batch before triggering — consider a confirmation step/preview before final send.

---

## 12. Next Steps

1. EB reviews and confirms proposal (or requests changes to allotment engine scope)
2. Lock final feature list (confirm Beta engine in/out)
3. Confirm sponsorship benefit itemization in writing
4. Begin build against Day 0 confirmation
5. Produce `ui-context.md` covering page-level design direction, branding, and component structure (per standard System Summit documentation process)
