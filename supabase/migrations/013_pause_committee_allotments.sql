-- Pause auto-allotment for a committee without closing it for manual moves.
-- The merit engine skips paused committees; Change / Set allotment still works.

ALTER TABLE committees
  ADD COLUMN IF NOT EXISTS allotments_paused boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN committees.allotments_paused IS
  'When true, the merit engine will not assign remaining seats. Manual allotment still allowed.';
