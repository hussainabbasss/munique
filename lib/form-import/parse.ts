/**
 * Google Form CSV → people to import. Pure functions only — the server actions
 * in lib/admin/actions/form-import.ts do the database work.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_FORM_ROWS = 2000;

export type FormField =
  | "timestamp"
  | "fullName"
  | "email"
  | "phone"
  | "experience"
  | "classSection"
  | "pref1"
  | "pref2"
  | "pref3"
  | "reference";

export type FormRow = {
  /** 1-based line in the sheet, counting the header as row 1 */
  sheetRow: number;
  /** Original cells, in the order of `headers` */
  cells: string[];
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  classSection: string;
  pref1: string;
  pref2: string;
  pref3: string;
  reference: string;
};

export type ParsedForm = {
  headers: string[];
  rows: FormRow[];
};

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully blank lines (Sheets pads exports with them)
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function fieldForHeader(header: string): FormField | null {
  const h = normalizeHeader(header);
  if (h === "timestamp") return "timestamp";
  if (h === "full name" || h === "name") return "fullName";
  if (h === "email" || h === "email address") return "email";
  if (h.startsWith("phone") || h.includes("contact number")) return "phone";
  if (h.includes("experience")) return "experience";
  if (h.startsWith("class")) return "classSection";
  if (/committee preference 1|1st committee|committee 1/.test(h)) return "pref1";
  if (/committee preference 2|2nd committee|committee 2/.test(h)) return "pref2";
  if (/committee preference 3|3rd committee|committee 3/.test(h)) return "pref3";
  if (h.startsWith("reference") || h.startsWith("referred")) return "reference";
  return null;
}

export function parseFormCsv(
  text: string,
): { ok: true; form: ParsedForm } | { ok: false; error: string } {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { ok: false, error: "The CSV has no responses below the header row." };
  }

  const headers = table[0].map((cell) => cell.trim());
  const columnOf = new Map<FormField, number>();
  headers.forEach((header, index) => {
    const field = fieldForHeader(header);
    // First matching column wins — later look-alikes are left as-is
    if (field && !columnOf.has(field)) columnOf.set(field, index);
  });

  const missing = (["fullName", "email"] as const).filter(
    (field) => !columnOf.has(field),
  );
  if (missing.length) {
    return {
      ok: false,
      error: `Missing column${missing.length > 1 ? "s" : ""}: ${missing
        .map((f) => (f === "fullName" ? "Full Name" : "Email"))
        .join(", ")}. Download the Form_Responses tab as CSV and upload it unchanged.`,
    };
  }

  const body = table.slice(1);
  if (body.length > MAX_FORM_ROWS) {
    return {
      ok: false,
      error: `The CSV has ${body.length} rows — the limit is ${MAX_FORM_ROWS}.`,
    };
  }

  const read = (cells: string[], field: FormField) => {
    const index = columnOf.get(field);
    return index === undefined ? "" : (cells[index] ?? "").trim();
  };

  const rows = body.map((cells, index) => ({
    sheetRow: index + 2,
    cells: headers.map((_, col) => cells[col] ?? ""),
    timestamp: read(cells, "timestamp"),
    fullName: read(cells, "fullName").replace(/\s+/g, " "),
    email: read(cells, "email").toLowerCase(),
    phone: read(cells, "phone"),
    experience: read(cells, "experience"),
    classSection: read(cells, "classSection"),
    pref1: read(cells, "pref1"),
    pref2: read(cells, "pref2"),
    pref3: read(cells, "pref3"),
    reference: read(cells, "reference"),
  }));

  return { ok: true, form: { headers, rows } };
}

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email);
}

export type RowProblem = "missing_name" | "invalid_email";

export function rowProblem(row: FormRow): RowProblem | null {
  if (!row.fullName) return "missing_name";
  if (!isValidEmail(row.email)) return "invalid_email";
  return null;
}

export const ROW_PROBLEM_LABEL: Record<RowProblem, string> = {
  missing_name: "Skipped — no name",
  invalid_email: "Skipped — no valid email",
};

/**
 * One person per email. Google Forms appends responses in submission order,
 * so the last row for an email is the latest submission and wins.
 */
export function dedupeByEmail(rows: FormRow[]) {
  const latest = new Map<string, FormRow>();
  const submissions = new Map<string, number>();

  for (const row of rows) {
    if (rowProblem(row)) continue;
    latest.set(row.email, row);
    submissions.set(row.email, (submissions.get(row.email) ?? 0) + 1);
  }

  return { latest, submissions };
}

// ── Committee names from the form → committee ids ──────────────────────────

type CommitteeRef = { id: string; name: string; slug: string };

function compact(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function initials(value: string) {
  return value
    .replace(/\(.*?\)/g, " ")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toLowerCase();
}

/** Every way a committee might be written: full name, slug, "(UNSC)", initials. */
function committeeKeys(committee: CommitteeRef) {
  const keys = new Set<string>([
    compact(committee.name),
    compact(committee.slug),
    compact(committee.name.replace(/\(.*?\)/g, "")),
  ]);
  for (const match of committee.name.matchAll(/\(([^)]+)\)/g)) {
    keys.add(compact(match[1]));
  }
  const abbreviation = initials(committee.name);
  if (abbreviation.length >= 2) keys.add(abbreviation);
  keys.delete("");
  return keys;
}

function valueKeys(value: string) {
  const keys = new Set<string>([
    compact(value),
    compact(value.replace(/\(.*?\)/g, "")),
  ]);
  for (const match of value.matchAll(/\(([^)]+)\)/g)) {
    keys.add(compact(match[1]));
  }
  // "UNSC - United Nations Security Council"
  for (const part of value.split(/\s[-–—:|]\s/)) keys.add(compact(part));
  keys.delete("");
  return keys;
}

export function buildCommitteeMatcher(committees: CommitteeRef[]) {
  const keyed = committees.map((committee) => ({
    committee,
    keys: committeeKeys(committee),
  }));

  return function matchCommittee(value: string): CommitteeRef | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const wanted = valueKeys(trimmed);
    const exact = keyed.filter(({ keys }) =>
      [...wanted].some((key) => keys.has(key)),
    );
    if (exact.length === 1) return exact[0].committee;
    if (exact.length > 1) return null;

    // Loose: one name contains the other ("Security Council" ↔ "UN Security Council")
    const full = compact(trimmed);
    if (full.length < 4) return null;
    const loose = keyed.filter(({ committee }) => {
      const name = compact(committee.name);
      return name.length >= 4 && (name.includes(full) || full.includes(name));
    });
    return loose.length === 1 ? loose[0].committee : null;
  };
}
