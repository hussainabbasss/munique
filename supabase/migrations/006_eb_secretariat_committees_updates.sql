-- Executive Board CMS + Secretariat committee assignment + committee logos/toggle

CREATE TABLE IF NOT EXISTS eb_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role_title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  portrait_path text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eb_members_display_order
  ON eb_members(display_order);

ALTER TABLE eb_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY eb_members_public_read ON eb_members
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY eb_members_admin_all ON eb_members
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

ALTER TABLE secretariat_members
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS committee_id uuid REFERENCES committees(id) ON DELETE SET NULL;

ALTER TABLE committees
  ADD COLUMN IF NOT EXISTS logo_path text,
  ADD COLUMN IF NOT EXISTS study_guide_enabled boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'eb-portraits',
    'eb-portraits',
    true,
    3145728,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'committee-logos',
    'committee-logos',
    true,
    3145728,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO NOTHING;
