"use client";

import { useActionState, useMemo, useState } from "react";
import {
  issueAllotmentsAction,
  runMeritEngineAction,
  saveAllotmentOverrideAction,
} from "@/lib/admin/actions/allotments";
import {
  allotmentEmailStatus,
  isAllotmentIssuedTab,
} from "@/lib/allotments/pending-email";
import { CountryPicker } from "@/components/admin/country-picker";

type DelegateRow = {
  full_name: string;
  is_head_delegate: boolean;
  email: string | null;
  allotment_email_sent_at: string | null;
};

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
    type: "delegate" | "delegation";
    school: string;
    delegates: DelegateRow[];
  } | null;
  committees: { name: string } | null;
};

type Committee = { id: string; name: string };

type StatusTab = "pending" | "issued";
type TypeTab = "delegate" | "delegation";

type Props = {
  allotments: AllotmentRow[];
  committees: Committee[];
  pendingEmailCount: number;
  canIssue: boolean;
};

function matchesType(row: AllotmentRow, typeTab: TypeTab) {
  return row.registrations?.type === typeTab;
}

export function AllotmentsManager({
  allotments,
  committees,
  pendingEmailCount,
  canIssue,
}: Props) {
  const [typeTab, setTypeTab] = useState<TypeTab>("delegate");
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
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

  const byType = useMemo(
    () => allotments.filter((row) => matchesType(row, typeTab)),
    [allotments, typeTab],
  );

  const pendingRows = useMemo(
    () => byType.filter((row) => !isAllotmentIssuedTab(row.registrations, row.status, Boolean(row.country))),
    [byType],
  );

  const issuedRows = useMemo(
    () => byType.filter((row) => isAllotmentIssuedTab(row.registrations, row.status, Boolean(row.country))),
    [byType],
  );

  const visibleRows = statusTab === "pending" ? pendingRows : issuedRows;

  const delegateCount = useMemo(
    () => allotments.filter((row) => row.registrations?.type === "delegate").length,
    [allotments],
  );

  const delegationCount = useMemo(
    () => allotments.filter((row) => row.registrations?.type === "delegation").length,
    [allotments],
  );

  const displayName = (row: AllotmentRow) => {
    const reg = row.registrations;
    if (!reg) return "—";

    if (reg.type === "delegation") {
      const count = reg.delegates.length;
      const head =
        reg.delegates.find((d) => d.is_head_delegate)?.full_name ??
        reg.delegates[0]?.full_name ??
        "—";
      return `${reg.school || head} (${count} delegates)`;
    }

    return (
      reg.delegates.find((d) => d.is_head_delegate)?.full_name ??
      reg.delegates[0]?.full_name ??
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
        {canIssue && pendingEmailCount > 0 && (
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

      <p className="admin-field-hint admin-allotment-tabs-lede">
        Merit engine never auto-assigns P5 countries — use Edit override for manual P5
        assignment. Delegations share one country; only the head delegate is emailed.
      </p>

      <div
        className="admin-allotment-tabs"
        role="tablist"
        aria-label="Registration type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={typeTab === "delegate"}
          className={`admin-allotment-tab${typeTab === "delegate" ? " admin-allotment-tab-active" : ""}`}
          onClick={() => setTypeTab("delegate")}
        >
          Individual delegates ({delegateCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={typeTab === "delegation"}
          className={`admin-allotment-tab${typeTab === "delegation" ? " admin-allotment-tab-active" : ""}`}
          onClick={() => setTypeTab("delegation")}
        >
          Delegations ({delegationCount})
        </button>
      </div>

      <div
        className="admin-allotment-tabs admin-allotment-tabs-secondary"
        role="tablist"
        aria-label="Allotment status"
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "pending"}
          className={`admin-allotment-tab${statusTab === "pending" ? " admin-allotment-tab-active" : ""}`}
          onClick={() => setStatusTab("pending")}
        >
          Pending ({pendingRows.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "issued"}
          className={`admin-allotment-tab${statusTab === "issued" ? " admin-allotment-tab-active" : ""}`}
          onClick={() => setStatusTab("issued")}
        >
          Issued ({issuedRows.length})
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{typeTab === "delegation" ? "Delegation" : "Name"}</th>
              <th>Merit</th>
              <th>Suggested</th>
              <th>Status</th>
              <th>Email</th>
              {statusTab === "pending" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={statusTab === "pending" ? 7 : 6}
                  className="admin-empty"
                >
                  {statusTab === "pending"
                    ? `No pending ${typeTab === "delegation" ? "delegation" : "delegate"} allotments — run merit engine on confirmed registrations`
                    : `No issued ${typeTab === "delegation" ? "delegations" : "delegates"} yet`}
                </td>
              </tr>
            ) : (
              visibleRows.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.registrations?.registration_id}</td>
                  <td>{displayName(a)}</td>
                  <td className="mono">{a.merit_score ?? "—"}</td>
                  <td>
                    {a.country ?? "—"} · {a.committees?.name ?? "—"}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{a.status}</td>
                  <td>
                    {allotmentEmailStatus(a.registrations, Boolean(a.country))}
                  </td>
                  {statusTab === "pending" && (
                    <td>
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        onClick={() => setEditing(a)}
                      >
                        Edit
                      </button>
                    </td>
                  )}
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
            <p className="admin-field-hint">
              P5 countries are listed separately for manual EB assignment only.
            </p>
            {overrideState?.error && (
              <p className="admin-toast admin-toast-error">{overrideState.error}</p>
            )}
            <form action={overrideAction} className="admin-form-grid">
              <input type="hidden" name="registration_id" value={editing.registration_id} />
              <div className="admin-field">
                <label htmlFor="country">Country</label>
                <CountryPicker
                  id="country"
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
              This will send allotment emails to {pendingEmailCount} recipient
              {pendingEmailCount === 1 ? "" : "s"} who have not received one yet.
              Individual delegates are emailed directly; delegations are emailed to
              the head delegate only. Already-emailed recipients are skipped.
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
