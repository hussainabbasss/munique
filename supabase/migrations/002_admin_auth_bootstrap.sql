-- Fix admin bootstrap: allow reading/linking own row before auth_user_id is set

DROP POLICY IF EXISTS admin_users_select ON admin_users;
DROP POLICY IF EXISTS admin_users_update ON admin_users;

CREATE POLICY admin_users_select ON admin_users
  FOR SELECT TO authenticated
  USING (
    is_admin_user()
    OR email = (SELECT auth.jwt() ->> 'email')
  );

-- Admins manage team; users can link their own row on first login
CREATE POLICY admin_users_update ON admin_users
  FOR UPDATE TO authenticated
  USING (
    is_admin_role()
    OR (
      auth_user_id IS NULL
      AND email = (SELECT auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    is_admin_role()
    OR auth_user_id = auth.uid()
  );
