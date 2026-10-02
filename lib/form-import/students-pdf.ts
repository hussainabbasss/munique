import type { FormStudentPdfRow } from "@/lib/admin/actions/form-import";
import { GOLD, MUTED, todayLabel } from "@/lib/pdf/brand";
import { downloadTablePdf } from "@/lib/pdf/table";

/**
 * A4 allotment list of the Google Form delegates: Munique × AMHSS on top,
 * System Summit at the side, then MUN number, name, committee and country.
 */
export async function downloadFormStudentsPdf(rows: FormStudentPdfRow[]) {
  const allotted = rows.filter((row) => row.committee && row.country).length;

  await downloadTablePdf({
    title: "Delegate Allotments",
    subtitle: `${rows.length} delegates  ·  ${allotted} allotted  ·  ${todayLabel()}`,
    filename: `munique-delegate-allotments-${new Date().toISOString().slice(0, 10)}.pdf`,
    coBrand: true,
    head: ["#", "MUN Number", "Delegate Name", "Committee", "Allotment"],
    body: rows.map((row, index) => {
      const seated = Boolean(row.committee && row.country);
      return [
        String(index + 1),
        row.code || "—",
        row.name,
        ...(seated
          ? [row.committee, row.country]
          : [
              {
                content: "Awaiting allotment",
                colSpan: 2,
                styles: { textColor: MUTED, fontStyle: "italic" as const },
              },
            ]),
      ];
    }),
    columnStyles: {
      0: { cellWidth: 10, halign: "right", textColor: MUTED, fontSize: 8 },
      1: { cellWidth: 30, fontStyle: "bold", textColor: GOLD },
      2: { fontStyle: "bold" },
      3: { cellWidth: 46 },
      4: { cellWidth: 40 },
    },
  });
}
