-- Registration staff role, secretariat CMS, portrait storage

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('admin', 'reviewer', 'registration_staff'));

CREATE TABLE IF NOT EXISTS secretariat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role_title text NOT NULL DEFAULT '',
  portrait_path text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_secretariat_members_display_order
  ON secretariat_members(display_order);

ALTER TABLE secretariat_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY secretariat_public_read ON secretariat_members
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY secretariat_admin_all ON secretariat_members
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'secretariat-portraits',
  'secretariat-portraits',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Seed placeholder secretariat rows (unpublished until EB fills in)
INSERT INTO secretariat_members (full_name, role_title, display_order, is_published)
SELECT * FROM (VALUES
  ('Secretary-General', 'Conference Lead', 0, false),
  ('Deputy Secretary-General', 'Operations', 1, false),
  ('Director of Academics', 'Committees', 2, false),
  ('Director of Delegate Affairs', 'Registration', 3, false)
) AS seed(full_name, role_title, display_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM secretariat_members LIMIT 1);
