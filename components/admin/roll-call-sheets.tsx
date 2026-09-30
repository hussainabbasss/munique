"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type RollCallCommittee = {
  id: string;
  name: string;
  rows: { country: string; delegates: string[] }[];
};

type Props = {
  committees: RollCallCommittee[];
  initialCommitteeId: string;
  initialSessions: number;
};

const MAX_SESSIONS = 20;
const MAX_BLANK_ROWS = 20;

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Printable roll-call sheets: one page per committee, one row per allotted
 * country, an empty P/A box per committee session for the chair to fill in.
 */
export function RollCallSheets({
  committees,
  initialCommitteeId,
  initialSessions,
}: Props) {
  const [committeeId, setCommitteeId] = useState(
    committees.some((c) => c.id === initialCommitteeId)
      ? initialCommitteeId
      : "all",
  );
  const [sessionsInput, setSessionsInput] = useState(
    String(clamp(initialSessions, 1, MAX_SESSIONS)),
  );
  const [showDelegates, setShowDelegates] = useState(false);
  const [blankRowsInput, setBlankRowsInput] = useState("0");

  const sessions = clamp(Number(sessionsInput), 1, MAX_SESSIONS);
  const blankRows = clamp(Number(blankRowsInput), 0, MAX_BLANK_ROWS);

  const selected = useMemo(() => {
    const chosen =
      committeeId === "all"
        ? committees
        : committees.filter((c) => c.id === committeeId);
    return chosen.filter((c) => c.rows.length > 0 || blankRows > 0);
  }, [committees, committeeId, blankRows]);

  const emptySkipped =
    committeeId === "all"
      ? committees.filter((c) => c.rows.length === 0 && blankRows === 0)
      : [];

  // Wide grids need landscape paper
  const landscape = sessions > 5 || (showDelegates && sessions > 3);

  return (
    <div className="rollcall">
      <style>{`@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 10mm; }`}</style>

      <div className="rollcall-controls">
        <Link href="/admin/countries" className="rollcall-back">
          ← Country matrix
        </Link>
        <h1 className="rollcall-controls-title">Print roll call</h1>

        <div className="rollcall-fields">
          <label className="rollcall-field">
            <span>Committee</span>
            <select
              value={committeeId}
              onChange={(event) => setCommitteeId(event.target.value)}
            >
              <option value="all">All committees (one page each)</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.id}>
                  {committee.name} ({committee.rows.length})
                </option>
              ))}
            </select>
          </label>

          <label className="rollcall-field rollcall-field-narrow">
            <span>Sessions</span>
            <input
              type="number"
              min={1}
              max={MAX_SESSIONS}
              value={sessionsInput}
              onChange={(event) => setSessionsInput(event.target.value)}
              onBlur={() => setSessionsInput(String(sessions))}
            />
          </label>

          <label className="rollcall-field rollcall-field-narrow">
            <span>Blank rows</span>
            <input
              type="number"
              min={0}
              max={MAX_BLANK_ROWS}
              value={blankRowsInput}
              onChange={(event) => setBlankRowsInput(event.target.value)}
              onBlur={() => setBlankRowsInput(String(blankRows))}
            />
          </label>

          <label className="rollcall-check">
            <input
              type="checkbox"
              checked={showDelegates}
              onChange={(event) => setShowDelegates(event.target.checked)}
            />
            Delegate names
          </label>

          <button
            type="button"
            className="rollcall-print"
            disabled={selected.length === 0}
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>

        <p className="rollcall-hint">
          One page per committee, countries A–Z, with an empty P / A box for
          each session. Countries appear once they are allotted (pending or
          issued). {landscape ? "Prints landscape." : "Prints portrait."}
          {emptySkipped.length > 0 &&
            ` Skipped with no countries yet: ${emptySkipped.map((c) => c.name).join(", ")}.`}
        </p>
      </div>

      {selected.length === 0 ? (
        <p className="rollcall-empty">
          No countries are allotted in this committee yet.
        </p>
      ) : (
        selected.map((committee) => (
          <section key={committee.id} className="rollcall-sheet">
            <header className="rollcall-sheet-head">
              <div>
                <p className="rollcall-eyebrow">Munique 2026 · Roll call</p>
                <h2 className="rollcall-committee">{committee.name}</h2>
              </div>
              <dl className="rollcall-meta">
                <div>
                  <dt>Date</dt>
                  <dd />
                </div>
                <div>
                  <dt>Chair</dt>
                  <dd />
                </div>
              </dl>
            </header>

            <table className="rollcall-table">
              <thead>
                <tr>
                  <th className="rollcall-num">#</th>
                  <th className="rollcall-country">Country Name</th>
                  {showDelegates && (
                    <th className="rollcall-delegate">Delegate</th>
                  )}
                  {Array.from({ length: sessions }, (_, i) => (
                    <th key={i} className="rollcall-session">
                      Session {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {committee.rows.map((row, index) => (
                  <tr key={row.country}>
                    <td className="rollcall-num">{index + 1}</td>
                    <td className="rollcall-country">{row.country}</td>
                    {showDelegates && (
                      <td className="rollcall-delegate">
                        {row.delegates.join(" / ")}
                      </td>
                    )}
                    {Array.from({ length: sessions }, (_, i) => (
                      <td key={i} className="rollcall-session" />
                    ))}
                  </tr>
                ))}
                {Array.from({ length: blankRows }, (_, b) => (
                  <tr key={`blank-${b}`}>
                    <td className="rollcall-num">
                      {committee.rows.length + b + 1}
                    </td>
                    <td className="rollcall-country" />
                    {showDelegates && <td className="rollcall-delegate" />}
                    {Array.from({ length: sessions }, (_, i) => (
                      <td key={i} className="rollcall-session" />
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="rollcall-num" />
                  <th className="rollcall-country" scope="row">
                    Present / {committee.rows.length + blankRows}
                  </th>
                  {showDelegates && <td className="rollcall-delegate" />}
                  {Array.from({ length: sessions }, (_, i) => (
                    <td key={i} className="rollcall-session" />
                  ))}
                </tr>
              </tfoot>
            </table>

            <p className="rollcall-footer">
              Mark P (present) or A (absent) for each country in every session.
            </p>
          </section>
        ))
      )}
    </div>
  );
}
