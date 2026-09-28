-- 012 — Registrations imported from the Google Form CSV
--
-- Form registrants need no payment, so they are imported as confirmed and go
-- straight to the merit engine. `source` keeps them apart from portal
-- registrations so no registration / payment email is ever sent for them.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'portal'
    CHECK (source IN ('portal', 'form_import'));

COMMENT ON COLUMN registrations.source IS 'portal = registered on the site; form_import = imported from the Google Form CSV';

ALTER TABLE delegates
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN delegates.phone IS 'Phone number (Google Form imports)';

-- Import matches people by email on every upload
CREATE INDEX IF NOT EXISTS idx_delegates_email_lower
  ON delegates (lower(email));
