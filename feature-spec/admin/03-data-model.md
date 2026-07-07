# 03 — Supabase Data Model

**Parent:** `00-blueprint.md`  
**Stack:** Supabase Postgres + Storage + Auth + RLS

---

## Entity relationship (overview)

```
admin_users ──► auth.users (role: admin | reviewer)

site_settings (key/value JSON)

pricing_config (singleton — delegate_fee + delegation_fee)

committees ◄── registration committee prefs
    │              study_guide_path
sponsors

registrations ──┬── delegates (1:N for delegations)
                ├── payment_proofs (Storage)
                └── fee_amount (snapshotted)

allotments ──────► registrations (merit score, country, committee, status)

queries (delegate tickets, standalone)
```

---

## Tables

### `admin_users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `auth_user_id` | uuid FK → `auth.users` | Nullable until invite accepted |
| `email` | text UNIQUE | |
| `full_name` | text | |
| `role` | text | `admin` \| `reviewer` |
| `created_at` | timestamptz | |

RLS: Authenticated admin_users read own row; Admin manages all.

---

### `site_settings`

| Column | Type | Notes |
|---|---|---|
| `key` | text PK | e.g. `status_banner` |
| `value` | jsonb | |
| `updated_at` | timestamptz | |
| `updated_by` | uuid FK → `admin_users` | |

**`status_banner` value:**

```json
{
  "message": "REGISTRATION IS LIVE · REGISTER NOW →",
  "href": "/register/delegate",
  "visible": true
}
```

---

### `pricing_config`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `is_active` | boolean | One active row |
| `delegate_fee` | integer | PKR — `/register/delegate` |
| `delegation_fee` | integer | PKR per delegate — `/register/delegation` |
| `early_bird_enabled` | boolean | |
| `early_bird_deadline` | date | |
| `early_bird_delegate_fee` | integer | |
| `early_bird_delegation_fee` | integer | Per delegate |
| `bank_account_title` | text | |
| `bank_details` | text | |
| `payment_instructions` | text | |
| `updated_at` | timestamptz | |

**Fee snapshot on submit:**

- Delegate portal: `fee_amount = delegate_fee` (or early bird equivalent)
- Delegation portal: `fee_amount = delegation_fee × COUNT(delegates)`

---

### `committees`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `slug` | text UNIQUE | |
| `short_description` | text | |
| `agenda` | text | Primary content — no chairs |
| `difficulty_tier` | text | `low` \| `medium` \| `high` |
| `study_guide_path` | text nullable | Storage path to PDF |
| `display_order` | integer | |
| `is_published` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Removed:** `chair_name`

---

### `sponsors`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `tier` | text | |
| `logo_path` | text | Storage path |
| `website_url` | text nullable | |
| `display_order` | integer | |
| `is_published` | boolean | |
| `is_digital_partner` | boolean | |
| `created_at` | timestamptz | |

---

### `registrations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `registration_id` | text UNIQUE | e.g. `MUN-A7F2` |
| `type` | text | `delegate` \| `delegation` |
| `portal` | text | `delegate` \| `delegation` — mirrors type, explicit for queries |
| `payment_status` | text | `pending` \| `confirmed` \| `rejected` |
| `fee_amount` | integer | Snapshotted at submit |
| `school` | text | |
| `head_email` | text | |
| `committee_pref_1` | uuid FK → committees | |
| `committee_pref_2` | uuid FK nullable | |
| `committee_pref_3` | uuid FK nullable | |
| `mun_experience` | text | |
| `payment_proof_path` | text nullable | |
| `registration_email_sent_at` | timestamptz nullable | |
| `payment_email_sent_at` | timestamptz nullable | |
| `confirmed_at` | timestamptz nullable | |
| `confirmed_by` | uuid FK nullable → admin_users | |
| `created_at` | timestamptz | |

---

### `delegates`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `registration_id` | uuid FK → registrations | |
| `full_name` | text | |
| `email` | text nullable | |
| `is_head_delegate` | boolean | |
| `display_order` | integer | |

Delegate portal: exactly 1 row. Delegation portal: 1 head + N members.

---

### `allotments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `registration_id` | uuid FK UNIQUE → registrations | One per registration |
| `merit_score` | integer nullable | From Gemini engine |
| `country` | text nullable | |
| `committee_id` | uuid FK nullable → committees | |
| `status` | text | `pending` \| `issued` |
| `is_override` | boolean | EB manually changed suggestion |
| `override_note` | text nullable | |
| `issued_at` | timestamptz nullable | |
| `issued_by` | uuid FK nullable → admin_users | |
| `allotment_email_sent_at` | timestamptz nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Only registrations with `payment_status = confirmed` appear in merit engine run and issue batch.

---

### `queries`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `ticket_number` | serial | Display `#1042` |
| `registration_id` | uuid FK nullable → registrations | |
| `submitter_name` | text | |
| `submitter_email` | text | |
| `subject` | text | |
| `body` | text | |
| `status` | text | `open` \| `resolved` |
| `admin_notes` | text nullable | Internal |
| `resolved_at` | timestamptz nullable | |
| `resolved_by` | uuid FK nullable → admin_users | |
| `created_at` | timestamptz | |

---

## Storage buckets

| Bucket | Path pattern | Access |
|---|---|---|
| `payment-proofs` | `{registration_id}/{filename}` | Admin signed URL; upload on portal submit |
| `sponsor-logos` | `{sponsor_id}/{filename}` | Public read if published; admin write |
| `study-guides` | `{committee_id}/{filename}` | Public read if committee published; admin write |

Max sizes: 5MB payment screenshots, 2MB logos, 10MB study guide PDFs.

---

## Aggregates for Overview

Unchanged SQL patterns — `type` values now `delegate` / `delegation`:

```sql
SELECT type, COUNT(*) FROM registrations GROUP BY type;
```

---

## Auth & middleware

1. Supabase Auth session in Next.js middleware
2. `/admin/*` requires session + `admin_users` row
3. **Admin-only actions:** edit pricing, issue allotments, invite/remove team, upload study guides (optional: allow Reviewer upload — default Admin only)
4. **Reviewer-allowed:** view all, confirm payments, resolve queries

---

## Migration order

1. `admin_users`, `site_settings`
2. `pricing_config` (seed delegate + delegation fees)
3. `committees`, `sponsors`
4. `registrations`, `delegates`
5. `allotments`, `queries`
6. Storage buckets: `payment-proofs`, `sponsor-logos`, `study-guides`
7. RLS policies
8. Seed `site_settings.status_banner`
