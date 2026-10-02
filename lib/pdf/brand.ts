import type { jsPDF } from "jspdf";

// Seal colours (public/logo.svg)
export const NAVY: [number, number, number] = [22, 35, 63];
export const GOLD: [number, number, number] = [180, 146, 46];
export const MUTED: [number, number, number] = [104, 110, 124];
export const ZEBRA: [number, number, number] = [246, 244, 238];
export const RULE: [number, number, number] = [226, 222, 210];

export type LoadedImage = { data: string; width: number; height: number };

export async function loadImage(src: string): Promise<LoadedImage> {
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

export type BrandImages = {
  seal: LoadedImage;
  /** AMHSS crest — present only on co-branded documents */
  school: LoadedImage | null;
  summit: LoadedImage;
};

export async function loadBrandImages(coBrand: boolean): Promise<BrandImages> {
  const [seal, school, summit] = await Promise.all([
    loadImage("/logo.png"),
    coBrand ? loadImage("/amhss.png") : Promise.resolve(null),
    loadImage("/system-summit.png"),
  ]);
  return { seal, school, summit };
}

/**
 * Munique seal, or Munique seal × AMHSS crest when the school image is
 * loaded, `size` mm tall. Returns the width; `measure` skips drawing.
 */
export function drawLockup(
  doc: jsPDF,
  images: BrandImages,
  x: number,
  y: number,
  size: number,
  measure = false,
) {
  // The seal PNG has padding round the art; scale it up to match the crest
  const sealSize = size * 1.14;
  const { school } = images;
  const crestW = school ? (size * school.width) / school.height : 0;
  const gap = size * 0.12;
  const cross = size * 0.14;
  const width = school ? sealSize + gap * 2 + cross + crestW : sealSize;
  if (measure) return width;

  const sealY = y - (sealSize - size) / 2;
  doc.addImage(
    images.seal.data,
    "PNG",
    x,
    sealY,
    sealSize,
    sealSize,
    "seal",
    "FAST",
  );
  if (!school) return width;

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
}

/** System Summit logo `width` mm wide; returns its height. */
export function drawSummit(
  doc: jsPDF,
  images: BrandImages,
  x: number,
  y: number,
  width: number,
) {
  const { summit } = images;
  const height = (width * summit.height) / summit.width;
  doc.addImage(summit.data, "PNG", x, y, width, height, "summit", "FAST");
  return height;
}

/** Gold double rule across the page. */
export function drawGoldRule(doc: jsPDF, x1: number, x2: number, y: number) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(x1, y, x2, y);
  doc.setLineWidth(0.2);
  doc.line(x1, y + 1.2, x2, y + 1.2);
}

export function todayLabel(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
