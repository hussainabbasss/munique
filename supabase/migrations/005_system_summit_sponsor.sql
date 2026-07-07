-- Permanent System Summit gold sponsor

ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS is_permanent boolean NOT NULL DEFAULT false;

INSERT INTO sponsors (
  name,
  tier,
  display_order,
  is_published,
  is_digital_partner,
  is_permanent
)
SELECT
  'System Summit',
  'gold',
  0,
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM sponsors WHERE name = 'System Summit'
);

UPDATE sponsors
SET
  tier = 'gold',
  is_published = true,
  is_digital_partner = true,
  is_permanent = true,
  display_order = LEAST(display_order, 0)
WHERE name = 'System Summit';
