# Munique 2026 — Build Progress

Last updated: 2026-07-05 (Registration Portal v1)

## Homepage (`01-homepage.md`)

| Step | Task | Status | Notes |
|------|------|--------|-------|
| 1 | Design tokens in `globals.css` | ✅ Done | + buttons, nav, mosaic, facts band |
| 2 | Fonts (Cormorant SC, Anton, Source Sans 3) | ✅ Done | |
| 3 | Metadata in `layout.tsx` | ✅ Done | |
| 4 | `SiteNav` + `SiteFooter` | ✅ Done | Fixed overlay nav on hero, solid on scroll |
| 5 | `Hero` (was `HeroSeal`) | ✅ Done | Full-bleed gavel photography + seal frame |
| 6 | Conference facts row | ✅ Done | Ink-navy stat band with gold labels |
| 7 | Explore section | ✅ Done | Asymmetric photo mosaic (not card strip) |
| 8 | Secretariat preview | ✅ Done | Ink-navy section, gradient portrait rings |
| 9 | Sponsors strip | ✅ Done | TBA dashed placeholders |
| 10 | Paper grain overlay | ✅ Done | Subtle CSS noise |
| 11 | Stub routes | ✅ Done | |
| 12 | Imagery | ✅ Done | Verified Unsplash gavel + desk photos |
| 13 | Contrast + responsive audit | ⏳ Pending | |

## Registration Portal (`02-reg.md`)

| Step | Task | Status | Notes |
|------|------|--------|-------|
| 1 | `lib/registration` — submit, fees, id, queries, draft | ✅ Done | Service-role server action; server-side fee snapshot |
| 2 | `/register` chooser | ✅ Done | Live fees from `pricing_config`; early bird strikethrough |
| 3 | `/register/delegate` — 5-step wizard | ✅ Done | About → prefs → payment → review → confirmation |
| 4 | `/register/delegation` — 6-step wizard | ✅ Done | School/head → members → prefs → payment → review → confirm |
| 5 | `sessionStorage` draft persistence | ✅ Done | Cleared on confirmation |
| 6 | Payment proof upload | ✅ Done | `payment-proofs/{registration_id}/{uuid}` via service role |
| 7 | Seal stamp confirmation | ✅ Done | `prefers-reduced-motion` fallback |
| 8 | `sendRegistrationReceived` on submit | ✅ Done | Submit succeeds even if email fails |
| 9 | Closed state (no active pricing) | ✅ Done | |
| 10 | `ui-context.md` §4.2 update | ✅ Done | Chooser + two routes documented |
| 11 | E2E smoke (delegate + delegation rows in admin) | ⏳ Pending | Requires Supabase + Storage bucket |

## EB Admin Panel (`feature-spec/admin/`)

| Step | Task | Status | Notes |
|------|------|--------|-------|
| 1 | Dependencies + env template | ✅ Done | `@supabase/supabase-js`, `@supabase/ssr`, `resend`, `recharts` |
| 2 | Supabase schema + RLS migration | ✅ Done | `supabase/migrations/001_admin_schema.sql` |
| 3 | Supabase clients + middleware auth | ✅ Done | `/admin/*` protected; `/admin/login` public |
| 4 | Admin shell (header + 8-tab nav) | ✅ Done | Overview + Pricing · Committees · Registrations · Sponsors · Allotments · Team · Queries |
| 5 | Overview dashboard | ✅ Done | 5 stat cards, 30-day line chart, banner editor, quick actions, CSV export |
| 6 | Status banner → `site_settings` | ✅ Done | Public layout reads DB; hardcoded fallback if Supabase unreachable |
| 7 | Pricing tab | ✅ Done | Delegate + delegation fees, early bird, bank details; Admin-only write |
| 8 | Committees tab | ✅ Done | Agenda CMS, study guide PDF upload, no chairs |
| 9 | Registrations tab | ✅ Done | Filters, payment confirm/reject, auto Resend on confirm |
| 10 | Sponsors tab | ✅ Done | Logo CMS with Storage upload |
| 11 | Allotments tab | ✅ Done | Merit engine (placeholder scoring), override, gated Issue Allotments + batch email |
| 12 | Team tab | ✅ Done | Invite by email, Admin/Reviewer roles |
| 13 | Queries tab | ✅ Done | Ticket list, resolve workflow |
| 14 | Public query intake | ✅ Done | `/contact` form → `queries` table |
| 15 | Resend email templates | ✅ Done | Registration received, payment confirmed, allotment issued |
| 16 | Registration portals | ✅ Done | `/register`, `/register/delegate`, `/register/delegation` |
| 17 | Gemini merit engine | ⏳ Pending | Placeholder scoring wired; swap when `GEMINI_API_KEY` set |
| 18 | Supabase Storage buckets | ⏳ Pending | Create `payment-proofs`, `sponsor-logos`, `study-guides` in dashboard |
| 19 | Seed initial Admin user | ⏳ Pending | Insert `admin_users` row + Supabase Auth invite on first deploy |

## Open items (defaults applied)

| # | Item | Resolution |
|---|------|------------|
| 1 | Registration live at launch? | Yes — active Register + Anton banner |
| 2 | Dates / venue | `[Dates TBD]` / `[Venue TBD]` |
| 3 | Secretariat preview count | 4 members |
| 4 | Sponsor logos | TBA placeholders |
| 5 | System Summit link | Text only, no link |
| 6 | Paper grain | CSS noise |
| 7 | Instagram handle | @munique_2026 |
| 8 | Admin route | `/admin` — not linked from public nav |
| 9 | Payment confirmed email | Automatic on Confirm (Resend) |
| 10 | Two registration portals | Delegate + Delegation — fees independent |
| 11 | Delegation size | Min 2, max 15 (including head) |
| 12 | Committee prefs 2–3 | Optional; pref 1 required |
| 13 | Payment screenshot | Required at submit |
| 14 | MUN experience min | 50 characters |

## Blockers / assets needed from EB

- [ ] **`logo.png`** — High-res emblem seal (source of truth). Interim vector at `public/logo.svg`; swap to `logo.png` in components when asset arrives.
- [ ] Conference dates and venue city for facts row
- [ ] Secretariat names, roles, and portrait photos
- [ ] Sponsor logo files
- [ ] About page institutional copy (2+ sentences)
- [ ] **Supabase project** — run migration, set env vars from `.env.example`
- [ ] **Resend domain** — verify SPF/DKIM before go-live
- [ ] **Initial EB admin** — email for first `admin_users` seed
- [ ] **`payment-proofs` Storage bucket** — required for registration submit

## Anti-slop checklist

- [x] Parchment body `#E9DFC3` — not zinc/stone cream
- [x] No pill buttons on primary actions
- [x] No gradient text, glass nav, or grid overlay on hero
- [x] No section eyebrows or numbered markers
- [x] Index cards vary by content — not identical icon grid
- [x] No bounce/elastic easing; reduced-motion honored
- [x] No stock diplomacy hero photo
- [x] Geist/Inter removed from public pages
- [x] Seal motif only (no checkmark status icons)
- [ ] Contrast verification at 16px body (audit pending)
- [x] Seal alt text: "Munique 2026 official seal"
- [x] Admin uses `--paper-white` surfaces, monospace IDs, hairline tables
- [x] Registration: no fake payment verification progress bar
- [x] Registration: fee computed server-side

## Next up

1. Deploy Supabase migration + configure `.env.local`
2. Create `payment-proofs` Storage bucket in Supabase dashboard
3. E2E smoke: submit delegate + delegation test rows in `/admin/registrations`
4. Wire Gemini merit engine (replace placeholder in `lib/admin/actions/allotments.ts`)
5. Replace `logo.svg` with EB-provided `logo.png`
6. Run contrast/a11y audit on public pages
