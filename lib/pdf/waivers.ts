import type { jsPDF } from "jspdf";
import {
  GOLD,
  MUTED,
  NAVY,
  RULE,
  drawGoldRule,
  drawLockup,
  drawSummit,
  loadBrandImages,
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

const W = 148; // A5
const H = 210;
const M = 12;
const INNER = W - M * 2;

const TERMS = [
  "I will follow the Munique 2026 Code of Conduct strictly at all times during the conference.",
  "If I am found in violation of the Code of Conduct, I may be removed from the conference without prior notice.",
  "I will be held responsible for any damage I cause to the venue, its property or equipment, and will bear the cost of its repair or replacement.",
];

function label(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(...MUTED);
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.5 });
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

function drawWaiver(doc: jsPDF, images: BrandImages, row: WaiverRow) {
  // ── Masthead ──
  const lockupSize = 17;
  const lockupW = drawLockup(doc, images, 0, 0, lockupSize, true);
  drawLockup(doc, images, (W - lockupW) / 2, 9, lockupSize);

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text("Delegate Undertaking", W / 2, 37, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("MUNIQUE 2026  ·  MODEL UNITED NATIONS  ·  EDITION I", W / 2, 42, {
    align: "center",
    charSpace: 0.35,
  });
  drawGoldRule(doc, M, W - M, 46);

  // ── Delegate ──
  label(doc, "Delegate", M, 54);
  if (row.code) {
    // jsPDF's right-align ignores charSpace, so place the label by hand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    const tag = "MUN NUMBER";
    const tagW = doc.getTextWidth(tag) + 0.5 * (tag.length - 1);
    label(doc, tag, W - M - tagW, 54);
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text(row.code, W - M, 60.5, { align: "right" });
  }
  doc.setFont("times", "bold");
  doc.setTextColor(...NAVY);
  const codeRoom = row.code ? doc.getTextWidth(row.code) + 8 : 0;
  fitText(doc, row.name, M, 61, INNER - codeRoom - 30, 16, 10);

  // Wider right column — emails and institutes run long
  const gutter = 7;
  const leftW = 46;
  const rightX = M + leftW + gutter;
  const rightW = INNER - leftW - gutter;
  drawField(doc, "Phone number", row.phone, M, 70, leftW);
  drawField(doc, "Email", row.email, rightX, 70, rightW);
  drawField(doc, "Committee", row.committee, M, 84, leftW);
  drawField(doc, "Institute", row.institute, rightX, 84, rightW);

  // ── Undertaking ──
  label(doc, "Undertaking", M, 103);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text("I, the undersigned delegate, confirm and agree that:", M, 109);

  let y = 116;
  const textX = M + 7;
  TERMS.forEach((term, index) => {
    // Gold numbered disc
    doc.setFillColor(...GOLD);
    doc.circle(M + 2.2, y - 1.2, 2.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(String(index + 1), M + 2.2, y - 0.1, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize(term, W - M - textX);
    doc.text(lines, textX, y, { lineHeightFactor: 1.35 });
    y += lines.length * 4.1 + 3;
  });

  // ── CNIC boxes: 5 – 7 – 1 ──
  const cnicY = Math.max(y + 5, 152);
  label(doc, "CNIC number", M, cnicY);
  const box = 6.6;
  const dash = 4.4;
  let bx = M;
  const by = cnicY + 2.5;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  [5, 7, 1].forEach((count, group) => {
    for (let i = 0; i < count; i++) {
      doc.rect(bx, by, box, box + 1.4);
      bx += box;
    }
    if (group < 2) {
      doc.setDrawColor(...MUTED);
      doc.line(bx + 1.2, by + (box + 1.4) / 2, bx + dash - 1.2, by + (box + 1.4) / 2);
      doc.setDrawColor(...NAVY);
      bx += dash;
    }
  });

  // ── Signature and date ──
  const signY = by + box + 21;
  const dateW = 34;
  const signW = INNER - dateW - 10;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(M, signY, M + signW, signY);
  doc.line(W - M - dateW, signY, W - M, signY);
  label(doc, "Delegate signature", M, signY + 4);
  label(doc, "Date", W - M - dateW, signY + 4);

  // ── Footer ──
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(M, H - 17, W - M, H - 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(...MUTED);
  doc.text("POWERED BY", W / 2 - 1.5, H - 9.6, {
    align: "right",
    charSpace: 0.5,
  });
  drawSummit(doc, images, W / 2 + 0.5, H - 14.6, 20);
}

/** One A5 waiver per delegate, in the order given. */
export async function buildWaiversPdf(rows: WaiverRow[]) {
  const [{ jsPDF }, images] = await Promise.all([
    import("jspdf"),
    loadBrandImages(true),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  rows.forEach((row, index) => {
    if (index > 0) doc.addPage();
    drawWaiver(doc, images, row);
  });
  return doc;
}
