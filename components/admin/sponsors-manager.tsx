"use client";

import { useActionState, useState } from "react";
import {
  deleteSponsorAction,
  saveSponsorAction,
  uploadSponsorLogoAction,
} from "@/lib/admin/actions/sponsors";
import type { Sponsor } from "@/lib/types/admin";

type Props = {
  sponsors: Sponsor[];
  logoUrls: Record<string, string | null>;
};

export function SponsorsManager({ sponsors, logoUrls }: Props) {
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [creating, setCreating] = useState(false);

  const [state, saveAction, saving] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const result = await saveSponsorAction(formData);
      if (result.success) {
        setEditing(null);
        setCreating(false);
      }
      return result;
    },
    null,
  );

  const [uploadState, uploadAction, uploading] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) =>
      uploadSponsorLogoAction(formData),
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
          + Add sponsor
        </button>
      </div>

      {(creating || editing) && (
        <section className="admin-panel" style={{ marginBottom: "1.25rem" }}>
          <h2 className="admin-panel-title">
            {editing ? `Edit ${editing.name}` : "New sponsor"}
          </h2>
          {state?.success && (
            <p className="admin-toast admin-toast-success">{state.success}</p>
          )}
          {state?.error && (
            <p className="admin-toast admin-toast-error">{state.error}</p>
          )}
          <form action={saveAction} className="admin-form-grid" encType="multipart/form-data">
            {editing?.id && <input type="hidden" name="id" value={editing.id} />}
            <div className="admin-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" defaultValue={editing?.name ?? ""} required />
            </div>
            <div className="admin-field">
              <label htmlFor="tier">Tier</label>
              <select id="tier" name="tier" defaultValue={editing?.tier ?? "partner"}>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="website_url">Website URL</label>
              <input
                id="website_url"
                name="website_url"
                type="url"
                defaultValue={editing?.website_url ?? ""}
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
              <label htmlFor="is_published">Published</label>
            </div>
            <div className="admin-checkbox-row">
              <input
                id="is_digital_partner"
                name="is_digital_partner"
                type="checkbox"
                defaultChecked={editing?.is_digital_partner ?? false}
              />
              <label htmlFor="is_digital_partner">Digital partner (System Summit)</label>
            </div>
            <div className="admin-field">
              <label htmlFor="logo">Logo</label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/svg+xml,image/webp"
              />
              <p className="admin-field-hint">PNG, SVG, or WebP · max 2 MB</p>
            </div>
            <button type="submit" className="btn-admin-primary" disabled={saving}>
              Save sponsor
            </button>
          </form>

          {editing?.id && (
            <form action={uploadAction} className="admin-actions" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="sponsor_id" value={editing.id} />
              <input name="file" type="file" accept="image/png,image/svg+xml,image/webp" />
              <button type="submit" className="btn-admin-secondary" disabled={uploading}>
                Upload logo
              </button>
              {uploadState?.success && (
                <span className="admin-field-hint">{uploadState.success}</span>
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
              <th>Logo</th>
              <th>Name</th>
              <th>Tier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty">
                  No sponsors yet
                </td>
              </tr>
            ) : (
              sponsors.map((s) => (
                <tr key={s.id}>
                  <td>{s.display_order}</td>
                  <td>
                    {logoUrls[s.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrls[s.id]!} alt="" width={48} height={32} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {s.name}
                    {s.is_permanent && (
                      <span className="admin-badge admin-badge-permanent">
                        Permanent
                      </span>
                    )}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{s.tier}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      onClick={() => {
                        setEditing(s);
                        setCreating(false);
                      }}
                    >
                      Edit
                    </button>{" "}
                    {!s.is_permanent && (
                      <button
                        type="button"
                        className="btn-admin-secondary btn-admin-danger"
                        onClick={() => deleteSponsorAction(s.id)}
                      >
                        Del
                      </button>
                    )}
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
