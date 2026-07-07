"use client";

import { useActionState, useState } from "react";
import { resolveQueryAction } from "@/lib/admin/actions/team-queries";
import { formatDate } from "@/lib/utils/format";
import type { QueryTicket } from "@/lib/types/admin";

type Props = {
  queries: QueryTicket[];
};

export function QueriesManager({ queries }: Props) {
  const [selected, setSelected] = useState<QueryTicket | null>(null);
  const [state, action, pending] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      const result = await resolveQueryAction(formData);
      if (result.success) setSelected(null);
      return result;
    },
    null,
  );

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Subject</th>
              <th>Submitter</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {queries.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No queries yet
                </td>
              </tr>
            ) : (
              queries.map((q) => (
                <tr key={q.id}>
                  <td className="mono">#{q.ticket_number}</td>
                  <td>{formatDate(q.created_at)}</td>
                  <td>{q.subject}</td>
                  <td>{q.submitter_name}</td>
                  <td>
                    <span
                      className={`admin-badge admin-badge-${q.status === "open" ? "open" : "resolved"}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      onClick={() => setSelected(q)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="admin-modal-backdrop" onClick={() => setSelected(null)} />
          <div className="admin-modal" role="dialog">
            <h2 className="admin-modal-title">
              #{selected.ticket_number} — {selected.subject}
            </h2>
            <div className="admin-modal-body">
              <p>
                From {selected.submitter_name} ({selected.submitter_email})
              </p>
              <p>{selected.body}</p>
            </div>
            {state?.success && (
              <p className="admin-toast admin-toast-success">{state.success}</p>
            )}
            {selected.status === "open" && (
              <form action={action} className="admin-form-grid">
                <input type="hidden" name="query_id" value={selected.id} />
                <div className="admin-field">
                  <label htmlFor="admin_notes">Admin notes (internal)</label>
                  <textarea id="admin_notes" name="admin_notes" />
                </div>
                <button type="submit" className="btn-admin-primary" disabled={pending}>
                  Mark resolved
                </button>
              </form>
            )}
            <button
              type="button"
              className="btn-admin-secondary"
              style={{ marginTop: "1rem" }}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </>
      )}
    </>
  );
}
