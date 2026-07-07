# 02 — Admin Tabs (Pricing · Committees · Registrations · Sponsors)

**Parent:** `00-blueprint.md`  
**See also:** `05-operations.md` for Allotments · Team · Queries

---

## Shared tab chrome

- Horizontal tab bar below admin header, sticky on scroll
- Active tab: `--ink-navy` bottom border 2px, text weight 600
- Inactive: `--ink-navy-soft`, hover underline
- Routes:
  - `/admin` — Overview
  - `/admin/pricing`
  - `/admin/committees`
  - `/admin/registrations`
  - `/admin/sponsors`
  - `/admin/allotments` — see `05-operations.md`
  - `/admin/team` — see `05-operations.md`
  - `/admin/queries` — see `05-operations.md`
- Mobile: tabs scroll horizontally with snap

---

## Tab 1 — Pricing

### Purpose

EB sets fees for the **two registration portals** without code changes. Each portal reads its own fee from active `pricing_config`.

### Two registration portals

| Portal | Public route | Fee field | Calculation at submit |
|---|---|---|---|
| **Delegate** | `/register/delegate` | `delegate_fee` | `fee_amount = delegate_fee` (one person) |
| **Delegation** | `/register/delegation` | `delegation_fee` | `fee_amount = delegation_fee × delegate_count` |

EB updates both fees independently. Early-bird overrides apply per portal when enabled.

### UI

```
┌─────────────────────────────────────────────────────────────┐
│  Pricing                                                    │
├─────────────────────────────────────────────────────────────┤
│  Delegate portal (/register/delegate)                       │
│  Fee (PKR):  [ 4,500        ]  per delegate                 │
│                                                             │
│  Delegation portal (/register/delegation)                   │
│  Fee (PKR):  [ 3,800        ]  per delegate in group       │
│                                                             │
│  Early bird (optional)                                      │
│  [ ] Enable early bird pricing                              │
│  Deadline:   [ 2026-08-15   ]                               │
│  Delegate portal:    [ 3,900        ]                       │
│  Delegation portal:  [ 3,200        ]  per delegate         │
│                                                             │
│  Bank details (shown on both portals' payment step)         │
│  Account title: [ Munique 2026 — EB Account    ]            │
│  Bank / IBAN:   [ _____________________________ ]            │
│  Instructions:  [ multiline textarea           ]            │
│                                                             │
│                              [ Save pricing ]               │
└─────────────────────────────────────────────────────────────┘
```

### Data

Active `pricing_config` row fields:

- `delegate_fee` — PKR per person (delegate portal)
- `delegation_fee` — PKR per delegate in group (delegation portal)
- `early_bird_enabled`, `early_bird_deadline`
- `early_bird_delegate_fee`, `early_bird_delegation_fee`
- `bank_account_title`, `bank_details`, `payment_instructions`

### Rules

- Fee amounts are integers (PKR whole rupees)
- Saving pricing does **not** retroactively change `fee_amount` on existing registrations
- Both portals display current active pricing + shared bank details on payment step
- Reviewer role cannot edit pricing (Admin only)

---

## Tab 2 — Committees

### Purpose

CMS for public `/committees` page. Committees feed registration preference dropdowns and allotment engine difficulty tiers. **No chair assignments in v1.**

### UI — list view

```
┌─────────────────────────────────────────────────────────────┐
│  Committees                              [ + Add committee ]│
├─────────────────────────────────────────────────────────────┤
│  Order │ Name     │ Tier   │ Study guide │ Published │ Act. │
│  1     │ UNSC     │ High   │ Uploaded    │ Yes       │ Edit │
│  2     │ UN Women │ Medium │ —           │ Yes       │ Edit │
│  3     │ SPECPOL  │ Low    │ Uploaded    │ Yes       │ Edit │
└─────────────────────────────────────────────────────────────┘
```

### UI — edit form

| Field | Type | Notes |
|---|---|---|
| `name` | Text | Display name |
| `slug` | Text | URL segment, auto from name |
| `short_description` | Textarea | Card blurb on committees page |
| `agenda` | Textarea | Full topic/agenda text — primary content field |
| `difficulty_tier` | Select | `low` / `medium` / `high` — for merit engine |
| `study_guide` | File upload | PDF only, max 10MB → Storage `study-guides/{committee_id}/` |
| `display_order` | Number | Sort on public page |
| `is_published` | Toggle | Draft = hidden from public + registration dropdown |

**Removed:** `chair_name` — not in scope.

### Study guide upload

- Button label: **Upload study guide**
- Accepts PDF only
- On upload: stores path in `committees.study_guide_path`, shows filename + **Replace** / **Remove**
- Remove clears path and deletes Storage object
- Public `/committees`: agenda text always shown; study guide renders as **Download study guide** link when `study_guide_path` is set

### Public sync

`/committees` queries `committees WHERE is_published = true ORDER BY display_order`. Registration portals use same query for committee preference dropdowns.

### Validation

- `slug` unique
- Cannot hard-delete committee referenced by registrations — use `is_published = false`

---

## Tab 3 — Registrations

### Purpose

Live operational table — replacement for Google Forms export. Payment confirmation + **automatic** Resend email on Confirm.

### UI — table

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Registrations                                                           │
│  Filter: [All types ▾] [All payments ▾]  Search: [ name or ID...     ] │
├──────────────────────────────────────────────────────────────────────────┤
│  ID        │ Name           │ Type   │ Committee pref │ Payment │ Date  │
│  MUN-A7F2  │ Ayesha Khan    │ Deleg. │ UN Women       │ ◐ Pend  │ Jul 4 │
│  MUN-B3C1  │ LGS Delegation │ Deleg. │ UNSC           │ ● Conf  │ Jul 3 │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

Type column values: `Delegate` (from `/register/delegate`) · `Delegation` (from `/register/delegation`).

### Payment status column

Seal system from `ui-context.md` §3:

| Status | Visual |
|---|---|
| `pending` | Gold seal ring, incomplete |
| `confirmed` | Full seal stamp |
| `rejected` | Muted brick, no seal |

### Row actions — View panel

- Full form data (school, MUN experience, preferences, delegation members)
- Payment screenshot → Supabase Storage signed URL
- Monospace registration ID at top
- **Confirm payment** (primary, if `pending`)
- **Reject** (secondary, optional reason — no email)

### Confirm payment flow

1. EB reviews screenshot
2. Clicks **Confirm payment**
3. Modal: *"Mark payment as confirmed for MUN-A7F2 (Ayesha Khan)? Fee: PKR 4,500."*
4. Server action: `payment_status = 'confirmed'`, timestamps, `confirmed_by`
5. **Resend email sent automatically** (Template 2, `04-email.md`)
6. Toast: "Payment confirmed. Confirmation email sent." (or error variant if Resend fails)

### Filters & search

- Type: All / Delegate / Delegation
- Payment: All / Pending / Confirmed / Rejected
- Search: `registration_id`, name, email

---

## Tab 4 — Sponsors

(Unchanged from prior spec — logo CMS for homepage.)

### Purpose

Manage sponsor/partner logos for public homepage sponsors strip.

### UI — list view

```
┌─────────────────────────────────────────────────────────────┐
│  Sponsors & Partners                     [ + Add sponsor ]  │
├─────────────────────────────────────────────────────────────┤
│  Order │ Logo preview │ Name           │ Tier   │ Actions  │
│  1     │ [img]        │ Acme Corp      │ Gold   │ Edit Del │
│  2     │ [img]        │ System Summit  │ Partner│ Edit Del │
└─────────────────────────────────────────────────────────────┘
```

### Edit form

| Field | Type | Notes |
|---|---|---|
| `name` | Text | |
| `tier` | Select | platinum / gold / silver / partner |
| `logo` | File upload | PNG/SVG/WebP, max 2MB |
| `website_url` | URL | Optional |
| `display_order` | Number | |
| `is_published` | Toggle | |
| `is_digital_partner` | Boolean | System Summit seal treatment |

---

## Cross-tab dependencies

```
Pricing ──────────► /register/delegate (delegate_fee)
                └──► /register/delegation (delegation_fee × count)
                └──► Total Amount card

Committees ───────► Registration portals (preference dropdown)
                └──► Public /committees (agenda + study guide)
                └──► Allotments (difficulty tier)

Registrations ────► Overview stats + graph
                └──► Resend (payment confirmed — automatic)
                └──► Allotments (confirmed payments eligible)

Sponsors ─────────► Homepage sponsors strip

site_settings ────► Status banner (Overview editor)
```
