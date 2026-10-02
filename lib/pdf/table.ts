import type { CellInput, Styles } from "jspdf-autotable";
import {
  GOLD,
  MUTED,
  NAVY,
  RULE,
  ZEBRA,
  drawGoldRule,
  drawLockup,
  drawSummit,
  loadBrandImages,
} from "@/lib/pdf/brand";

const MARGIN = 14;

export type TablePdf = {
  title: string;
  /** Line under the title, e.g. counts and date */
  subtitle: string;
  filename: string;
  /** Munique × AMHSS lockup instead of the Munique seal alone */
  coBrand: boolean;
  landscape?: boolean;
  head: string[];
  body: CellInput[][];
  columnStyles?: Record<number, Partial<Styles>>;
  fontSize?: number;
};

/**
 * A4 branded table: seal (or co-brand lockup) on top, System Summit at the
 * side, gold rule, navy-header table, slim header on continuation pages and
 * "Page x of y" footers.
 */
export async function downloadTablePdf(spec: TablePdf) {
  const [{ jsPDF }, { autoTable }, images] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadBrandImages(spec.coBrand),
  ]);

  const doc = new jsPDF({
    orientation: spec.landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── First-page masthead ──
  const lockupSize = 30;
  const lockupW = drawLockup(doc, images, 0, 0, lockupSize, true);
  drawLockup(doc, images, (pageW - lockupW) / 2, 10, lockupSize);

  const summitW = 40;
  const summitX = pageW - MARGIN - summitW;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text("POWERED BY", summitX + summitW / 2, 18, {
    align: "center",
    charSpace: 0.6,
  });
  drawSummit(doc, images, summitX, 19, summitW);

  doc.setFontSize(7.5);
  doc.text("EDITION I", MARGIN, 18, { charSpace: 0.6 });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("Munique 2026", MARGIN, 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Model United Nations", MARGIN, 27.5);

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text(spec.title, pageW / 2, 50, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(spec.subtitle, pageW / 2, 56, { align: "center" });

  drawGoldRule(doc, MARGIN, pageW - MARGIN, 61);

  // ── Table ──
  autoTable(doc, {
    startY: 67,
    margin: { left: MARGIN, right: MARGIN, top: 24, bottom: 18 },
    head: [spec.head],
    body: spec.body,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: spec.fontSize ?? 9,
      textColor: NAVY,
      cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 },
      valign: "middle",
      lineColor: RULE,
      lineWidth: { bottom: 0.15 },
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 3.2, bottom: 3.2, left: 3, right: 3 },
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: spec.columnStyles,
    didDrawPage: (data) => {
      // Slim running header on continuation pages
      if (data.pageNumber > 1) {
        const smallW = drawLockup(doc, images, MARGIN, 7, 11);
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...NAVY);
        doc.text(spec.title, MARGIN + smallW + 4, 14);
        drawSummit(doc, images, pageW - MARGIN - 24, 7, 24);
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, 20, pageW - MARGIN, 20);
      }
    },
  });

  // Footer once the page count is known
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, pageH - 12, pageW - MARGIN, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Munique 2026  ·  ${spec.title}`, MARGIN, pageH - 7.5);
    doc.text(`Page ${page} of ${pages}`, pageW - MARGIN, pageH - 7.5, {
      align: "right",
    });
  }

  doc.save(spec.filename);
}
