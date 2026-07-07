"use client";

import { useActionState, useState } from "react";
import {
  issueAllotmentsAction,
  runMeritEngineAction,
  saveAllotmentOverrideAction,
} from "@/lib/admin/actions/allotments";

type AllotmentRow = {
  id: string;
  registration_id: string;
  merit_score: number | null;
  country: string | null;
  committee_id: string | null;
  status: string;
  registrations: {
    registration_id: string;
    payment_status: string;
    delegates: { full_name: string; is_head_delegate: boolean }[];
  } | null;
  committees: { name: string } | null;
};

type Committee = { id: string; name: string };

type Props = {
  allotments: AllotmentRow[];
  committees: Committee[];
  pendingCount: number;
  canIssue: boolean;
};

export function AllotmentsManager({
  allotments,
  committees,
  pendingCount,
  canIssue,
}: Props) {
  const [editing, setEditing] = useState<AllotmentRow | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [engineState, engineAction, running] = useActionState(
    async () => runMeritEngineAction(),
    null,
  );
  const [issueState, issueAction, issuing] = useActionState(
    async () => {
      const result = await issueAllotmentsAction();
      if (result.success) setShowIssueModal(false);
      return result;
    },
    null,
  );
  const [overrideState, overrideAction, saving] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const result = await saveAllotmentOverrideAction(formData);
      if (result.success) setEditing(null);
      return result;
    },
    null,
  );

  const headName = (row: AllotmentRow) => {
    const delegates = row.registrations?.delegates ?? [];
    return (
      delegates.find((d) => d.is_head_delegate)?.full_name ??
      delegates[0]?.full_name ??
      "—"
    );
  };

  return (
    <>
      <div className="admin-actions" style={{ marginBottom: "1rem" }}>
        <form action={engineAction}>
          <button type="submit" className="btn-admin-secondary" disabled={running}>
            {running ? "Running…" : "Run merit engine"}
          </button>
        </form>
        {canIssue && (
          <button
            type="button"
            className="btn-admin-primary btn-admin-weighty"
            onClick={() => setShowIssueModal(true)}
          >
            Issue allotments
          </button>
        )}
      </div>

      {engineState?.success && (
        <p className="admin-toast admin-toast-success">{engineState.success}</p>
      )}
      {engineState?.error && (
        <p className="admin-toast admin-toast-error">{engineState.error}</p>
      )}
      {issueState?.success && (
        <p className="admin-toast admin-toast-success">{issueState.success}</p>
      )}
      {issueState?.error && (
        <p className="admin-toast admin-toast-error">{issueState.error}</p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Merit</th>
              <th>Suggested</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allotments.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No allotments yet — run merit engine on confirmed registrations
                </td>
              </tr>
            ) : (
              allotments.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.registrations?.registration_id}</td>
                  <td>{headName(a)}</td>
                  <td className="mono">{a.merit_score ?? "—"}</td>
                  <td>
                    {a.country ?? "—"} · {a.committees?.name ?? "—"}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{a.status}</td>
                  <td>
                    {a.status === "pending" && (
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        onClick={() => setEditing(a)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <>
          <div className="admin-modal-backdrop" onClick={() => setEditing(null)} />
          <div className="admin-modal" role="dialog">
            <h2 className="admin-modal-title">Edit allotment override</h2>
            {overrideState?.error && (
              <p className="admin-toast admin-toast-error">{overrideState.error}</p>
            )}
            <form action={overrideAction} className="admin-form-grid">
              <input type="hidden" name="registration_id" value={editing.registration_id} />
              <div className="admin-field">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  defaultValue={editing.country ?? ""}
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="committee_id">Committee</label>
                <select
                  id="committee_id"
                  name="committee_id"
                  defaultValue={editing.committee_id ?? ""}
                >
                  <option value="">Select committee</option>
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label htmlFor="override_note">Override note</label>
                <textarea id="override_note" name="override_note" />
              </div>
              <button type="submit" className="btn-admin-primary" disabled={saving}>
                Save override
              </button>
            </form>
          </div>
        </>
      )}

      {showIssueModal && (
        <>
          <div
            className="admin-modal-backdrop"
            onClick={() => setShowIssueModal(false)}
          />
          <div className="admin-modal" role="alertdialog">
            <h2 className="admin-modal-title">Issue allotments</h2>
            <p className="admin-modal-body">
              This will issue allotments to {pendingCount} delegates and send each an
              email immediately. This cannot be undone.
            </p>
            <form action={issueAction} className="admin-actions">
              <button type="submit" className="btn-admin-primary" disabled={issuing}>
                {issuing ? "Issuing…" : "Confirm issue"}
              </button>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setShowIssueModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
