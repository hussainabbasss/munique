# Munique 2026 Conference Platform

## Register

**brand** — The public conference website is a marketing surface where design IS the product. Admin dashboard and registration portal are product register (design serves the workflow).

## Users & Purpose

- **Delegates** arriving from Instagram on mobile — need institutional credibility and a clear Register path within seconds.
- **Executive Board** — operational control via admin dashboard (separate surfaces).
- **Sponsors & partners** — professional public presence reflecting Munique's credibility.

## Design Language — “The Assembly” (July 2026 redesign)

International Typographic Style rebuilt for 2026, painted in the Munique brand
palette (parchment / deep navy / violet — matching the Instagram identity):
navy drench fields on a warm parchment body, with a violet accent for CTAs and
live markers. Monumental condensed placard type over a civic body face with mono details.

- **Palette (OKLCH, in `app/globals.css`):** `--cobalt` (deep-navy drench surfaces —
  hero + `.hall` bands), `--ink` (near-black navy — text + dark bands), `--paper` /
  `--paper-2` (warm parchment body, per the brand — intentionally warm here),
  `--signal` (violet accent for CTAs/live markers — cream `--on-dark` text on it,
  NOT ink), `--on-dark` / `--on-dark-dim` (warm cream text on navy).
- **Type:** Big Shoulders (display placard caps) · Public Sans (body/UI) ·
  Spline Sans Mono (procedural labels, data, indices).
- **Vocabulary:** hairline rules (`--line*`), `.hall` navy page headers, `.ledger`
  row systems instead of card grids, `.plate` flat panels, sharp corners everywhere,
  zero box-shadows, `.btn-*` rectangular uppercase buttons, `.tag` mono chips.
- **Motion:** wire ticker (status banner), `Reveal` scroll entrances
  (enhance-not-gate, reduced-motion safe), hover floods (background/color),
  arrow slides, slow seal rotation. Transform/opacity/color transitions only.
- **Seal:** `SealLine` (currentColor line art) on dark fields; raster `logo.png`
  reserved for light contexts.

## Anti-References

- The pre-2026 Cinzel/gold "dossier" typography and rounded-card layout — retired.
  (The parchment body colour returned in July 2026 as the brand palette, but on the
  new Assembly structure — sharp, hairline-ruled, condensed placard type. Parchment
  here is the deliberate brand identity, not the AI-default warm near-white.)
- Generic SaaS card grids, pill buttons, rounded cards, soft drop shadows, glassmorphism.
- Stock UN/diplomacy hero photography (the hero is an original seating-chart SVG scene).
- Eyebrow kickers above every section; numbered section scaffolding outside true sequences.

## Strategic Design Principles

1. **Drench, don't decorate** — cobalt/ink/paper planes carry the identity; hairlines structure it.
2. **Rows, not cards** — ledgers and plates are the default affordances.
3. **Procedural voice** — mono meta rows carry real facts (roster counts, capacity, TBD states as official "TBA" stamps, never apologies).
4. **Motion is part of the build** — every surface has purposeful, reduced-motion-safe choreography.

## Primary Surface

Homepage at `/` — public front door routing to registration and conference information.
