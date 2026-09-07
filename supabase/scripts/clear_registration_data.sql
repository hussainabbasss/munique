-- Clear test registration data before opening registrations.
-- KEEPS: committees, pricing, sponsors, EB, secretariat, site settings, admin users, queries.
-- REMOVES: registrations, delegates, allotments (delegates + allotments cascade).
--
-- Run in Supabase Dashboard → SQL Editor.
-- Storage note: payment-proof files in the `payment-proofs` bucket are NOT
-- deleted by this script — empty that bucket in Storage if you want those gone too.

BEGIN;

-- Preview counts (optional — comment out if you prefer)
-- SELECT
--   (SELECT count(*) FROM registrations) AS registrations,
--   (SELECT count(*) FROM delegates) AS delegates,
--   (SELECT count(*) FROM allotments) AS allotments;

-- Unlink contact queries from registrations (queries themselves stay)
UPDATE queries
SET registration_id = NULL
WHERE registration_id IS NOT NULL;

-- Cascades to: delegates, allotments
DELETE FROM registrations;

-- Confirm empty
-- SELECT
--   (SELECT count(*) FROM registrations) AS registrations,
--   (SELECT count(*) FROM delegates) AS delegates,
--   (SELECT count(*) FROM allotments) AS allotments;

COMMIT;
