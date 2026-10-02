"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

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

const PAGE_MARGIN_MM = 10;

/**
 * Snapshots each sheet exactly as rendered on screen into an A4 PDF, one
 * committee per page. A committee too long for one page breaks between rows
 * and repeats the table header on the next page.
 */
async function downloadSheetsPdf(
  sheets: HTMLElement[],
  landscape: boolean,
  filename: string,
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const pdf = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const usableW = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_MM * 2;
  const usableH = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_MM * 2;
  let firstPage = true;

  for (const sheet of sheets) {
    const sheetRect = sheet.getBoundingClientRect();
    const cssW = sheet.scrollWidth;
    const cssH = sheet.scrollHeight;
    const offset = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - sheetRect.top, bottom: r.bottom - sheetRect.top };
    };

    const head = sheet.querySelector("thead");
    const headBand = head ? offset(head) : null;
    // Safe page-break points: below each body row, then the end of the sheet
    const breaks = [
      ...Array.from(
        sheet.querySelectorAll("tbody tr"),
        (tr) => offset(tr).bottom,
      ),
      cssH,
    ];

    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: cssW,
      height: cssH,
    });
    const pxScale = canvas.width / cssW;

    // Fit to width; squeeze a slightly-too-long sheet onto one page
    let mmPerPx = usableW / cssW;
    if (cssH * mmPerPx > usableH && usableH / cssH >= mmPerPx * 0.8) {
      mmPerPx = usableH / cssH;
    }
    const pageCssH = usableH / mmPerPx;
    const xMm = PAGE_MARGIN_MM + (usableW - cssW * mmPerPx) / 2;

    const draw = (from: number, to: number, yMm: number) => {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.max(1, Math.round((to - from) * pxScale));
      slice
        .getContext("2d")!
        .drawImage(
          canvas,
          0,
          Math.round(from * pxScale),
          canvas.width,
          slice.height,
          0,
          0,
          canvas.width,
          slice.height,
        );
      const hMm = (to - from) * mmPerPx;
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.92),
        "JPEG",
        xMm,
        yMm,
        cssW * mmPerPx,
        hMm,
      );
      return yMm + hMm;
    };

    let start = 0;
    while (start < cssH - 1) {
      if (!firstPage) pdf.addPage();
      firstPage = false;

      let y = PAGE_MARGIN_MM;
      let room = pageCssH;
      if (start > 0 && headBand) {
        y = draw(headBand.top, headBand.bottom, y);
        room -= headBand.bottom - headBand.top;
      }
      const fits = breaks.filter((b) => b > start && b <= start + room);
      // A single row taller than the page still has to go somewhere
      const end = fits.length
        ? fits[fits.length - 1]
        : Math.min(cssH, start + room);
      draw(start, end, y);
      start = end;
    }
  }

  pdf.save(filename);
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
  const [downloading, setDownloading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  async function onDownload() {
    const root = rootRef.current;
    if (!root) return;
    const slug =
      selected.length === 1
        ? selected[0].name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        : "all-committees";
    setDownloading(true);
    // Lay sheets out at a paper-shaped width, whatever the window size
    root.style.setProperty("--rc-export-width", landscape ? "70rem" : "48rem");
    root.classList.add("rollcall-exporting");
    try {
      await downloadSheetsPdf(
        Array.from(root.querySelectorAll<HTMLElement>(".rollcall-sheet")),
        landscape,
        `roll-call-${slug}.pdf`,
      );
    } catch (error) {
      console.error(error);
      alert("Could not build the PDF. Please try again.");
    } finally {
      root.classList.remove("rollcall-exporting");
      setDownloading(false);
    }
  }

  return (
    <div className="rollcall" ref={rootRef}>
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
            disabled={selected.length === 0 || downloading}
            onClick={onDownload}
          >
            {downloading ? "Building PDF…" : "Download PDF"}
          </button>
        </div>

        <p className="rollcall-hint">
          One page per committee, countries A–Z, with an empty P / A box for
          each session. Countries appear once they are allotted (pending or
          issued). {landscape ? "PDF is A4 landscape." : "PDF is A4 portrait."}
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
            <div className="rollcall-sheet-top">
              <div className="rollcall-brand">
                <div className="rollcall-lockup">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Munique" />
                  <span className="rollcall-cross" aria-hidden="true" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/amhss.png" alt="AMHSS" />
                </div>
                <p className="rollcall-eyebrow">Munique 2026 · Roll call</p>
              </div>
              <p className="rollcall-powered">
                <span>Powered by</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/system-summit.png" alt="System Summit" />
              </p>
            </div>
            <header className="rollcall-sheet-head">
              <h2 className="rollcall-committee">{committee.name}</h2>
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
