# 01 — Homepage Blueprint

**Status:** Draft — pending confirmation before build  
**Companion docs:** `project-overview.md`, `ui-context.md`  
**Asset:** `/public/logo.png` (Munique emblem seal — high-res PNG, source of truth for hero + nav)  
**Route:** `/` (Next.js App Router — `app/page.tsx`)

---

## What we are building

The Munique 2026 homepage is the **public front door** of the conference platform: a mobile-first marketing surface that establishes institutional credibility, routes visitors to registration and key conference information, and introduces the Secretariat without feeling like a generic MUN template or AI-generated landing page.

The page is **emblem-first, not photo-first**. The hero is the seal itself (`logo.png`), not stock photography, gradient blobs, or a hero-metric SaaS layout. Everything else on the page reads like documents laid on a chancellery desk — index cards, hairline rules, restrained typography — not a card-grid of icons.

This document locks the decisions that would change implementation. Confirm the open items in Section 12 before coding starts.

---

## Language we agreed on

Before build — confirm these terms mean the same thing to everyone:

| Term | Definition |
|---|---|
| **Seal / Emblem** | The circular UN-style mark in `logo.png`. Used as the hero focal point, nav wordmark anchor, portrait ring echo, and the platform-wide status language (see `ui-context.md` §3). Not a decorative logo lockup — it *is* the brand artifact. |
| **Edition I** | Munique's first conference edition. Copy uses *"Edition I"* (Roman numeral), matching Instagram bio tone — not "1st edition" or "2026 edition". |
| **Register** | Primary CTA. Links to `/register` (Registration Portal entry). Not "Apply now", "Get started", or "Join us". |
| **Index cards** | The committee/schedule/about preview blocks: `--parchment-light` surface, 1px hairline border, 2–4px radius, **no** soft drop shadow. Named for the physical metaphor, not generic "feature cards". |
| **Ceremonial moment** | One high-energy typographic beat per viewport max — condensed all-caps display (e.g. "REGISTRATION IS LIVE") or magenta accent. Overuse kills the register. |

**Correction gate:** If any term above is wrong, fix it here before implementation.

---

## Scene sentence (design north star)

> A delegate opens the link from Instagram on their phone, indoors, one hand — they need to know within three seconds that Munique is a **real institution**, not another school club poster, and find Register without hunting.

This sentence forces: light parchment (readable in glare), ink-navy contrast, large tappable Register, no scroll-jacking, no dark-mode neon pivot.

---

## Design decisions

Decisions below combine `ui-context.md` (existing Munique brand from Instagram) with impeccable anti-slop guardrails. Where the two conflict, **identity-preservation wins** — we extend Munique's established dossier aesthetic, not invent a new one.

### 1. Hero strategy: seal, not stock

**Decision:** Full-viewport hero centered on `logo.png` at ~180–240px (mobile) / ~280–320px (desktop), with serif display title below and one condensed CTA beneath.

**Why:** Munique's Instagram already treats the emblem as an official seal on aged parchment. Stock "diplomacy" photos (flags, gavels, UN building) are the first-order MUN-site reflex and read as template. The seal *is* the imagery brief.

**Reject:** Full-bleed photo hero, illustrated globe, gradient mesh background, floating 3D badge.

### 2. Color strategy: Committed parchment + ink

**Decision:** `--parchment` (#E9DFC3) body background with subtle paper-grain overlay. `--ink-navy` primary text and structural lines. `--gold-foil` for dividers, focus rings, and footer partner seal ring. `--magenta-accent` at most **once** on the homepage (live registration badge only, if registrations are open).

**Why:** This is Munique's existing palette — not the AI-default warm cream (#F5F0E8-family) + terracotta accent lane. Committed strategy: parchment carries most of the surface; gold earns its place at ceremonial touchpoints.

**Reject:** Pure white `#FFFFFF` page bg, true black text, navy-dark-mode toggle, terracotta/clay accents, glassmorphism nav.

### 3. Typography: three voices, strict budgets

**Decision:**

| Voice | Face (Google Fonts) | Homepage budget |
|---|---|---|
| Ceremonial display | Cormorant SC | Wordmark line, section titles (≥34px) |
| Declarative punch | Anton | **One line max** in hero CTA area — e.g. "REGISTRATION IS LIVE" |
| Body / nav | Source Sans 3 | All navigation, descriptions, footer links |

**Why:** Matches established Instagram material (`ui-context.md` §2.2). Impeccable reflex-rejects Cormorant/Inter for *greenfield* projects; here the brand already committed on Instagram — swapping faces would drift from the dossier identity.

**Reject:** Inter/Geist as body (currently in scaffold — replace), Playfair/Fraunces editorial pivot, monospace in marketing copy (mono reserved for registration IDs elsewhere).

### 4. Layout: document desk, not SaaS card grid

**Decision:** Single-column flow on mobile; desktop uses asymmetric two-column only where content naturally pairs (e.g. About blurb + key dates). Index-card previews use a **horizontal scroll strip** on mobile (snap) and `repeat(auto-fit, minmax(280px, 1fr))` grid on desktop — not three identical icon+heading+text cards.

**Why:** Identical feature-card grids are an AI scaffold tell. Index cards differ by content (committee name + seat count, schedule date + venue, about excerpt) — structure varies, metaphor stays.

**Reject:** 3-column equal icon cards, numbered section eyebrows (01 · About / 02 · Committees), side-stripe accent borders, 24px+ card radius.

### 5. Navigation: minimal, sticky, functional

**Decision:** Sticky top bar on `--parchment-light` with hairline bottom rule. Left: small seal (32px) + "MUNIQUE" serif wordmark. Right: text links (About, Committees, Schedule, Contact) + solid `--ink-navy` **Register** button (2–4px radius, not pill). Mobile: wordmark + Register;其余 links in a `<dialog>` or native drawer — no hamburger that hides Register.

**Why:** Delegates arrive from Instagram → Register must never be buried. Sticky nav is functional, not decorative glass.

### 6. Motion: stamp reserved; page stays quiet

**Decision:** Homepage load — seal fades/scales in (200ms ease-out, no bounce). No scroll-triggered section reveals. No parallax. `prefers-reduced-motion`: instant presence, no scale.

**Why:** Authority through restraint (`ui-context.md` §5). The stamp animation is reserved for registration confirmation — using it on homepage would spend the brand's one orchestrated motion beat.

### 7. Footer partner credit: seal, not badge strip

**Decision:** Footer includes a small gold-ring seal rendering with copy: *"Official Digital Partner — System Summit"* per commercial terms (`project-overview.md` §6). Not a generic "Powered by" logo row.

---

## Page architecture

Top-to-bottom section order. Each section has one job — no duplicate CTAs competing with Register.

```
┌──────────────────────────────────────────────────────────────┐
│  STICKY NAV  [seal + MUNIQUE]              Register →        │
├──────────────────────────────────────────────────────────────┤
│  HERO (min-height: ~85vh mobile, ~75vh desktop)              │
│    · logo.png — centered, priority load                      │
│    · "MUNIQUE 2026" — Cormorant SC, small-caps             │
│    · "Edition I" — secondary line, ink-navy-soft             │
│    · Tagline: "Uniqueness Of Diplomacy" (from IG bio)        │
│    · [Optional] Anton line if reg open: "REGISTRATION IS LIVE"│
│    · Primary CTA: Register (ink-navy button)                 │
│    · Secondary text link: View committees ↓ (anchor scroll)  │
├──────────────────────────────────────────────────────────────┤
│  CONFERENCE FACTS — horizontal rule + 3–4 inline facts       │
│    Dates · Venue city · Delegate capacity · Edition          │
│    (monospace for dates/numbers only if needed for scan)     │
├──────────────────────────────────────────────────────────────┤
│  INDEX CARDS — "Explore"                                     │
│    Card A: About Munique (excerpt + Read more → /about)      │
│    Card B: Committees (count + sample names + → /committees) │
│    Card C: Schedule & Venue (dates + → /schedule)            │
│    Card D: Study Guide (state: Coming soon / Available →)    │
│    Layout: scroll-snap row mobile · auto-fit grid desktop    │
├──────────────────────────────────────────────────────────────┤
│  SECRETARIAT PREVIEW                                         │
│    Section title: "Secretariat" (serif)                      │
│    4–6 portrait circles with gold-to-magenta ring (CSS       │
│    gradient border echoing IG avatar ring — subtle, 2px)       │
│    Name + role beneath each · link to full /secretariat      │
│    No carousel autoplay                                      │
├──────────────────────────────────────────────────────────────┤
│  SPONSORS & PARTNERS                                         │
│    Single row of sponsor logos (grayscale → color on hover)  │
│    Placeholder state if logos TBD: hairline boxes + "TBA"    │
│    System Summit gets seal treatment, not same as sponsors   │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
│    Contact · Instagram @munique_2026 · Privacy (stub)        │
│    Partner seal: Official Digital Partner — System Summit    │
│    © Munique 2026 · Edition I                                │
└──────────────────────────────────────────────────────────────┘
```

### Sections explicitly NOT on homepage v1

Keep the homepage focused. These are separate routes linked from nav/cards:

- Full committee agendas (→ `/committees`)
- Registration form fields (→ `/register`)
- Gallery (post-conference — `project-overview.md` §5.1)
- Allotment engine status surface (beta — separate page when EB opts in)
- EB Admin login (→ `/admin` or `/login` — not linked from public nav)

---

## Component specs

### `SiteNav`

- Sticky `top: 0`, `z-index: sticky` (define scale in globals — no `9999`)
- Height: 56px mobile / 64px desktop
- Register button: min 44×44px touch target, `--ink-navy` bg, `--paper-white` text

### `HeroSeal`

- `next/image` for `logo.png`, `priority`, explicit `width`/`height`, `alt="Munique 2026 official seal"`
- No `dark:invert` — brand has no dark mode on public marketing pages for v1

### `IndexCard`

- Background: `--parchment-light`
- Border: 1px `--ink-navy-soft`
- Radius: 3px
- Elevation: optional 2px hard offset shadow (`2px 2px 0 var(--ink-navy-soft)`) — **never** border + 16px blur shadow together
- Entire card is one `<a>` or contains one primary link — no nested buttons

### `SecretariatPortrait`

- Circle avatar, 96px mobile / 120px desktop
- Ring: `background: linear-gradient(135deg, var(--gold-foil), var(--magenta-accent))` on padding-box trick or pseudo-element — 2px ring only, not thick gradient border on whole section

### `PartnerSeal`

- Smaller seal variant + one line of serif small-caps credit
- Links to System Summit (URL TBD)

---

## Copy requirements

Voice: declarative, ceremonial, confident (`ui-context.md` §6).

| Element | Copy (draft — EB may revise) |
|---|---|
| Hero title | MUNIQUE 2026 |
| Hero subtitle | Edition I |
| Tagline | Uniqueness Of Diplomacy |
| Hero CTA | Register |
| Hero secondary | View committees |
| Registration live banner | REGISTRATION IS LIVE |
| Facts row | `[Dates TBD]` · `[Venue TBD]` · `250–300 Delegates` · `Edition I` |
| About card | Short institutional blurb — 2 sentences max on homepage |
| Study guide card | Study guides will be published before committee sessions. |
| Footer IG | Follow @munique_2026 |

**Button consistency:** If the hero says **Register**, the nav button says **Register**, and `/register` page title says **Registration** — not "Apply" or "Sign up" anywhere in the funnel entry.

---

## Anti-slop checklist (build-time gate)

Run before marking homepage done:

- [ ] No cream/sand body bg drift — verify against `#E9DFC3` token, not Tailwind `zinc-50` / `stone-100`
- [ ] No pill buttons (`rounded-full`) on primary actions
- [ ] No gradient text, glass nav, or decorative CSS grid overlay on hero
- [ ] No eyebrow labels above every section ("ABOUT" / "COMMITTEES" / "TEAM")
- [ ] No numbered section markers (01 · 02 · 03) unless a section is a true sequence
- [ ] No icon + heading + blurb card grid with identical structure × 3+
- [ ] No confetti, bounce, or elastic easing
- [ ] No stock UN/diplomacy hero photo slotted in "for visual interest"
- [ ] No Geist/Inter left from Next scaffold in public pages
- [ ] Seal/status checkmarks not mixed — homepage uses seal motif only
- [ ] Contrast: `--ink-navy` on `--parchment` ≥ 4.5:1 at 16px body (verify with audit tool)
- [ ] `logo.png` loads with meaningful `alt`, not "logo" or empty

---

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| `< 640px` | Single column, hero seal ~180px, nav shows wordmark + Register only, index cards horizontal scroll with snap, secretariat 2-column grid |
| `640–1024px` | Seal ~220px, full nav visible if space, index cards 2-column grid |
| `> 1024px` | Max width 1200px centered, seal ~280px, index cards auto-fit grid, secretariat 3–4 columns |

Min horizontal margin: 24px. Body line length cap: 65–75ch on prose blocks.

---

## Accessibility

- Skip link: "Skip to main content" → `#main`
- Focus ring: 2px `--gold-foil-bright` outline, offset 2px
- All images: descriptive alt (seal, portraits, sponsor logos)
- Reduced motion: honor `prefers-reduced-motion`
- Register CTA: reachable by keyboard as first tab stop after skip link (or immediately after nav landmark)

---

## Technical implementation steps

Ordered for Day 0–3 delivery (`project-overview.md` §9):

1. **Tokens** — Replace scaffold `globals.css` with design tokens from `ui-context.md` §2 (CSS custom properties + Tailwind `@theme` mapping)
2. **Fonts** — Load Cormorant SC, Anton, Source Sans 3 via `next/font/google` in `layout.tsx`; remove Geist from public pages
3. **Metadata** — Update `layout.tsx` title/description for Munique 2026
4. **Layout shell** — `SiteNav` + `Footer` as shared components (`components/site-nav.tsx`, `components/site-footer.tsx`)
5. **Hero** — `HeroSeal` section in `app/page.tsx` using `/logo.png`
6. **Facts row** — Static until EB confirms dates/venue
7. **Index cards** — Four cards linking to stub routes (`/about`, `/committees`, `/schedule`, `/study-guide`)
8. **Secretariat preview** — Grid with placeholder portraits until EB provides photos
9. **Sponsors strip** — Placeholder TBA state
10. **Paper grain** — CSS noise overlay at ≤4% opacity on `--parchment` (performance-check on mid-range Android)
11. **Audit** — Run contrast + responsive pass; screenshot mobile + desktop before handoff

### File map (expected)

```
app/
  page.tsx              ← homepage composition
  layout.tsx            ← fonts, metadata, body tokens
  globals.css           ← design tokens
components/
  site-nav.tsx
  site-footer.tsx
  hero-seal.tsx
  index-card.tsx
  secretariat-portrait.tsx
  partner-seal.tsx
public/
  logo.png              ← provided by EB / design
```

---

## Assumptions

- `logo.png` is the high-res emblem already used on Instagram (transparent or parchment-compatible background)
- Registration is **open** at launch — hero shows live CTA; if closed, Anton line becomes "REGISTRATION OPENS SOON" and Register button becomes disabled/waitlist (TBD)
- Dates, venue, and secretariat photos are placeholders until EB supplies content — layout ships with sensible TBD copy
- No dark mode on public marketing pages for v1 (scaffold dark classes removed)
- English only for v1
- Study guide card links to a stub page until guides are uploaded

---

## Open items (confirm before build)

| # | Question | Default if no answer |
|---|---|---|
| 1 | Are registration and dates confirmed live at homepage launch? | Show "REGISTRATION IS LIVE" + active Register |
| 2 | Exact conference dates and venue city for facts row? | `[Dates TBD]` / `[Venue TBD]` placeholders |
| 3 | How many secretariat members to preview on homepage (4 vs 6)? | 4 |
| 4 | Sponsor logos available at Day 3, or TBA placeholders? | TBA placeholders |
| 5 | System Summit partner link URL? | Text only, no link |
| 6 | Paper grain: CSS noise vs static texture asset? | CSS noise (lighter weight) |
| 7 | Instagram link: confirm handle `@munique_2026`? | Yes, per ui-context source |

---

## Confirmation

**Blueprint ready.**

Reply with corrections to the language table (Section 2), any rejected decisions (Section 4), and answers to open items (Section 12). Implementation of `app/page.tsx` begins only after explicit confirmation.

---

*Design guardrails sourced from `ui-context.md` and impeccable brand register. Identity-preservation applies: Munique's Instagram-established parchment/ink/gold dossier aesthetic is extended, not replaced by generic conference-site or AI-template patterns.*
