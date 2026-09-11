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
import { RegistrationProfileDialog } from "@/components/admin/registration-profile-dialog";

type DelegateRow = {
  id: string;
  full_name: string;
  is_head_delegate: boolean;
  email: string | null;
  allotment_email_sent_at: string | null;
};

type AllotmentRow = {
  id: string;
  registration_id: string;
  delegate_id: string;
  merit_score: number | null;
  country: string | null;
  committee_id: string | null;
  status: string;
  ai_reasoning: string | null;
  registrations: {
    registration_id: string;
    payment_status: string;
    type: "delegate" | "delegation";
    school: string;
  } | null;
  delegates: DelegateRow | null;
  committees: { name: string } | null;
};

type Committee = {
  id: string;
  name: string;
  country_pool: string[];
};

type AwaitingRow = {
  id: string;
  registrationUuid: string;
  registration_id: string;
  type: "delegate" | "delegation";
  school: string;
  delegate: DelegateRow;
};

type StatusTab = "pending" | "issued";
type TypeTab = "delegate" | "delegation";

type ProfileTarget = {
  registrationUuid: string;
  focusDelegateId: string | null;
};

type Props = {
  allotments: AllotmentRow[];
  committees: Committee[];
  awaiting: AwaitingRow[];
  pendingEmailCount: number;
  incompletePendingCount: number;
  pendingDelegateEmails: number;
  pendingDelegationEmails: number;
  canIssue: boolean;
};

export function AllotmentsManager({
  allotments,
  committees,
  awaiting,
  pendingEmailCount,
  incompletePendingCount,
  pendingDelegateEmails,
  pendingDelegationEmails,
  canIssue,
}: Props) {
  const [typeTab, setTypeTab] = useState<TypeTab>("delegate");
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [editing, setEditing] = useState<AllotmentRow | null>(null);
  const [editCommitteeId, setEditCommitteeId] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [profileTarget, setProfileTarget] = useState<ProfileTarget | null>(
    null,
  );

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

  const committeeById = useMemo(
    () => new Map(committees.map((committee) => [committee.id, committee])),
    [committees],
  );

  const byType = useMemo(
    () => allotments.filter((row) => row.registrations?.type === typeTab),
    [allotments, typeTab],
  );

  const pendingRows = useMemo(
    () =>
      byType.filter(
        (row) =>
          !isAllotmentIssuedTab(
            row.registrations,
            row.status,
            Boolean(row.country),
            row.delegates,
          ),
      ),
    [byType],
  );

  const issuedRows = useMemo(
    () =>
      byType.filter((row) =>
        isAllotmentIssuedTab(
          row.registrations,
          row.status,
          Boolean(row.country),
          row.delegates,
        ),
      ),
    [byType],
  );

  const visibleRows = statusTab === "pending" ? pendingRows : issuedRows;

  const awaitingByType = useMemo(
    () => awaiting.filter((row) => row.type === typeTab),
    [awaiting, typeTab],
  );

  const delegateCount = useMemo(
    () => allotments.filter((row) => row.registrations?.type === "delegate").length,
    [allotments],
  );

  const delegationCount = useMemo(
    () =>
      allotments.filter((row) => row.registrations?.type === "delegation").length,
    [allotments],
  );

  const canIssueNow =
    canIssue && pendingEmailCount > 0 && incompletePendingCount === 0;

  const openEdit = (row: AllotmentRow) => {
    setEditing(row);
    setEditCommitteeId(row.committee_id ?? "");
    setEditCountry(row.country ?? "");
  };

  const openProfile = (registrationUuid: string, focusDelegateId: string) => {
    setProfileTarget({ registrationUuid, focusDelegateId });
  };

  const displayName = (row: AllotmentRow | AwaitingRow) => {
    if ("delegate" in row) {
      const suffix =
        row.type === "delegation"
          ? ` · ${row.school}${row.delegate.is_head_delegate ? " (head)" : ""}`
          : "";
      return `${row.delegate.full_name}${suffix}`;
    }

    const person = row.delegates;
    const reg = row.registrations;
    if (!person) return "—";
    if (reg?.type === "delegation") {
      return `${person.full_name} · ${reg.school}${person.is_head_delegate ? " (head)" : ""}`;
    }
    return person.full_name;
  };

  const registrationId = (row: AllotmentRow | AwaitingRow) =>
    "registrations" in row
      ? (row.registrations?.registration_id ?? "—")
      : row.registration_id;

  const needsManualAllotment = (row: AllotmentRow) =>
    !row.country || !row.committee_id;

  const statusLabel = (row: AllotmentRow) => {
    if (row.status === "issued") return "Issued";
    if (needsManualAllotment(row)) {
      return row.ai_reasoning?.startsWith("Model failed")
        ? "Model failed"
        : "Needs EB";
    }
    return "Pending";
  };

  const selectedCommitteePool =
    committeeById.get(editCommitteeId)?.country_pool ?? [];

  return (
    <>
      <div className="admin-allotment-toolbar">
        <div className="admin-allotment-toolbar-actions">
          <form action={engineAction}>
            <button type="submit" className="btn-admin-secondary" disabled={running}>
              {running ? "Running…" : "Run merit engine"}
            </button>
          </form>
          {canIssue && (
            <button
              type="button"
              className="btn-admin-primary btn-admin-weighty"
              disabled={!canIssueNow}
              title={
                incompletePendingCount > 0
                  ? "Complete all pending allotments before issuing"
                  : pendingEmailCount === 0
                    ? "No allotment emails pending"
                    : undefined
              }
              onClick={() => setShowIssueModal(true)}
            >
              Issue allotments
            </button>
          )}
        </div>

        <div
          className="admin-allotment-segmented"
          role="tablist"
          aria-label="Registration type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={typeTab === "delegate"}
            className={`admin-allotment-segment${typeTab === "delegate" ? " admin-allotment-segment-active" : ""}`}
            onClick={() => setTypeTab("delegate")}
          >
            Delegates ({delegateCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={typeTab === "delegation"}
            className={`admin-allotment-segment${typeTab === "delegation" ? " admin-allotment-segment-active" : ""}`}
            onClick={() => setTypeTab("delegation")}
          >
            Delegation members ({delegationCount})
          </button>
        </div>
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

      {awaitingByType.length > 0 && (
        <section className="admin-allotment-awaiting">
          <div className="admin-allotment-awaiting-head">
            <h2 className="admin-allotment-awaiting-title">
              Awaiting merit engine ({awaitingByType.length})
            </h2>
            <p className="admin-field-hint">
              Confirmed people without allotment suggestions yet.
            </p>
          </div>
          <ul className="admin-allotment-awaiting-list">
            {awaitingByType.slice(0, 8).map((row) => (
              <li key={row.id} className="mono">
                {row.registration_id} ·{" "}
                <button
                  type="button"
                  className="admin-name-link"
                  onClick={() =>
                    openProfile(row.registrationUuid, row.delegate.id)
                  }
                >
                  {displayName(row)}
                </button>
              </li>
            ))}
            {awaitingByType.length > 8 && (
              <li className="admin-field-hint">
                +{awaitingByType.length - 8} more
              </li>
            )}
          </ul>
        </section>
      )}

      <div
        className="admin-allotment-segmented admin-allotment-segmented-secondary"
        role="tablist"
        aria-label="Allotment status"
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "pending"}
          className={`admin-allotment-segment${statusTab === "pending" ? " admin-allotment-segment-active" : ""}`}
          onClick={() => setStatusTab("pending")}
        >
          Pending ({pendingRows.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "issued"}
          className={`admin-allotment-segment${statusTab === "issued" ? " admin-allotment-segment-active" : ""}`}
          onClick={() => setStatusTab("issued")}
        >
          Issued ({issuedRows.length})
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-allotment-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Merit</th>
              <th>Committee</th>
              <th>Country</th>
              <th>Status</th>
              <th>Email</th>
              {statusTab === "pending" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={statusTab === "pending" ? 8 : 7}
                  className="admin-empty"
                >
                  {statusTab === "pending"
                    ? "No pending allotments — run merit engine on confirmed registrations"
                    : "No issued allotments yet"}
                </td>
              </tr>
            ) : (
              visibleRows.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{registrationId(a)}</td>
                  <td className="admin-allotment-name" title={displayName(a)}>
                    <button
                      type="button"
                      className="admin-name-link"
                      onClick={() =>
                        openProfile(a.registration_id, a.delegate_id)
                      }
                    >
                      {displayName(a)}
                    </button>
                  </td>
                  <td className="mono">{a.merit_score ?? "—"}</td>
                  <td
                    className="admin-allotment-cell-truncate"
                    title={a.committees?.name ?? ""}
                  >
                    {a.committees?.name ?? "—"}
                  </td>
                  <td
                    className="admin-allotment-cell-truncate"
                    title={a.country ?? ""}
                  >
                    {a.country ?? "—"}
                  </td>
                  <td>
                    <span
                      className={
                        needsManualAllotment(a)
                          ? "admin-allotment-status-fail"
                          : undefined
                      }
                      title={a.ai_reasoning ?? undefined}
                    >
                      {statusLabel(a)}
                    </span>
                  </td>
                  <td>
                    {allotmentEmailStatus(
                      a.registrations,
                      Boolean(a.country),
                      a.delegates,
                    )}
                  </td>
                  {statusTab === "pending" && (
                    <td>
                      <button
                        type="button"
                        className={
                          needsManualAllotment(a)
                            ? "btn-admin-primary"
                            : "btn-admin-secondary"
                        }
                        onClick={() => openEdit(a)}
                      >
                        {needsManualAllotment(a) ? "Set allotment" : "Adjust"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RegistrationProfileDialog
        registrationUuid={profileTarget?.registrationUuid ?? null}
        focusDelegateId={profileTarget?.focusDelegateId ?? null}
        onClose={() => setProfileTarget(null)}
      />

      {editing && (
        <>
          <div className="admin-modal-backdrop" onClick={() => setEditing(null)} />
          <div className="admin-modal admin-allotment-modal" role="dialog">
            <div className="admin-allotment-modal-head">
              <h2 className="admin-modal-title">Review allotment</h2>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>

            <div className="admin-allotment-review-card">
              <p className="mono admin-allotment-review-id">
                {editing.registrations?.registration_id}
              </p>
              <p className="admin-allotment-review-name">{displayName(editing)}</p>
              {needsManualAllotment(editing) && (
                <p className="admin-toast admin-toast-error" role="status">
                  {editing.ai_reasoning?.startsWith("Model failed")
                    ? "Model failed — choose committee and allotment below."
                    : "No allotment yet — choose committee and allotment below."}
                </p>
              )}
              <dl className="admin-allotment-review-meta">
                <div>
                  <dt>Merit score</dt>
                  <dd>{editing.merit_score ?? "—"}</dd>
                </div>
                <div>
                  <dt>Suggested committee</dt>
                  <dd>{editing.committees?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt>Suggested country</dt>
                  <dd>{editing.country ?? "—"}</dd>
                </div>
              </dl>
              {editing.ai_reasoning && (
                <p className="admin-field-hint">{editing.ai_reasoning}</p>
              )}
              <p className="admin-field-hint">
                P5 countries are listed separately for manual EB assignment only.
              </p>
            </div>

            {overrideState?.error && (
              <p className="admin-toast admin-toast-error">{overrideState.error}</p>
            )}
            <form action={overrideAction} className="admin-form-grid">
              <input type="hidden" name="allotment_id" value={editing.id} />
              <input
                type="hidden"
                name="registration_id"
                value={editing.registration_id}
              />
              <input type="hidden" name="delegate_id" value={editing.delegate_id} />
              <div className="admin-field">
                <label htmlFor="committee_id">Committee</label>
                <select
                  id="committee_id"
                  name="committee_id"
                  value={editCommitteeId}
                  onChange={(event) => {
                    setEditCommitteeId(event.target.value);
                    setEditCountry("");
                  }}
                  required
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
                <label htmlFor="country">Country</label>
                <CountryPicker
                  id="country"
                  value={editCountry}
                  committeePool={selectedCommitteePool}
                  onChange={setEditCountry}
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="override_note">Override note</label>
                <textarea id="override_note" name="override_note" rows={3} />
              </div>
              <button
                type="submit"
                className="btn-admin-primary"
                disabled={saving || !editCommitteeId || !editCountry}
              >
                {saving ? "Saving…" : "Save allotment"}
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
              Each delegate with an email is notified individually. Already-emailed
              recipients are skipped.
            </p>
            <ul className="admin-allotment-issue-breakdown">
              <li>{pendingDelegateEmails} individual delegate emails</li>
              <li>{pendingDelegationEmails} delegation member emails</li>
            </ul>
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
