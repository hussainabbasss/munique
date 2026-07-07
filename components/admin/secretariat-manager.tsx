"use client";

import { useActionState, useState } from "react";
import {
  deleteSecretariatMemberAction,
  saveSecretariatMemberAction,
  uploadSecretariatPortraitAction,
} from "@/lib/admin/actions/secretariat";
import type { SecretariatMember } from "@/lib/types/admin";

type Props = {
  members: SecretariatMember[];
  portraitUrls: Record<string, string | null>;
};

export function SecretariatManager({ members, portraitUrls }: Props) {
  const [editing, setEditing] = useState<SecretariatMember | null>(null);
  const [creating, setCreating] = useState(false);

  const [state, saveAction, saving] = useActionState(
    async (
      _prev: { success?: string; error?: string } | null,
      formData: FormData,
    ) => {
      const result = await saveSecretariatMemberAction(formData);
      if (result.success) {
        setEditing(null);
        setCreating(false);
      }
      return result;
    },
    null,
  );

  const [uploadState, uploadAction, uploading] = useActionState(
    async (
      _prev: { success?: string; error?: string } | null,
      formData: FormData,
    ) => uploadSecretariatPortraitAction(formData),
    null,
  );

  return (
    <>
      <div className="admin-actions" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="btn-admin-primary"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          + Add member
        </button>
      </div>

      {(creating || editing) && (
        <section className="admin-panel" style={{ marginBottom: "1.25rem" }}>
          <h2 className="admin-panel-title">
            {editing ? `Edit ${editing.full_name}` : "New secretariat member"}
          </h2>
          {state?.success && (
            <p className="admin-toast admin-toast-success">{state.success}</p>
          )}
          {state?.error && (
            <p className="admin-toast admin-toast-error">{state.error}</p>
          )}
          <form action={saveAction} className="admin-form-grid">
            {editing?.id && (
              <input type="hidden" name="id" value={editing.id} />
            )}
            <div className="admin-field">
              <label htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                name="full_name"
                defaultValue={editing?.full_name ?? ""}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="role_title">Role / title</label>
              <input
                id="role_title"
                name="role_title"
                defaultValue={editing?.role_title ?? ""}
                placeholder="e.g. Secretary-General"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="display_order">Display order</label>
              <input
                id="display_order"
                name="display_order"
                type="number"
                defaultValue={editing?.display_order ?? 0}
              />
            </div>
            <div className="admin-checkbox-row">
              <input
                id="is_published"
                name="is_published"
                type="checkbox"
                defaultChecked={editing?.is_published ?? false}
              />
              <label htmlFor="is_published">Published on website</label>
            </div>
            <button type="submit" className="btn-admin-primary" disabled={saving}>
              Save member
            </button>
          </form>

          {editing?.id && (
            <form
              action={uploadAction}
              className="admin-actions"
              style={{ marginTop: "1rem" }}
              encType="multipart/form-data"
            >
              <input type="hidden" name="member_id" value={editing.id} />
              {portraitUrls[editing.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portraitUrls[editing.id]!}
                  alt=""
                  width={80}
                  height={80}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <input
                name="portrait"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
              <button
                type="submit"
                className="btn-admin-secondary"
                disabled={uploading}
              >
                Upload portrait
              </button>
              {uploadState?.success && (
                <span className="admin-field-hint">{uploadState.success}</span>
              )}
              {uploadState?.error && (
                <span className="admin-toast admin-toast-error">
                  {uploadState.error}
                </span>
              )}
            </form>
          )}
        </section>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Portrait</th>
              <th>Name</th>
              <th>Role</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No secretariat members yet
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id}>
                  <td>{member.display_order}</td>
                  <td>
                    {portraitUrls[member.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={portraitUrls[member.id]!}
                        alt=""
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{member.full_name}</td>
                  <td>{member.role_title || "—"}</td>
                  <td>{member.is_published ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      onClick={() => {
                        setEditing(member);
                        setCreating(false);
                      }}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type="button"
                      className="btn-admin-secondary btn-admin-danger"
                      onClick={() => deleteSecretariatMemberAction(member.id)}
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
