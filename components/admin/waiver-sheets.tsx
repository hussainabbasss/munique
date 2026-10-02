"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WaiverLayout, WaiverRow } from "@/lib/pdf/waivers";

export type WaiverCommittee = {
  id: string;
  name: string;
  rows: WaiverRow[];
};

type Props = {
  committees: WaiverCommittee[];
  initialCommitteeId: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Delegate waivers: one A5 page per allotted delegate, for one committee or
 * all of them. Any single form can be previewed before downloading.
 */
export function WaiverSheets({ committees, initialCommitteeId }: Props) {
  const [committeeId, setCommitteeId] = useState(
    committees.some((c) => c.id === initialCommitteeId)
      ? initialCommitteeId
      : "all",
  );
  const [downloading, setDownloading] = useState<WaiverLayout | null>(null);

  const rows = useMemo(
    () =>
      committeeId === "all"
        ? committees.flatMap((c) => c.rows)
        : (committees.find((c) => c.id === committeeId)?.rows ?? []),
    [committees, committeeId],
  );
  const total = committees.reduce((sum, c) => sum + c.rows.length, 0);

  /** Opens one delegate's waiver in a new tab, in the browser's PDF viewer. */
  async function onPreview(row: WaiverRow) {
    // Open the tab now, inside the click, so pop-up blockers allow it
    const tab = window.open("", "_blank");
    try {
      const { buildWaiversPdf } = await import("@/lib/pdf/waivers");
      const doc = await buildWaiversPdf([row]);
      const url = URL.createObjectURL(doc.output("blob"));
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      tab?.close();
      alert("Could not build the preview. Please try again.");
    }
  }

  async function onDownload(layout: WaiverLayout) {
    if (!rows.length) return;
    const selected = committees.find((c) => c.id === committeeId);
    setDownloading(layout);
    try {
      const { buildWaiversPdf } = await import("@/lib/pdf/waivers");
      const doc = await buildWaiversPdf(rows, layout);
      const scope = selected ? slugify(selected.name) : "all-committees";
      doc.save(
        `munique-waivers-${scope}${layout === "a4-pair" ? "-a4" : ""}.pdf`,
      );
    } catch (error) {
      console.error(error);
      alert("Could not build the PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="rollcall">
      <div className="rollcall-controls">
        <Link href="/admin/countries" className="rollcall-back">
          ← Country matrix
        </Link>
        <h1 className="rollcall-controls-title">Print waivers</h1>

        <div className="rollcall-fields">
          <label className="rollcall-field">
            <span>Committee</span>
            <select
              value={committeeId}
              onChange={(event) => setCommitteeId(event.target.value)}
            >
              <option value="all">All committees ({total})</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.id}>
                  {committee.name} ({committee.rows.length})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="rollcall-print"
            disabled={rows.length === 0 || downloading !== null}
            onClick={() => onDownload("a5")}
          >
            {downloading === "a5"
              ? "Building PDF…"
              : `Download ${rows.length} waiver${rows.length === 1 ? "" : "s"} · A5`}
          </button>
          <button
            type="button"
            className="rollcall-print waivers-print-alt"
            disabled={rows.length === 0 || downloading !== null}
            onClick={() => onDownload("a4-pair")}
            title="Two waivers side by side on landscape A4 — print, then cut down the dashed line"
          >
            {downloading === "a4-pair"
              ? "Building PDF…"
              : `A4 · 2 per page (${Math.ceil(rows.length / 2)} sheet${Math.ceil(rows.length / 2) === 1 ? "" : "s"})`}
          </button>
        </div>

        <p className="rollcall-hint">
          One waiver per allotted delegate (pending or issued), A–Z by name,
          with their phone, email, committee and institute printed. Delegates
          sign the undertaking and write their CNIC by hand. A5 prints one per
          page; A4 puts two side by side on a landscape sheet with a dashed
          cut line down the middle.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rollcall-empty">
          No delegates are allotted in this committee yet.
        </p>
      ) : (
        <div className="waivers-list">
          <p className="waivers-list-title">
            {rows.length} waiver{rows.length === 1 ? "" : "s"} in this PDF
          </p>
          <table className="rollcall-table">
            <thead>
              <tr>
                <th className="rollcall-num">#</th>
                <th>Delegate</th>
                <th>Committee</th>
                <th>Institute</th>
                <th className="waivers-action-col" aria-label="Preview" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.code}-${row.name}-${index}`}>
                  <td className="rollcall-num">{index + 1}</td>
                  <td className="rollcall-country">{row.name}</td>
                  <td>{row.committee}</td>
                  <td>{row.institute}</td>
                  <td className="waivers-action-col">
                    <button
                      type="button"
                      className="waivers-preview-button"
                      onClick={() => onPreview(row)}
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
