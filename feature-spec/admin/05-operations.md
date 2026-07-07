# 05 — Operations (Allotments · Team · Queries)

**Parent:** `00-blueprint.md`  
**Status:** Confirmed in v1 (not deferred)

---

## Navigation

Seven tabs total + Overview landing. Horizontal scroll on mobile.

| Route | Label |
|---|---|
| `/admin` | Overview |
| `/admin/pricing` | Pricing |
| `/admin/committees` | Committees |
| `/admin/registrations` | Registrations |
| `/admin/sponsors` | Sponsors |
| `/admin/allotments` | Allotments |
| `/admin/team` | Team |
| `/admin/queries` | Queries |

---

## Allotments tab

### Purpose

Review Merit-Logic Engine suggestions, override country/committee assignments, and manually issue allotments to delegates. Allotments are **never auto-released** — EB must click **Issue Allotments** (`project-overview.md` §5.4).

### UI — review table

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Allotments                                    [ Run merit engine ]       │
│                                              [ Issue allotments ] ← gated │
├──────────────────────────────────────────────────────────────────────────┤
│  ID       │ Name         │ Merit │ Suggested      │ Status   │ Actions │
│  MUN-A7F2 │ Ayesha Khan  │  78   │ France · UNW   │ Pending  │ Edit    │
│  MUN-B3C1 │ LGS Deleg.   │  65   │ USA · SPECPOL  │ Issued   │ —       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Columns

| Column | Source |
|---|---|
| Registration ID | `registrations.registration_id` |
| Name | Head delegate |
| Merit Score | `allotments.merit_score` (monospace) |
| Suggested | `country` · `committee` from engine or manual override |
| Status | `pending` \| `issued` |
| Actions | Edit override (if pending) |

### Run merit engine

- Button triggers Gemini-powered scoring job (Beta)
- Only available for registrations with `payment_status = confirmed`
- Writes/updates `allotments` rows with suggested country + committee + merit score
- Progress indicator — async job for 250–300 rows
- Does **not** email delegates or change public status

### Edit override

Slide-over form:

- Country (text or select from predefined list — TBD in registration spec)
- Committee (dropdown from published `committees`)
- Override reason (optional text, admin-only note)

### Issue allotments gate

Weighty primary button per `ui-context.md` §4.3:

1. EB clicks **Issue allotments**
2. Confirmation modal: *"This will issue allotments to 214 delegates and send each an email immediately. This cannot be undone."*
3. Shows count of `pending` allotments with payment confirmed
4. On confirm:
   - Set `allotment_status = issued`, `issued_at = now()`
   - Resend batch: Template 3 from `04-email.md` to each delegate email
   - Seal stamp state on registration row

### Filters

- Status: Pending / Issued
- Payment must be confirmed before appearing in issue batch

---

## Team tab

### Purpose

EB adds staff to the admin panel — invite by email, assign role. Replaces ad hoc shared-password access.

### UI

```
┌─────────────────────────────────────────────────────────────┐
│  Team                                      [ Invite member ] │
├─────────────────────────────────────────────────────────────┤
│  Name           │ Email              │ Role     │ Actions  │
│  Fatima Ali     │ fatima@munique...  │ Admin    │ Remove   │
│  Omar Hassan    │ omar@munique...    │ Reviewer │ Remove   │
└─────────────────────────────────────────────────────────────┘
```

### Invite flow

1. EB enters email + full name + role
2. Server inserts `admin_users` row, sends Supabase Auth invite email
3. Invitee sets password on first login

### Roles (v1)

| Role | Permissions |
|---|---|
| **Admin** | Full access — all tabs, confirm payments, issue allotments, invite team |
| **Reviewer** | Read all tabs; confirm payments; resolve queries; **cannot** issue allotments, edit pricing, or manage team |

Exact permission matrix can tighten during build — Reviewer is the safe default for non-EB staff.

### Rules

- Cannot remove last Admin
- Cannot demote self
- Service role seeds initial EB lead as Admin on first deploy

---

## Queries tab

### Purpose

Structured delegate question intake — replaces WhatsApp threads (`project-overview.md` §5.4, `ui-context.md` §4.4).

### UI — ticket list

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Queries                              Filter: [ Open ▾ ] [ All ▾ ]      │
├──────────────────────────────────────────────────────────────────────────┤
│  #1042 │ Jul 4 │ Payment not showing   │ Ayesha Khan │ Open     │ View  │
│  #1041 │ Jul 3 │ Committee change req  │ LGS Deleg.  │ Resolved │ View  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Ticket fields

| Field | Type | Notes |
|---|---|---|
| `ticket_number` | serial | Display as `#1042` |
| `registration_id` | FK nullable | Linked if delegate provides ID |
| `submitter_name` | text | |
| `submitter_email` | text | |
| `subject` | text | Short summary |
| `body` | text | Full message |
| `status` | enum | `open` \| `resolved` |
| `admin_notes` | text | Internal only |
| `resolved_at` | timestamptz | |
| `resolved_by` | FK → admin_users | |
| `created_at` | timestamptz | |

### Public intake

Delegates submit queries via `/contact` form (or dedicated `/queries/new`) — creates `open` ticket. Optional: link registration ID field.

**No chat thread UI** — ticket-style, discrete items per `ui-context.md` §4.4.

### Resolve flow

1. EB opens ticket, reads body
2. Adds optional admin notes
3. Clicks **Mark resolved**
4. Optional Resend reply email to submitter (v1.1 — not blocking; EB can reply manually for now)

### Overview quick action

Add link on Overview: `→ Open queries (12)` → `/admin/queries?status=open`
