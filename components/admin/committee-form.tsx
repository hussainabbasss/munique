"use client";

import { useActionState } from "react";
import {
  removeStudyGuideAction,
  saveCommitteeAction,
  uploadStudyGuideAction,
} from "@/lib/admin/actions/committees";
import type { Committee } from "@/lib/types/admin";

type Props = {
  committee?: Committee | null;
  onDone?: () => void;
};

export function CommitteeForm({ committee, onDone }: Props) {
  const [state, saveAction, saving] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const result = await saveCommitteeAction(formData);
      if (result.success) onDone?.();
      return result;
    },
    null,
  );

  const [uploadState, uploadAction, uploading] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) =>
      uploadStudyGuideAction(formData),
    null,
  );

  return (
    <div>
      {state?.success && (
        <p className="admin-toast admin-toast-success">{state.success}</p>
      )}
      {state?.error && (
        <p className="admin-toast admin-toast-error">{state.error}</p>
      )}

      <form action={saveAction} className="admin-form-grid">
        {committee?.id && <input type="hidden" name="id" value={committee.id} />}
        <div className="admin-field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={committee?.name ?? ""} required />
        </div>
        <div className="admin-field">
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={committee?.slug ?? ""} />
        </div>
        <div className="admin-field">
          <label htmlFor="short_description">Short description</label>
          <textarea
            id="short_description"
            name="short_description"
            defaultValue={committee?.short_description ?? ""}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="agenda">Agenda</label>
          <textarea id="agenda" name="agenda" defaultValue={committee?.agenda ?? ""} />
        </div>
        <div className="admin-field">
          <label htmlFor="difficulty_tier">Difficulty tier</label>
          <select
            id="difficulty_tier"
            name="difficulty_tier"
            defaultValue={committee?.difficulty_tier ?? "medium"}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="display_order">Display order</label>
          <input
            id="display_order"
            name="display_order"
            type="number"
            defaultValue={committee?.display_order ?? 0}
          />
        </div>
        <div className="admin-checkbox-row">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            defaultChecked={committee?.is_published ?? false}
          />
          <label htmlFor="is_published">Published</label>
        </div>
        <div className="admin-actions">
          <button type="submit" className="btn-admin-primary" disabled={saving}>
            {saving ? "Saving…" : "Save committee"}
          </button>
        </div>
      </form>

      {committee?.id && (
        <>
          <hr className="admin-section-divider" />
          <h3 className="admin-panel-title">Study guide</h3>
          {committee.study_guide_path ? (
            <p className="admin-field-hint">
              Uploaded: {committee.study_guide_path.split("/").pop()}
            </p>
          ) : (
            <p className="admin-field-hint">No study guide uploaded</p>
          )}
          {uploadState?.error && (
            <p className="admin-toast admin-toast-error">{uploadState.error}</p>
          )}
          {uploadState?.success && (
            <p className="admin-toast admin-toast-success">{uploadState.success}</p>
          )}
          <form action={uploadAction} className="admin-actions">
            <input type="hidden" name="committee_id" value={committee.id} />
            <input name="file" type="file" accept="application/pdf" required />
            <button type="submit" className="btn-admin-secondary" disabled={uploading}>
              Upload study guide
            </button>
            {committee.study_guide_path && (
              <button
                type="button"
                className="btn-admin-secondary btn-admin-danger"
                onClick={() => removeStudyGuideAction(committee.id)}
              >
                Remove
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
