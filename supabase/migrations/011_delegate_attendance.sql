-- 011 — Gate attendance for the two conference days
--
-- One row per (delegate, day) means the delegate was marked present at the gate
-- that day. Absent = no row. Gate staff toggle rows on and off from
-- /admin/attendance.

CREATE TABLE IF NOT EXISTS delegate_attendance (
  delegate_id uuid NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  day smallint NOT NULL CHECK (day IN (1, 2)),
  marked_at timestamptz NOT NULL DEFAULT now(),
  marked_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  PRIMARY KEY (delegate_id, day)
);

COMMENT ON TABLE delegate_attendance IS 'Delegate marked present at the gate on conference day 1 or 2';

CREATE INDEX IF NOT EXISTS idx_delegate_attendance_day
  ON delegate_attendance (day);

ALTER TABLE delegate_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delegate_attendance_admin ON delegate_attendance;
CREATE POLICY delegate_attendance_admin ON delegate_attendance
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());
