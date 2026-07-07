-- Munique 2026 — EB Admin Panel schema (v1)
-- Run via Supabase CLI or SQL editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── admin_users ──
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('admin', 'reviewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── site_settings ──
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ── pricing_config ──
CREATE TABLE IF NOT EXISTS pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  delegate_fee integer NOT NULL DEFAULT 4500,
  delegation_fee integer NOT NULL DEFAULT 3800,
  early_bird_enabled boolean NOT NULL DEFAULT false,
  early_bird_deadline date,
  early_bird_delegate_fee integer,
  early_bird_delegation_fee integer,
  bank_account_title text NOT NULL DEFAULT 'Munique 2026 — EB Account',
  bank_details text NOT NULL DEFAULT '',
  payment_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── committees ──
CREATE TABLE IF NOT EXISTS committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text NOT NULL DEFAULT '',
  agenda text NOT NULL DEFAULT '',
  difficulty_tier text NOT NULL CHECK (difficulty_tier IN ('low', 'medium', 'high')),
  study_guide_path text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── sponsors ──
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('platinum', 'gold', 'silver', 'partner')),
  logo_path text,
  website_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  is_digital_partner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── registrations ──
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('delegate', 'delegation')),
  portal text NOT NULL CHECK (portal IN ('delegate', 'delegation')),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'confirmed', 'rejected')),
  fee_amount integer NOT NULL DEFAULT 0,
  school text NOT NULL DEFAULT '',
  head_email text NOT NULL,
  committee_pref_1 uuid REFERENCES committees(id) ON DELETE SET NULL,
  committee_pref_2 uuid REFERENCES committees(id) ON DELETE SET NULL,
  committee_pref_3 uuid REFERENCES committees(id) ON DELETE SET NULL,
  mun_experience text NOT NULL DEFAULT '',
  payment_proof_path text,
  registration_email_sent_at timestamptz,
  payment_email_sent_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── delegates ──
CREATE TABLE IF NOT EXISTS delegates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  is_head_delegate boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0
);

-- ── allotments ──
CREATE TABLE IF NOT EXISTS allotments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  merit_score integer,
  country text,
  committee_id uuid REFERENCES committees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued')),
  is_override boolean NOT NULL DEFAULT false,
  override_note text,
  issued_at timestamptz,
  issued_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  allotment_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── queries ──
CREATE SEQUENCE IF NOT EXISTS query_ticket_number_seq;

CREATE TABLE IF NOT EXISTS queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number integer NOT NULL DEFAULT nextval('query_ticket_number_seq') UNIQUE,
  registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  submitter_name text NOT NULL,
  submitter_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(type);
CREATE INDEX IF NOT EXISTS idx_delegates_registration_id ON delegates(registration_id);
CREATE INDEX IF NOT EXISTS idx_allotments_status ON allotments(status);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);

-- ── Seed data ──
INSERT INTO site_settings (key, value) VALUES (
  'status_banner',
  '{"message":"REGISTRATION IS LIVE · REGISTER NOW →","href":"/register","visible":true}'::jsonb
) ON CONFLICT (key) DO NOTHING;

INSERT INTO pricing_config (
  is_active, delegate_fee, delegation_fee,
  bank_account_title, bank_details, payment_instructions
) VALUES (
  true, 4500, 3800,
  'Munique 2026 — EB Account',
  'Bank details to be confirmed by EB.',
  'Transfer the registration fee and upload a screenshot of your payment confirmation.'
) ON CONFLICT DO NOTHING;

-- Ensure only one active pricing row (application-level; partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS pricing_config_one_active
  ON pricing_config (is_active) WHERE is_active = true;

-- ── RLS ──
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE allotments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Helper: is authenticated admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- admin_users policies
CREATE POLICY admin_users_select ON admin_users
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY admin_users_insert ON admin_users
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_role());

CREATE POLICY admin_users_update ON admin_users
  FOR UPDATE TO authenticated
  USING (is_admin_role());

CREATE POLICY admin_users_delete ON admin_users
  FOR DELETE TO authenticated
  USING (is_admin_role());

-- site_settings: public read for status_banner; admin write
CREATE POLICY site_settings_public_read ON site_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'status_banner');

CREATE POLICY site_settings_admin_write ON site_settings
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- pricing: public read active; admin write
CREATE POLICY pricing_public_read ON pricing_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY pricing_admin_all ON pricing_config
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_role());

-- committees: public read published; admin all
CREATE POLICY committees_public_read ON committees
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY committees_admin_all ON committees
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- sponsors: public read published; admin all
CREATE POLICY sponsors_public_read ON sponsors
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY sponsors_admin_all ON sponsors
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- registrations: admin only
CREATE POLICY registrations_admin ON registrations
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- delegates: admin only
CREATE POLICY delegates_admin ON delegates
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- allotments: admin only
CREATE POLICY allotments_admin ON allotments
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- queries: admin read/update; anon insert
CREATE POLICY queries_admin ON queries
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY queries_public_insert ON queries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Storage buckets (run in Supabase dashboard or via API)
-- payment-proofs, sponsor-logos, study-guides
