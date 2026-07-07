# 01 — Overview Dashboard

**Parent:** `00-blueprint.md`  
**Route:** `/admin` (index — default after login)

---

## Purpose

The Overview is the EB's at-a-glance command surface. It answers three questions immediately:

1. How many delegates have registered?
2. What is our confirmed revenue?
3. Is momentum increasing or stalling?

It also hosts the **status banner editor** — the only public-site control that does not live inside a content tab.

---

## Layout wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  MUNIQUE ADMIN          [user@eb.com]  Sign out                 │
├─────────────────────────────────────────────────────────────────┤
│  Overview │ Pricing │ Committees │ Registrations │ Sponsors │     │
│  Allotments │ Team │ Queries                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │ DELEGATES│ │ REGISTR. │ │ PENDING  │ │ CONFIRMED│ │ TOTAL │ │
│  │   247    │ │   198    │ │    41    │ │   157    │ │  PKR  │ │
│  │          │ │  ind 142 │ │          │ │          │ │ 784K  │ │
│  │          │ │  del  56 │ │          │ │          │ │       │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Registrations — last 30 days                    [line chart]││
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Public status banner                                       ││
│  │  Message: [REGISTRATION IS LIVE · REGISTER NOW →        ]     ││
│  │  Link:    [/register                                    ]     ││
│  │  Visible: [x] Show on public site                             ││
│  │                                          [ Save banner ]      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Quick actions                                              ││
│  │  → Pending payments (41)  → Open queries (12)  → Export CSV ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Stat cards

### Card 1 — Total Delegates

- **Primary number:** Total delegate headcount
- **Calculation:** `COUNT(*)` from `delegates` table (or `SUM(delegate_count)` if denormalized on registration)
- **Label:** "Total Delegates" (Source Sans 3, 14px) / number in monospace 34px+
- **Subtext:** None, or "across all applications"

### Card 2 — Registrations

- **Primary number:** Total application count
- **Subtext:** `142 individual · 56 delegation` (split line, 12px muted)
- **Click action:** Navigate to Registrations tab with no filter

### Card 3 — Payment Pending

- **Primary number:** Count where `payment_status = 'pending'`
- **Accent:** `--status-pending` (gold-foil) left border or seal-in-progress icon
- **Click action:** Registrations tab filtered to `pending`

### Card 4 — Payment Confirmed

- **Primary number:** Count where `payment_status = 'confirmed'`
- **Accent:** `--status-confirmed` (forest green) or full seal icon
- **Click action:** Registrations tab filtered to `confirmed`

### Card 5 — Total Amount

- **Primary number:** `SUM(fee_amount)` for confirmed registrations
- **Format:** `PKR 784,500` — monospace, locale-formatted
- **Subtext:** "Confirmed payments only"
- **Note:** Does not include pending — EB should not treat this as bank balance

### Responsive behavior

- Desktop: 5 cards in one row (`grid-cols-5`) or 3+2 wrap
- Mobile: 2-column grid, Total Amount spans full width

### Data freshness

- Server Component fetches on page load
- Optional: Supabase Realtime subscription on `registrations` for live counter updates without full refresh (nice-to-have, not blocking v1)

---

## Graph — registrations over time

### Spec

| Property | Value |
|---|---|
| Type | Line chart |
| X-axis | Calendar date (last 30 days) |
| Y-axis | New registrations submitted that day |
| Data source | `registrations.created_at` grouped by `DATE(created_at AT TIME ZONE 'Asia/Karachi')` |
| Empty state | "No registrations yet" flat line at zero |
| Colors | Line: `--ink-navy`, grid: `--ink-navy-soft` at 20% opacity, surface: `--paper-white` |

### Interactions

- Hover/tap tooltip: date + count
- No zoom/pan in v1 — keep it simple
- Respect `prefers-reduced-motion`: no draw animation

### Implementation note

Fetch aggregated data server-side as `{ date: string, count: number }[]`. Pass to client chart component. Avoid querying 300 raw rows client-side.

---

## Status banner editor

Controls the public `StatusBanner` component (`components/status-banner.tsx`).

### Fields

| Field | Type | Validation | Default |
|---|---|---|---|
| `banner_message` | Text input | 1–120 chars, required if visible | `REGISTRATION IS LIVE · REGISTER NOW →` |
| `banner_href` | Text input | Valid internal path or URL | `/register` |
| `banner_visible` | Checkbox | — | `true` |

### Behavior

1. Admin edits fields and clicks **Save banner**
2. Server action upserts `site_settings` row (`key = 'status_banner'`, `value = JSON`)
3. `revalidatePath('/')` and any layout that renders the banner
4. Toast: "Banner updated" (plain copy, no celebration animation)

### Public consumption

```tsx
// layout.tsx or page.tsx — server fetch
const { message, href, visible } = await getSiteSetting('status_banner');
<StatusBanner message={message} href={href} visible={visible} />
```

Fallback: if Supabase unreachable, use current hardcoded defaults so public site never breaks.

### Preview

Optional inline preview strip below the form — renders a static (non-scrolling) sample of the banner text in Anton at reduced scale. Not required for v1.

---

## Quick actions row

Lightweight links below the graph — not full features, just navigation shortcuts:

| Action | Target |
|---|---|
| View pending payments | `/admin/registrations?payment=pending` |
| Open queries | `/admin/queries?status=open` |
| Export registrations | CSV download server action (all registrations, key columns) |

Export columns: `registration_id`, `type`, `name`, `email`, `committee_pref`, `payment_status`, `fee_amount`, `created_at`.

---

## Operations tabs (v1)

Allotments, Team, and Queries are full v1 tabs — see `05-operations.md`. Overview quick actions link to the highest-traffic surfaces (pending payments, open queries); **Issue Allotments** lives only on `/admin/allotments` as a gated primary action.

---

## Visual rules (from `ui-context.md`)

- Surface: `--paper-white` main panel, `--parchment` outer shell optional
- Stat card borders: 1px `--ink-navy-soft`, 2–4px radius
- Numbers: IBM Plex Mono (or utility mono from globals)
- Labels: Source Sans 3
- No dark mode, no pill buttons, no generic admin-template sidebar collapse animation
- Focus rings: `--gold-foil-bright`
