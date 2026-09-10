-- 010 — Per-delegate committee preferences, experience, and allotments
--
-- Each person in a delegation stores their own committee prefs + MUN experience
-- on `delegates`. Merit allotments are keyed by `delegate_id` (one seat per person).
-- Registration-level prefs / mun_experience remain as a head-delegate snapshot for
-- legacy admin views.

-- ── delegates: per-person prefs + experience ────────────────────────────────

ALTER TABLE delegates
  ADD COLUMN IF NOT EXISTS committee_pref_1 uuid REFERENCES committees(id) ON DELETE SET NULL;

ALTER TABLE delegates
  ADD COLUMN IF NOT EXISTS committee_pref_2 uuid REFERENCES committees(id) ON DELETE SET NULL;

ALTER TABLE delegates
  ADD COLUMN IF NOT EXISTS committee_pref_3 uuid REFERENCES committees(id) ON DELETE SET NULL;

ALTER TABLE delegates
  ADD COLUMN IF NOT EXISTS mun_experience text NOT NULL DEFAULT '';

COMMENT ON COLUMN delegates.committee_pref_1 IS '1st committee choice for this person';
COMMENT ON COLUMN delegates.committee_pref_2 IS '2nd committee choice for this person';
COMMENT ON COLUMN delegates.committee_pref_3 IS '3rd committee choice for this person';
COMMENT ON COLUMN delegates.mun_experience IS 'Individual MUN experience for this person';

-- ── allotments: one row per delegate ───────────────────────────────────────

ALTER TABLE allotments
  ADD COLUMN IF NOT EXISTS delegate_id uuid REFERENCES delegates(id) ON DELETE CASCADE;

COMMENT ON COLUMN allotments.delegate_id IS 'Delegate this allotment belongs to (unique)';

-- Attach existing registration-level allotments to the head / sole delegate
UPDATE allotments a
SET delegate_id = d.id
FROM delegates d
WHERE a.delegate_id IS NULL
  AND d.registration_id = a.registration_id
  AND d.is_head_delegate = true;

-- Any remaining (no head flag) → first delegate by display_order
UPDATE allotments a
SET delegate_id = d.id
FROM (
  SELECT DISTINCT ON (registration_id) id, registration_id
  FROM delegates
  ORDER BY registration_id, display_order ASC
) d
WHERE a.delegate_id IS NULL
  AND d.registration_id = a.registration_id;

-- Copy registration prefs / experience onto delegates that still lack them
UPDATE delegates d
SET
  committee_pref_1 = COALESCE(d.committee_pref_1, r.committee_pref_1),
  committee_pref_2 = COALESCE(d.committee_pref_2, r.committee_pref_2),
  committee_pref_3 = COALESCE(d.committee_pref_3, r.committee_pref_3),
  mun_experience = CASE
    WHEN trim(COALESCE(d.mun_experience, '')) = '' THEN COALESCE(r.mun_experience, '')
    ELSE d.mun_experience
  END
FROM registrations r
WHERE d.registration_id = r.id
  AND (
    (d.committee_pref_1 IS NULL AND r.committee_pref_1 IS NOT NULL)
    OR trim(COALESCE(d.mun_experience, '')) = ''
  );

-- Orphans that could not be linked cannot satisfy NOT NULL
DELETE FROM allotments WHERE delegate_id IS NULL;

ALTER TABLE allotments
  ALTER COLUMN delegate_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS allotments_delegate_id_unique
  ON allotments (delegate_id);

-- One registration may now have many allotments (one per delegate)
ALTER TABLE allotments
  DROP CONSTRAINT IF EXISTS allotments_registration_id_key;

CREATE INDEX IF NOT EXISTS idx_allotments_registration_id
  ON allotments (registration_id);

CREATE INDEX IF NOT EXISTS idx_delegates_committee_pref_1
  ON delegates (committee_pref_1);
