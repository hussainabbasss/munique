import type { AllottedPdfRow } from "@/lib/admin/actions/exports";
import { GOLD, MUTED, todayLabel } from "@/lib/pdf/brand";
import { downloadTablePdf } from "@/lib/pdf/table";

/** Landscape A4 of every allotted delegate — Munique and System Summit only. */
export async function downloadAllottedDelegatesPdf(rows: AllottedPdfRow[]) {
  const issued = rows.filter((row) => row.status === "Issued").length;
  const committees = new Set(rows.map((row) => row.committee)).size;

  await downloadTablePdf({
    title: "Allotted Delegates",
    subtitle: `${rows.length} delegates  ·  ${issued} issued  ·  ${committees} committees  ·  ${todayLabel()}`,
    filename: `munique-allotted-delegates-${new Date().toISOString().slice(0, 10)}.pdf`,
    coBrand: false,
    landscape: true,
    fontSize: 8,
    head: [
      "#",
      "MUN Number",
      "Delegate Name",
      "Committee",
      "Country",
      "Status",
      "Email",
      "Phone",
      "Institute",
    ],
    body: rows.map((row, index) => [
      String(index + 1),
      row.code || "—",
      row.name,
      row.committee,
      row.country,
      {
        content: row.status,
        styles: row.status === "Issued" ? {} : { textColor: MUTED },
      },
      row.email,
      row.phone,
      row.institute,
    ]),
    columnStyles: {
      0: { cellWidth: 9, halign: "right", textColor: MUTED, fontSize: 7 },
      1: { cellWidth: 26, fontStyle: "bold", textColor: GOLD },
      2: { fontStyle: "bold" },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 22 },
      6: { cellWidth: 56, fontSize: 7.5 },
      7: { cellWidth: 27 },
      8: { cellWidth: 32 },
    },
  });
}
