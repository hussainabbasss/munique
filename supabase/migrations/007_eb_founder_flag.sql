-- Founder flag for EB featured card placement
ALTER TABLE eb_members
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false;
