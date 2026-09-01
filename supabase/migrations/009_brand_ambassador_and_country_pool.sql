-- Brand Ambassador optional field on registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS brand_ambassador_name text;

-- Per-committee country pool for merit engine
ALTER TABLE committees
  ADD COLUMN IF NOT EXISTS country_pool text[] NOT NULL DEFAULT '{}';

-- AI reasoning persisted for EB review
ALTER TABLE allotments
  ADD COLUMN IF NOT EXISTS ai_reasoning text;
