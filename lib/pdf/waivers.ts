import type { jsPDF } from "jspdf";
import {
  GOLD,
  MUTED,
  NAVY,
  RULE,
  drawGoldRule,
  drawLockup,
  drawPoweredBy,
  loadBrandImages,
  spacedText,
  type BrandImages,
} from "@/lib/pdf/brand";

export type WaiverRow = {
  code: string;
  name: string;
  phone: string;
  email: string;
  committee: string;
  institute: string;
};

/** One waiver per A5 page, or two A5 waivers side by side on landscape A4. */
export type WaiverLayout = "a5" | "a4-pair";

const W = 148; // A5
const H = 210;
const M = 12;
const INNER = W - M * 2;

const TERMS = [
  "I will follow the Munique 2026 Code of Conduct strictly at all times during the conference.",
  "If I am found in violation of the Code of Conduct, I may be removed from the conference without prior notice.",
  "I will be held responsible for any damage I cause to the venue, its property or equipment, and will bear the cost of its repair or replacement.",
];

function label(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  align: "left" | "right" = "left",
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(...MUTED);
  spacedText(doc, text.toUpperCase(), x, y, 0.5, align);
}

/** Writes `text` at `size`, shrinking it until it fits `maxWidth`. */
function fitText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  minSize: number,
) {
  let current = size;
  doc.setFontSize(current);
  while (current > minSize && doc.getTextWidth(text) > maxWidth) {
    current -= 0.5;
    doc.setFontSize(current);
  }
  const shown =
    doc.getTextWidth(text) > maxWidth
      ? doc.splitTextToSize(text, maxWidth)[0]
      : text;
  doc.text(shown, x, y);
}

function drawField(
  doc: jsPDF,
  title: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  label(doc, title, x, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  fitText(doc, value || "—", x, y + 5, width, 9.5, 6.5);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.line(x, y + 7.5, x + width, y + 7.5);
}

/** Draws one A5 waiver with its left edge at `ox` on the current page. */
function drawWaiver(
  doc: jsPDF,
  images: BrandImages,
  row: WaiverRow,
  ox: number,
) {
  const left = ox + M;
  const right = ox + W - M;
  const mid = ox + W / 2;

  // ── Compact masthead: seal, title, one spaced line ──
  const sealSize = 12;
  const sealW = drawLockup(doc, images, 0, 0, sealSize, true);
  drawLockup(doc, images, mid - sealW / 2, 8, sealSize);

  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("Delegate Undertaking", mid, 27, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(...MUTED);
  spacedText(doc, "MUNIQUE 2026  ·  MODEL UNITED NATIONS", mid, 31, 0.4, "center");
  drawGoldRule(doc, left, right, 34);

  // ── Delegate ──
  label(doc, "Delegate", left, 42);
  let codeRoom = 0;
  if (row.code) {
    label(doc, "MUN number", right, 42, "right");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text(row.code, right, 48.5, { align: "right" });
    codeRoom = doc.getTextWidth(row.code) + 6;
  }
  doc.setFont("times", "bold");
  doc.setTextColor(...NAVY);
  fitText(doc, row.name, left, 49, INNER - codeRoom, 15, 10);

  // Wider right column — emails and institutes run long
  const gutter = 7;
  const leftW = 46;
  const rightX = left + leftW + gutter;
  const rightW = INNER - leftW - gutter;
  drawField(doc, "Phone number", row.phone, left, 58, leftW);
  drawField(doc, "Email", row.email, rightX, 58, rightW);
  drawField(doc, "Committee", row.committee, left, 72, leftW);
  drawField(doc, "Institute", row.institute, rightX, 72, rightW);

  // ── Undertaking ──
  label(doc, "Undertaking", left, 92);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text("I, the undersigned delegate, confirm and agree that:", left, 98);

  let y = 106;
  const textX = left + 7;
  TERMS.forEach((term, index) => {
    // Gold numbered disc
    doc.setFillColor(...GOLD);
    doc.circle(left + 2.2, y - 1.2, 2.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(String(index + 1), left + 2.2, y - 0.1, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize(term, right - textX);
    doc.text(lines, textX, y, { lineHeightFactor: 1.35 });
    y += lines.length * 4.1 + 4;
  });

  // ── CNIC boxes: 5 – 7 – 1 ──
  const cnicY = Math.max(y + 6, 142);
  label(doc, "CNIC number", left, cnicY);
  const box = 6.6;
  const boxH = box + 1.4;
  const dash = 4.4;
  let bx = left;
  const by = cnicY + 2.5;
  doc.setLineWidth(0.3);
  [5, 7, 1].forEach((count, group) => {
    doc.setDrawColor(...NAVY);
    for (let i = 0; i < count; i++) {
      doc.rect(bx, by, box, boxH);
      bx += box;
    }
    if (group < 2) {
      doc.setDrawColor(...MUTED);
      doc.line(bx + 1.2, by + boxH / 2, bx + dash - 1.2, by + boxH / 2);
      bx += dash;
    }
  });

  // ── Signature and date ──
  const signY = by + boxH + 22;
  const dateW = 34;
  const signW = INNER - dateW - 10;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(left, signY, left + signW, signY);
  doc.line(right - dateW, signY, right, signY);
  label(doc, "Delegate signature", left, signY + 4);
  label(doc, "Date", right - dateW, signY + 4);

  // ── Footer ──
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(left, H - 17, right, H - 17);
  drawPoweredBy(doc, images, mid, H - 14.2, 20);
}

/** Every waiver in the order given, in the chosen layout. */
export async function buildWaiversPdf(
  rows: WaiverRow[],
  layout: WaiverLayout = "a5",
) {
  const [{ jsPDF }, images] = await Promise.all([
    import("jspdf"),
    loadBrandImages(false),
  ]);

  if (layout === "a5") {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    rows.forEach((row, index) => {
      if (index > 0) doc.addPage();
      drawWaiver(doc, images, row, 0);
    });
    return doc;
  }

  // Landscape A4 is exactly two A5 portraits side by side
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  for (let i = 0; i < rows.length; i += 2) {
    if (i > 0) doc.addPage();
    drawWaiver(doc, images, rows[i], 0);
    if (rows[i + 1]) drawWaiver(doc, images, rows[i + 1], W);

    // Dashed cut line down the middle
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(W, 6, W, H - 6);
    doc.setLineDashPattern([], 0);
  }
  return doc;
}
