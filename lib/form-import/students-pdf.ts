import type { FormStudentPdfRow } from "@/lib/admin/actions/form-import";

// Seal colours (public/logo.svg)
const NAVY: [number, number, number] = [22, 35, 63];
const GOLD: [number, number, number] = [180, 146, 46];
const MUTED: [number, number, number] = [104, 110, 124];
const ZEBRA: [number, number, number] = [246, 244, 238];

const MARGIN = 14;

type LoadedImage = { data: string; width: number; height: number };

async function loadImage(src: string): Promise<LoadedImage> {
  const blob = await fetch(src).then((res) => {
    if (!res.ok) throw new Error(`Could not load ${src}`);
    return res.blob();
  });
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const { width, height } = await new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = data;
    },
  );
  return { data, width, height };
}

/**
 * A4 allotment list of the Google Form delegates: Munique × AMHSS on top,
 * System Summit at the side, then MUN number, name, committee and country.
 */
export async function downloadFormStudentsPdf(rows: FormStudentPdfRow[]) {
  const [{ jsPDF }, { autoTable }, seal, school, summit] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadImage("/logo.png"),
    loadImage("/amhss.png"),
    loadImage("/system-summit.png"),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const allotted = rows.filter((row) => row.committee && row.country).length;

  /** Munique seal × AMHSS crest, `size` tall; returns the lockup width. */
  const drawLockup = (x: number, y: number, size: number, measure = false) => {
    // The seal PNG has padding round the art; scale it up to match the crest
    const sealSize = size * 1.14;
    const crestW = (size * school.width) / school.height;
    const gap = size * 0.12;
    const cross = size * 0.14;
    const width = sealSize + gap * 2 + cross + crestW;
    if (measure) return width;

    const sealY = y - (sealSize - size) / 2;
    doc.addImage(seal.data, "PNG", x, sealY, sealSize, sealSize, "seal", "FAST");
    const cx = x + sealSize + gap;
    const cy = y + size / 2 - cross / 2;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(Math.max(0.3, size * 0.018));
    doc.setLineCap("round");
    doc.line(cx, cy, cx + cross, cy + cross);
    doc.line(cx + cross, cy, cx, cy + cross);
    doc.setLineCap("butt");
    doc.addImage(
      school.data,
      "PNG",
      cx + cross + gap,
      y,
      crestW,
      size,
      "amhss",
      "FAST",
    );
    return width;
  };

  // ── First-page masthead ──
  const lockupSize = 30;
  drawLockup(
    (pageW - drawLockup(0, 0, lockupSize, true)) / 2,
    10,
    lockupSize,
  );

  const summitW = 40;
  const summitH = (summitW * summit.height) / summit.width;
  const summitX = pageW - MARGIN - summitW;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text("POWERED BY", summitX + summitW / 2, 18, {
    align: "center",
    charSpace: 0.6,
  });
  doc.addImage(
    summit.data,
    "PNG",
    summitX,
    19,
    summitW,
    summitH,
    "summit",
    "FAST",
  );

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
  doc.text("Delegate Allotments", pageW / 2, 50, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `${rows.length} delegates  ·  ${allotted} allotted  ·  ${dateLabel}`,
    pageW / 2,
    56,
    { align: "center" },
  );

  // Gold double rule under the masthead
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 61, pageW - MARGIN, 61);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 62.2, pageW - MARGIN, 62.2);

  // ── Table ──
  autoTable(doc, {
    startY: 67,
    margin: { left: MARGIN, right: MARGIN, top: 24, bottom: 18 },
    head: [["#", "MUN Number", "Delegate Name", "Committee", "Allotment"]],
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
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: NAVY,
      cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 },
      valign: "middle",
      lineColor: [226, 222, 210],
      lineWidth: { bottom: 0.15 },
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
    columnStyles: {
      0: { cellWidth: 10, halign: "right", textColor: MUTED, fontSize: 8 },
      1: { cellWidth: 30, fontStyle: "bold", textColor: GOLD },
      2: { fontStyle: "bold" },
      3: { cellWidth: 46 },
      4: { cellWidth: 40 },
    },
    didDrawPage: (data) => {
      // Slim running header on continuation pages
      if (data.pageNumber > 1) {
        const lockupW = drawLockup(MARGIN, 7, 11);
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...NAVY);
        doc.text("Delegate Allotments", MARGIN + lockupW + 4, 14);
        const smallW = 24;
        doc.addImage(
          summit.data,
          "PNG",
          pageW - MARGIN - smallW,
          7,
          smallW,
          (smallW * summit.height) / summit.width,
          "summit",
          "FAST",
        );
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
    doc.setDrawColor(226, 222, 210);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, pageH - 12, pageW - MARGIN, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Munique 2026  ·  Delegate Allotments", MARGIN, pageH - 7.5);
    doc.text(`Page ${page} of ${pages}`, pageW - MARGIN, pageH - 7.5, {
      align: "right",
    });
  }

  doc.save(`munique-delegate-allotments-${today.toISOString().slice(0, 10)}.pdf`);
}
