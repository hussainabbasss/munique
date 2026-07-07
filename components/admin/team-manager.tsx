"use client";

import { useActionState } from "react";
import {
  createTeamMemberAction,
  removeTeamMemberAction,
} from "@/lib/admin/actions/team-queries";
import type { AdminUser } from "@/lib/types/admin";

type Props = {
  members: AdminUser[];
  canManage: boolean;
  currentUserId: string;
};

export function TeamManager({ members, canManage, currentUserId }: Props) {
  const [state, action, pending] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      if (!canManage) return { error: "Only admins can add team members." };
      return createTeamMemberAction(formData);
    },
    null,
  );

  return (
    <>
      {canManage && (
        <section className="admin-panel" style={{ marginBottom: "1.25rem" }}>
          <h2 className="admin-panel-title">Add team member</h2>
          <p className="admin-panel-lead">
            Set a password here and share login details manually. No invitation
            email is sent.
          </p>
          {state?.success && (
            <p className="admin-toast admin-toast-success">{state.success}</p>
          )}
          {state?.error && (
            <p className="admin-toast admin-toast-error">{state.error}</p>
          )}
          <form action={action} className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" required />
            </div>
            <div className="admin-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="admin-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
              <p className="admin-field-hint">At least 8 characters</p>
            </div>
            <div className="admin-field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="reviewer">
                <option value="admin">Admin</option>
                <option value="reviewer">Reviewer</option>
                <option value="registration_staff">Registration staff</option>
              </select>
              <p className="admin-field-hint">
                Registration staff only see registrations and can confirm payments.
              </p>
            </div>
            <button type="submit" className="btn-admin-primary" disabled={pending}>
              Add member
            </button>
          </form>
        </section>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.full_name}</td>
                <td>{m.email}</td>
                <td style={{ textTransform: "capitalize" }}>
                  {m.role === "registration_staff" ? "Registration staff" : m.role}
                </td>
                {canManage && (
                  <td>
                    {m.id !== currentUserId && (
                      <button
                        type="button"
                        className="btn-admin-secondary btn-admin-danger"
                        onClick={() => removeTeamMemberAction(m.id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
