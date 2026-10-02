"use server";

import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/helpers";
import { finishSheet } from "@/lib/admin/excel-sheet";
import { instituteLabel } from "@/lib/admin/institute";

type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

type Named = { name: string } | null;

type AllottedRow = {
  country: string;
  status: string;
  merit_score: number | null;
  is_override: boolean;
  override_note: string | null;
  ai_reasoning: string | null;
  issued_at: string | null;
  updated_at: string;
  committees: Named;
  delegates: {
    full_name: string;
    email: string | null;
    phone: string | null;
    is_head_delegate: boolean;
    mun_experience: string | null;
    allotment_email_sent_at: string | null;
    pref1: Named;
    pref2: Named;
    pref3: Named;
    delegate_attendance: { day: number; marked_at: string }[];
  } | null;
  registrations: {
    registration_id: string;
    type: string;
    portal: string;
    source: string;
    payment_status: string;
    fee_amount: number;
    school: string;
    head_email: string;
    brand_ambassador_name: string | null;
    confirmed_at: string | null;
    created_at: string;
  } | null;
};

const PAGE = 1000;

/** Day + time in Pakistan, or blank. */
function stamp(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Every seated allotment, by committee → country → name. */
async function loadAllotted(): Promise<ActionResult<{ seated: AllottedRow[] }>> {
  await requireAdminUser();
  const supabase = await createClient();

  const rows: AllottedRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("allotments")
      .select(
        `country, status, merit_score, is_override, override_note, ai_reasoning,
        issued_at, updated_at,
        committees(name),
        delegates(
          full_name, email, phone, is_head_delegate, mun_experience,
          allotment_email_sent_at,
          pref1:committees!delegates_committee_pref_1_fkey(name),
          pref2:committees!delegates_committee_pref_2_fkey(name),
          pref3:committees!delegates_committee_pref_3_fkey(name),
          delegate_attendance(day, marked_at)
        ),
        registrations(
          registration_id, type, portal, source, payment_status, fee_amount,
          school, head_email, brand_ambassador_name, confirmed_at, created_at
        )`,
      )
      .not("committee_id", "is", null)
      .not("country", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);

    if (error) return { ok: false, error: error.message };
    rows.push(...((data ?? []) as unknown as AllottedRow[]));
    if (!data || data.length < PAGE) break;
  }

  const seated = rows
    .filter((row) => row.committees?.name && row.country?.trim())
    .sort(
      (a, b) =>
        a.committees!.name.localeCompare(b.committees!.name) ||
        a.country.localeCompare(b.country) ||
        (a.delegates?.full_name ?? "").localeCompare(
          b.delegates?.full_name ?? "",
        ),
    );

  if (!seated.length) {
    return { ok: false, error: "No delegates are allotted yet." };
  }
  return { ok: true, seated };
}

export type AllottedPdfRow = {
  code: string;
  name: string;
  committee: string;
  country: string;
  status: string;
  email: string;
  phone: string;
  institute: string;
};

/** The allotted delegates trimmed to what fits on a landscape PDF. */
export async function allottedDelegatesPdfRowsAction(): Promise<
  ActionResult<{ rows: AllottedPdfRow[] }>
> {
  const loaded = await loadAllotted();
  if (!loaded.ok) return loaded;

  return {
    ok: true,
    rows: loaded.seated.map((row) => ({
      code: row.registrations?.registration_id ?? "",
      name: row.delegates?.full_name ?? "",
      committee: row.committees?.name ?? "",
      country: row.country,
      status: row.status === "issued" ? "Issued" : "Suggested",
      email: row.delegates?.email ?? "",
      phone: row.delegates?.phone ?? "",
      institute: instituteLabel(
        row.registrations?.source,
        row.registrations?.school,
      ),
    })),
  };
}

/**
 * Every delegate holding a seat (committee + country), suggested or issued,
 * with everything stored about them — person, registration, allotment and
 * gate attendance.
 */
export async function exportAllottedDelegatesExcelAction(): Promise<
  ActionResult<{ base64: string; filename: string; count: number }>
> {
  const loaded = await loadAllotted();
  if (!loaded.ok) return loaded;
  const { seated } = loaded;

  const headers = [
    "MUN Code",
    "Full Name",
    "Committee",
    "Country",
    "Allotment Status",
    "Issued At",
    "Allotment Email Sent",
    "Email",
    "Phone Number",
    "School / Class",
    "Head Delegate",
    "Committee preference 1",
    "Committee preference 2",
    "Committee preference 3",
    "Past MUN/Debating Experience",
    "Merit Score",
    "Manual Override",
    "Override Note",
    "Engine Reasoning",
    "Registration Type",
    "Source",
    "Payment Status",
    "Fee (PKR)",
    "Head / Registrant Email",
    "Reference",
    "Payment Confirmed At",
    "Registered At",
    "Day 1 Attendance",
    "Day 2 Attendance",
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Munique admin";
  const sheet = workbook.addWorksheet("Allotted delegates", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 2 }],
  });
  sheet.addRow(headers);

  for (const row of seated) {
    const person = row.delegates;
    const reg = row.registrations;
    const attended = (day: number) => {
      const mark = person?.delegate_attendance?.find((a) => a.day === day);
      return mark ? `Present — ${stamp(mark.marked_at)}` : "";
    };

    sheet.addRow([
      reg?.registration_id ?? "",
      person?.full_name ?? "",
      row.committees?.name ?? "",
      row.country,
      row.status === "issued" ? "Issued" : "Suggested — not issued",
      stamp(row.issued_at),
      stamp(person?.allotment_email_sent_at),
      person?.email ?? "",
      person?.phone ?? "",
      reg?.school ?? "",
      person?.is_head_delegate ? "Yes" : "No",
      person?.pref1?.name ?? "",
      person?.pref2?.name ?? "",
      person?.pref3?.name ?? "",
      person?.mun_experience ?? "",
      row.merit_score ?? "",
      row.is_override ? "Yes" : "No",
      row.override_note ?? "",
      row.ai_reasoning ?? "",
      reg?.type === "delegation" ? "Delegation" : "Individual",
      reg?.source === "form_import" ? "Google Form" : "Portal",
      reg?.payment_status ?? "",
      reg?.fee_amount ?? "",
      reg?.head_email ?? "",
      reg?.brand_ambassador_name ?? "",
      stamp(reg?.confirmed_at),
      stamp(reg?.created_at),
      attended(1),
      attended(2),
    ]);
  }

  finishSheet(sheet, headers.length, [1, 3, 4, 5]);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    ok: true,
    count: seated.length,
    base64: Buffer.from(buffer).toString("base64"),
    filename: `munique-allotted-delegates-${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
}
