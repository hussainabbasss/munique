ALTER TABLE delegates
  ADD COLUMN IF NOT EXISTS allotment_email_sent_at timestamptz;

-- Backfill delegates who already received allotment emails via the registration batch.
UPDATE delegates d
SET allotment_email_sent_at = a.allotment_email_sent_at
FROM allotments a
WHERE d.registration_id = a.registration_id
  AND a.status = 'issued'
  AND a.allotment_email_sent_at IS NOT NULL
  AND d.allotment_email_sent_at IS NULL;
