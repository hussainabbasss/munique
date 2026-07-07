"use client";

import { useState } from "react";
import { CommitteeForm } from "@/components/admin/committee-form";
import type { Committee } from "@/lib/types/admin";

type Props = {
  committees: Committee[];
};

export function CommitteesManager({ committees }: Props) {
  const [editing, setEditing] = useState<Committee | null>(null);
  const [creating, setCreating] = useState(false);

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
          + Add committee
        </button>
      </div>

      {(creating || editing) && (
        <section className="admin-panel" style={{ marginBottom: "1.25rem" }}>
          <h2 className="admin-panel-title">
            {editing ? `Edit ${editing.name}` : "New committee"}
          </h2>
          <CommitteeForm
            committee={editing}
            onDone={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        </section>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Tier</th>
              <th>Study guide</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {committees.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No committees yet
                </td>
              </tr>
            ) : (
              committees.map((c) => (
                <tr key={c.id}>
                  <td>{c.display_order}</td>
                  <td>{c.name}</td>
                  <td style={{ textTransform: "capitalize" }}>{c.difficulty_tier}</td>
                  <td>{c.study_guide_path ? "Uploaded" : "—"}</td>
                  <td>{c.is_published ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      onClick={() => {
                        setEditing(c);
                        setCreating(false);
                      }}
                    >
                      Edit
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
