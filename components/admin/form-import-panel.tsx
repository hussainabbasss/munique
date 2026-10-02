"use client";

import { useRef, useState, useTransition } from "react";
import {
  convertExcelToCsvAction,
  exportFormAllotmentsExcelAction,
  exportFormStudentsExcelAction,
  formStudentsPdfRowsAction,
  importFormRegistrationsAction,
  previewFormImportAction,
  type FormImportPreview,
} from "@/lib/admin/actions/form-import";
import {
  allottedDelegatesPdfRowsAction,
  exportAllottedDelegatesExcelAction,
} from "@/lib/admin/actions/exports";

type Props = {
  canImport: boolean;
};

type Toast = { kind: "success" | "error"; text: string } | null;

export function downloadBase64(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function FormImportPanel({ canImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<FormImportPreview | null>(null);
  const [allowUnmatched, setAllowUnmatched] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"preview" | "import" | "excel" | null>(null);

  const refreshPreview = async (text: string) => {
    const result = await previewFormImportAction(text);
    if (result.ok) {
      setPreview(result.preview);
    } else {
      setPreview(null);
      setToast({ kind: "error", text: result.error });
    }
  };

  const onFile = async (file: File | undefined) => {
    setToast(null);
    setPreview(null);
    setAllowUnmatched(false);
    if (!file) return;
    setFileName(file.name);
    setBusy("preview");
    startTransition(async () => {
      let text: string;
      if (/\.xlsx$/i.test(file.name)) {
        const result = await convertExcelToCsvAction(
          arrayBufferToBase64(await file.arrayBuffer()),
        );
        if (!result.ok) {
          setToast({ kind: "error", text: result.error });
          setBusy(null);
          return;
        }
        text = result.csvText;
      } else if (/\.xls$/i.test(file.name)) {
        setToast({
          kind: "error",
          text: "Old .xls files are not supported — save as .xlsx or download as CSV.",
        });
        setBusy(null);
        return;
      } else {
        text = await file.text();
      }
      setCsvText(text);
      await refreshPreview(text);
      setBusy(null);
    });
  };

  const onImport = () => {
    setToast(null);
    setBusy("import");
    startTransition(async () => {
      const result = await importFormRegistrationsAction(csvText, allowUnmatched);
      setToast(
        result.ok
          ? { kind: "success", text: result.message }
          : { kind: "error", text: result.error },
      );
      await refreshPreview(csvText);
      setBusy(null);
    });
  };

  const onExcel = () => {
    setToast(null);
    setBusy("excel");
    startTransition(async () => {
      const result = await exportFormAllotmentsExcelAction(csvText);
      if (result.ok) {
        downloadBase64(result.base64, result.filename);
      } else {
        setToast({ kind: "error", text: result.error });
      }
      setBusy(null);
    });
  };

  const reset = () => {
    setFileName("");
    setCsvText("");
    setPreview(null);
    setToast(null);
    setAllowUnmatched(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const blockedByCommittees =
    (preview?.unmatchedCommittees.length ?? 0) > 0 && !allowUnmatched;

  return (
    <section className="admin-allotment-awaiting admin-form-import">
      <div className="admin-allotment-awaiting-head">
        <h2 className="admin-allotment-awaiting-title">
          Import Google Form responses
        </h2>
        <p className="admin-field-hint">
          Upload the Form_Responses tab as CSV or Excel (.xlsx). Form registrants are imported
          as confirmed (no payment) with no registration or payment email.
          Anyone already registered — allotted or not — is skipped, so
          re-uploading the same sheet is safe.
        </p>
      </div>

      <div className="admin-form-import-row">
        <input
          ref={fileInput}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="admin-form-import-file"
          disabled={pending}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {fileName && (
          <button
            type="button"
            className="btn-admin-secondary"
            disabled={pending}
            onClick={reset}
          >
            Clear
          </button>
        )}
      </div>

      {busy === "preview" && (
        <p className="admin-field-hint">Checking {fileName}…</p>
      )}

      {toast && (
        <p className={`admin-toast admin-toast-${toast.kind}`}>{toast.text}</p>
      )}

      {preview && (
        <>
          <ul className="admin-allotment-issue-breakdown admin-form-import-summary">
            <li>
              {preview.totalRows} responses → {preview.uniquePeople} people
              {preview.duplicateRows > 0 &&
                ` (${preview.duplicateRows} duplicate submission${preview.duplicateRows === 1 ? "" : "s"} merged — latest one kept)`}
            </li>
            <li>
              <strong>{preview.newCount}</strong> new — will be imported and
              go through the merit engine
            </li>
            <li>
              {preview.existingCount} already registered — skipped
              {preview.alreadyAllottedCount > 0 &&
                ` (${preview.alreadyAllottedCount} already hold an allotment and will not be re-allotted)`}
            </li>
            {preview.skipped.length > 0 && (
              <li className="admin-allotment-status-fail">
                {preview.skipped.length} row
                {preview.skipped.length === 1 ? "" : "s"} skipped:{" "}
                {preview.skipped
                  .slice(0, 5)
                  .map((s) => `row ${s.sheetRow} ${s.name} (${s.reason})`)
                  .join(", ")}
                {preview.skipped.length > 5 && "…"}
              </li>
            )}
          </ul>

          {preview.unmatchedCommittees.length > 0 && (
            <div className="admin-toast admin-toast-error">
              <p>
                These committee preferences do not match any published
                committee:{" "}
                {preview.unmatchedCommittees
                  .map((c) => `“${c.value}” (${c.count})`)
                  .join(", ")}
              </p>
              <label className="admin-form-import-check">
                <input
                  type="checkbox"
                  checked={allowUnmatched}
                  onChange={(event) => setAllowUnmatched(event.target.checked)}
                />{" "}
                Import anyway with those preferences left blank
              </label>
            </div>
          )}

          <div className="admin-allotment-toolbar-actions">
            {canImport && (
              <button
                type="button"
                className="btn-admin-primary"
                disabled={pending || preview.newCount === 0 || blockedByCommittees}
                onClick={onImport}
              >
                {busy === "import"
                  ? "Importing…"
                  : preview.newCount === 0
                    ? "Nothing new to import"
                    : `Import ${preview.newCount} new`}
              </button>
            )}
            <button
              type="button"
              className="btn-admin-secondary"
              disabled={pending}
              onClick={onExcel}
            >
              {busy === "excel" ? "Building…" : "Download Excel with allotments"}
            </button>
          </div>

          <details className="admin-form-import-details">
            <summary>People in this file ({preview.people.length})</summary>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Preferences</th>
                    <th>MUN code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.people.map((person) => (
                    <tr key={person.email}>
                      <td className="mono">
                        {person.sheetRow}
                        {person.submissions > 1 && ` ×${person.submissions}`}
                      </td>
                      <td>{person.fullName}</td>
                      <td>{person.email}</td>
                      <td>
                        {[person.pref1, person.pref2]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td className="mono">{person.allotment?.code || "—"}</td>
                      <td>
                        {person.isNew
                          ? "New"
                          : person.allotment?.hasSeat
                            ? `${person.allotment.committee} — ${person.allotment.country} · ${person.allotment.status}`
                            : person.allotment?.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

/** All Google Form imports with MUN code and allotment — no upload needed. */
export function FormStudentsExcelButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportFormStudentsExcelAction();
      if (result.ok) downloadBase64(result.base64, result.filename);
      else setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn-admin-secondary"
        disabled={pending}
        onClick={onClick}
        title="Every student imported from the Google Form, with MUN code and allotment"
      >
        {pending ? "Building…" : "Form students (Excel)"}
      </button>
      {error && <span className="admin-toast admin-toast-error">{error}</span>}
    </>
  );
}

/** The same Google Form students as the Excel, as a printable allotment list. */
export function FormStudentsPdfButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await formStudentsPdfRowsAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        const { downloadFormStudentsPdf } = await import(
          "@/lib/form-import/students-pdf"
        );
        await downloadFormStudentsPdf(result.rows);
      } catch (err) {
        console.error(err);
        setError("Could not build the PDF.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn-admin-secondary"
        disabled={pending}
        onClick={onClick}
        title="Google Form students with MUN number, committee and allotment, as a PDF"
      >
        {pending ? "Building…" : "Form students (PDF)"}
      </button>
      {error && <span className="admin-toast admin-toast-error">{error}</span>}
    </>
  );
}

/** Every allotted delegate (any source) with all the data we hold on them. */
export function AllottedDelegatesExcelButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportAllottedDelegatesExcelAction();
      if (result.ok) downloadBase64(result.base64, result.filename);
      else setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn-admin-secondary"
        disabled={pending}
        onClick={onClick}
        title="Every delegate with a committee and country — contact, registration, preferences, allotment and attendance"
      >
        {pending ? "Building…" : "All allotted delegates (Excel)"}
      </button>
      {error && <span className="admin-toast admin-toast-error">{error}</span>}
    </>
  );
}

/** Every allotted delegate as a landscape PDF (Munique + System Summit). */
export function AllottedDelegatesPdfButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await allottedDelegatesPdfRowsAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        const { downloadAllottedDelegatesPdf } = await import(
          "@/lib/pdf/allotted-delegates"
        );
        await downloadAllottedDelegatesPdf(result.rows);
      } catch (err) {
        console.error(err);
        setError("Could not build the PDF.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn-admin-secondary"
        disabled={pending}
        onClick={onClick}
        title="Every delegate with a committee and country — MUN number, contact, institute and allotment, as a PDF"
      >
        {pending ? "Building…" : "All allotted delegates (PDF)"}
      </button>
      {error && <span className="admin-toast admin-toast-error">{error}</span>}
    </>
  );
}
