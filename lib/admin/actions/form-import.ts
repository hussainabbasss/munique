"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminRole, requireAdminUser } from "@/lib/admin/helpers";
import { generateRegistrationId } from "@/lib/registration/id";
import { excelToCsv } from "@/lib/form-import/excel";
import { finishSheet } from "@/lib/admin/excel-sheet";
import {
  buildCommitteeMatcher,
  dedupeByEmail,
  parseFormCsv,
  rowProblem,
  ROW_PROBLEM_LABEL,
  type FormRow,
  type ParsedForm,
} from "@/lib/form-import/parse";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type ExistingDelegate = {
  id: string;
  email: string;
  allotment_email_sent_at: string | null;
  registrations: {
    registration_id: string;
    payment_status: string;
  } | null;
  allotments:
    | AllotmentJoin
    | AllotmentJoin[]
    | null;
};

type AllotmentJoin = {
  country: string | null;
  status: string;
  committees: { name: string } | null;
};

export type PersonAllotment = {
  code: string;
  committee: string;
  country: string;
  status: string;
  /** Holds a seat (suggested or issued) — the merit engine will not touch them */
  hasSeat: boolean;
};

export type PreviewPerson = {
  email: string;
  fullName: string;
  sheetRow: number;
  submissions: number;
  isNew: boolean;
  allotment: PersonAllotment | null;
  pref1: string | null;
  pref2: string | null;
};

export type FormImportPreview = {
  totalRows: number;
  uniquePeople: number;
  duplicateRows: number;
  newCount: number;
  existingCount: number;
  alreadyAllottedCount: number;
  skipped: { sheetRow: number; name: string; reason: string }[];
  unmatchedCommittees: { value: string; count: number }[];
  people: PreviewPerson[];
};

type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

// ── Shared lookups ─────────────────────────────────────────────────────────

/** Every delegate with an email, keyed by lowercased email (paged past the 1000-row cap). */
async function fetchExistingByEmail(supabase: Supabase, emails: Set<string>) {
  const byEmail = new Map<string, ExistingDelegate>();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("delegates")
      .select(
        "id, email, allotment_email_sent_at, registrations(registration_id, payment_status), allotments(country, status, committees(name))",
      )
      .not("email", "is", null)
      .order("id")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);

    for (const row of (data ?? []) as unknown as ExistingDelegate[]) {
      const email = row.email.trim().toLowerCase();
      if (!emails.has(email)) continue;
      const current = byEmail.get(email);
      // Same email registered twice on the portal: prefer the one holding a seat
      if (!current || (!describe(current).hasSeat && describe(row).hasSeat)) {
        byEmail.set(email, row);
      }
    }

    if (!data || data.length < pageSize) break;
  }

  return byEmail;
}

function describe(delegate: ExistingDelegate): PersonAllotment {
  const reg = delegate.registrations;
  const allotment = Array.isArray(delegate.allotments)
    ? (delegate.allotments[0] ?? null)
    : delegate.allotments;
  const committee = allotment?.committees?.name ?? "";
  const country = allotment?.country ?? "";
  const hasSeat = Boolean(committee && country);

  let status: string;
  if (reg && reg.payment_status !== "confirmed") {
    status = `Registered on the portal — payment ${reg.payment_status}`;
  } else if (!allotment) {
    status = "Awaiting merit engine";
  } else if (!hasSeat) {
    status = "Needs EB — set allotment manually";
  } else if (allotment.status === "issued") {
    status = delegate.allotment_email_sent_at
      ? "Issued — email sent"
      : "Issued — email not sent";
  } else {
    status = "Suggested — not issued yet";
  }

  return {
    code: reg?.registration_id ?? "",
    committee: hasSeat ? committee : "",
    country: hasSeat ? country : "",
    status,
    hasSeat,
  };
}

async function fetchCommittees(supabase: Supabase) {
  const { data, error } = await supabase
    .from("committees")
    .select("id, name, slug")
    .eq("is_published", true)
    .order("display_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function buildPreview(
  supabase: Supabase,
  form: ParsedForm,
): Promise<{ preview: FormImportPreview; toCreate: FormRow[] }> {
  const { latest, submissions } = dedupeByEmail(form.rows);
  const [existing, committees] = await Promise.all([
    fetchExistingByEmail(supabase, new Set(latest.keys())),
    fetchCommittees(supabase),
  ]);
  const matchCommittee = buildCommitteeMatcher(committees);

  const unmatched = new Map<string, number>();
  const people: PreviewPerson[] = [];
  const toCreate: FormRow[] = [];

  for (const [email, row] of latest) {
    const found = existing.get(email);
    const pref1 = matchCommittee(row.pref1);
    const pref2 = matchCommittee(row.pref2);

    if (!found) {
      toCreate.push(row);
      for (const value of [row.pref1, row.pref2, row.pref3]) {
        if (value && !matchCommittee(value)) {
          unmatched.set(value, (unmatched.get(value) ?? 0) + 1);
        }
      }
    }

    people.push({
      email,
      fullName: row.fullName,
      sheetRow: row.sheetRow,
      submissions: submissions.get(email) ?? 1,
      isNew: !found,
      allotment: found ? describe(found) : null,
      pref1: pref1?.name ?? null,
      pref2: pref2?.name ?? null,
    });
  }

  const skipped = form.rows.flatMap((row) => {
    const problem = rowProblem(row);
    return problem
      ? [
          {
            sheetRow: row.sheetRow,
            name: row.fullName || row.email || "(blank)",
            reason: ROW_PROBLEM_LABEL[problem],
          },
        ]
      : [];
  });

  const validRows = form.rows.length - skipped.length;

  const preview: FormImportPreview = {
    totalRows: form.rows.length,
    uniquePeople: latest.size,
    duplicateRows: validRows - latest.size,
    newCount: toCreate.length,
    existingCount: latest.size - toCreate.length,
    alreadyAllottedCount: people.filter((p) => p.allotment?.hasSeat).length,
    skipped,
    unmatchedCommittees: [...unmatched].map(([value, count]) => ({
      value,
      count,
    })),
    people: people.sort((a, b) => a.sheetRow - b.sheetRow),
  };

  return { preview, toCreate };
}

// ── Actions ────────────────────────────────────────────────────────────────

/** Excel upload (base64 .xlsx) → CSV text for the preview / import / export actions. */
export async function convertExcelToCsvAction(
  base64: string,
): Promise<ActionResult<{ csvText: string }>> {
  await requireAdminUser();
  try {
    const bytes = Buffer.from(base64, "base64");
    const csvText = await excelToCsv(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    return { ok: true, csvText };
  } catch (error) {
    console.error("[form-import] excel conversion failed", error);
    return {
      ok: false,
      error:
        "Could not read that Excel file. Save it as .xlsx (not .xls) or upload the CSV instead.",
    };
  }
}

/** Dry run: what an import of this CSV would create and skip. Writes nothing. */
export async function previewFormImportAction(
  csvText: string,
): Promise<ActionResult<{ preview: FormImportPreview }>> {
  await requireAdminUser();
  const parsed = parseFormCsv(csvText);
  if (!parsed.ok) return parsed;

  try {
    const supabase = await createClient();
    const { preview } = await buildPreview(supabase, parsed.form);
    return { ok: true, preview };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Create confirmed registrations for everyone in the CSV not already in the
 * system (matched by email). People already registered — allotted or not —
 * are left untouched, so re-uploading the same sheet is safe. No registration
 * or payment email is sent; allotment emails go out from "Issue allotments".
 */
export async function importFormRegistrationsAction(
  csvText: string,
  allowUnmatchedCommittees: boolean,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireAdminRole();
  const parsed = parseFormCsv(csvText);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();

  let plan: Awaited<ReturnType<typeof buildPreview>>;
  let committees: Awaited<ReturnType<typeof fetchCommittees>>;
  try {
    [plan, committees] = await Promise.all([
      buildPreview(supabase, parsed.form),
      fetchCommittees(supabase),
    ]);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  const { preview, toCreate } = plan;

  if (preview.unmatchedCommittees.length > 0 && !allowUnmatchedCommittees) {
    return {
      ok: false,
      error:
        "Some committee preferences do not match a published committee. Tick the box to import with those preferences left blank, or fix the names first.",
    };
  }

  if (toCreate.length === 0) {
    return {
      ok: true,
      message: `Nothing new to import — all ${preview.uniquePeople} people are already registered.`,
    };
  }

  const matchCommittee = buildCommitteeMatcher(committees);
  const now = new Date().toISOString();
  let created = 0;
  const failures: string[] = [];

  for (const row of toCreate) {
    const pref1 = matchCommittee(row.pref1)?.id ?? null;
    const pref2 = matchCommittee(row.pref2)?.id ?? null;
    const pref3 = matchCommittee(row.pref3)?.id ?? null;

    let registrationId: string;
    try {
      registrationId = await generateRegistrationId(supabase);
    } catch (error) {
      failures.push(`${row.fullName}: ${(error as Error).message}`);
      continue;
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .insert({
        registration_id: registrationId,
        type: "delegate",
        portal: "delegate",
        source: "form_import",
        // No payment for form registrants — confirmed on import, no email
        payment_status: "confirmed",
        confirmed_at: now,
        confirmed_by: admin.id,
        fee_amount: 0,
        school: row.classSection,
        head_email: row.email,
        committee_pref_1: pref1,
        committee_pref_2: pref2,
        committee_pref_3: pref3,
        mun_experience: row.experience,
        brand_ambassador_name: row.reference || null,
        payment_proof_path: null,
      })
      .select("id")
      .single();

    if (registrationError || !registration) {
      failures.push(
        `${row.fullName}: ${registrationError?.message ?? "not saved"}`,
      );
      continue;
    }

    const { error: delegateError } = await supabase.from("delegates").insert({
      registration_id: registration.id,
      full_name: row.fullName,
      email: row.email,
      phone: row.phone || null,
      is_head_delegate: true,
      display_order: 0,
      committee_pref_1: pref1,
      committee_pref_2: pref2,
      committee_pref_3: pref3,
      mun_experience: row.experience,
    });

    if (delegateError) {
      await supabase.from("registrations").delete().eq("id", registration.id);
      failures.push(`${row.fullName}: ${delegateError.message}`);
      continue;
    }

    created++;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/allotments");

  const parts = [
    `Imported ${created} new ${created === 1 ? "person" : "people"}`,
    preview.existingCount > 0
      ? `skipped ${preview.existingCount} already registered`
      : null,
    preview.duplicateRows > 0
      ? `merged ${preview.duplicateRows} duplicate submission${preview.duplicateRows === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  if (failures.length) {
    console.error("[form-import] rows failed", failures);
    return {
      ok: false,
      error: `${parts.join(", ")}. ${failures.length} failed: ${failures.slice(0, 3).join("; ")}${failures.length > 3 ? "…" : ""}`,
    };
  }

  return {
    ok: true,
    message: `${parts.join(", ")}. Run the merit engine to allot them.`,
  };
}

/**
 * The uploaded sheet with MUN Code, Committee and Country beside each name,
 * plus an allotment status. Every original row is kept — duplicates show the
 * same person's allotment.
 */
export async function exportFormAllotmentsExcelAction(
  csvText: string,
): Promise<ActionResult<{ base64: string; filename: string }>> {
  await requireAdminUser();
  const parsed = parseFormCsv(csvText);
  if (!parsed.ok) return parsed;

  const { headers, rows } = parsed.form;
  const { latest, submissions } = dedupeByEmail(rows);

  let existing: Map<string, ExistingDelegate>;
  try {
    const supabase = await createClient();
    existing = await fetchExistingByEmail(supabase, new Set(latest.keys()));
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  const nameIndex = headers.findIndex((h) =>
    /^(full name|name)$/i.test(h.trim()),
  );
  const insertAt = nameIndex >= 0 ? nameIndex + 1 : headers.length;
  const added = ["MUN Code", "Committee", "Country"];
  const outHeaders = [
    ...headers.slice(0, insertAt),
    ...added,
    ...headers.slice(insertAt),
    "Allotment Status",
    "Note",
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Munique admin";
  const sheet = workbook.addWorksheet("Allotments", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.addRow(outHeaders);

  for (const row of rows) {
    const problem = rowProblem(row);
    const person = problem ? null : existing.get(row.email);
    const info = person ? describe(person) : null;
    const isLatest = !problem && latest.get(row.email) === row;
    const count = problem ? 0 : (submissions.get(row.email) ?? 1);

    let status: string;
    if (problem) status = ROW_PROBLEM_LABEL[problem];
    else if (!info) status = "Not imported yet";
    else status = info.status;

    let note = "";
    if (count > 1) {
      note = isLatest
        ? `Latest of ${count} submissions — this one was used`
        : `Duplicate — row ${latest.get(row.email)?.sheetRow} was used`;
    }

    const excelRow = sheet.addRow([
      ...row.cells.slice(0, insertAt),
      info?.code ?? "",
      info?.committee ?? "",
      info?.country ?? "",
      ...row.cells.slice(insertAt),
      status,
      note,
    ]);

    if (count > 1 && !isLatest) {
      excelRow.font = { color: { argb: "FF8A8A8A" } };
    }
  }

  finishSheet(sheet, outHeaders.length, [
    ...added.map((_, i) => insertAt + i + 1),
    outHeaders.length - 1,
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    ok: true,
    base64: Buffer.from(buffer).toString("base64"),
    filename: `munique-form-allotments-${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
}

type FormStudentRow = {
  registration_id: string;
  payment_status: string;
  school: string;
  brand_ambassador_name: string | null;
  created_at: string;
  delegates: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    mun_experience: string | null;
    allotment_email_sent_at: string | null;
    pref1: { name: string } | null;
    pref2: { name: string } | null;
    allotments: AllotmentJoin | AllotmentJoin[] | null;
  }[];
};

/** Every Google Form import with their allotment, A–Z by name. */
async function loadFormStudents(supabase: Supabase) {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      `registration_id, payment_status, school, brand_ambassador_name, created_at,
      delegates(
        id, full_name, email, phone, mun_experience, allotment_email_sent_at,
        pref1:committees!delegates_committee_pref_1_fkey(name),
        pref2:committees!delegates_committee_pref_2_fkey(name),
        allotments(country, status, committees(name))
      )`,
    )
    .eq("source", "form_import");

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as FormStudentRow[])
    .flatMap((reg) =>
      reg.delegates.map((delegate) => ({
        reg,
        delegate,
        info: describe({
          id: delegate.id,
          email: delegate.email ?? "",
          allotment_email_sent_at: delegate.allotment_email_sent_at,
          registrations: {
            registration_id: reg.registration_id,
            payment_status: reg.payment_status,
          },
          allotments: delegate.allotments,
        }),
      })),
    )
    .sort((a, b) => a.delegate.full_name.localeCompare(b.delegate.full_name));
}

/**
 * Every Google Form import with their MUN code and allotment — straight from
 * the database, no CSV needed.
 */
export async function exportFormStudentsExcelAction(): Promise<
  ActionResult<{ base64: string; filename: string; count: number }>
> {
  await requireAdminUser();
  const supabase = await createClient();

  let students: Awaited<ReturnType<typeof loadFormStudents>>;
  try {
    students = await loadFormStudents(supabase);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  if (!students.length) {
    return { ok: false, error: "No Google Form imports yet." };
  }

  const headers = [
    "MUN Code",
    "Full Name",
    "Committee",
    "Country",
    "Allotment Status",
    "Email",
    "Phone Number",
    "Class and Section",
    "Committee preference 1",
    "Committee preference 2",
    "Past MUN/Debating Experience",
    "Reference",
    "Imported",
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Munique admin";
  const sheet = workbook.addWorksheet("Form students", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.addRow(headers);

  for (const { reg, delegate, info } of students) {
    sheet.addRow([
      info.code,
      delegate.full_name,
      info.committee,
      info.country,
      info.status,
      delegate.email ?? "",
      delegate.phone ?? "",
      reg.school,
      delegate.pref1?.name ?? "",
      delegate.pref2?.name ?? "",
      delegate.mun_experience ?? "",
      reg.brand_ambassador_name ?? "",
      reg.created_at.slice(0, 10),
    ]);
  }

  finishSheet(sheet, headers.length, [1, 3, 4, 5]);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    ok: true,
    count: students.length,
    base64: Buffer.from(buffer).toString("base64"),
    filename: `munique-form-students-${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
}

export type FormStudentPdfRow = {
  code: string;
  name: string;
  committee: string;
  country: string;
};

/** The same Google Form students as the Excel, trimmed to what the PDF shows. */
export async function formStudentsPdfRowsAction(): Promise<
  ActionResult<{ rows: FormStudentPdfRow[] }>
> {
  await requireAdminUser();
  const supabase = await createClient();

  try {
    const students = await loadFormStudents(supabase);
    if (!students.length) {
      return { ok: false, error: "No Google Form imports yet." };
    }
    return {
      ok: true,
      rows: students.map(({ delegate, info }) => ({
        code: info.code,
        name: delegate.full_name,
        committee: info.committee,
        country: info.country,
      })),
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
