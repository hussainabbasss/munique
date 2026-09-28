import ExcelJS from "exceljs";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Excel stores wall-clock times without a zone; exceljs hands them back as UTC. */
function formatDate(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value !== "object") return String(value);
  if ("richText" in value) return value.richText.map((part) => part.text).join("");
  if ("hyperlink" in value) return cellToString(value.text as ExcelJS.CellValue);
  if ("formula" in value || "sharedFormula" in value) {
    return cellToString((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
  }
  if ("error" in value) return "";
  return String(value);
}

function csvEscape(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * First sheet of an .xlsx (the Form_Responses tab when present) as CSV text,
 * so Excel uploads go through the same parser as CSV ones.
 */
export async function excelToCsv(buffer: ArrayBuffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet =
    workbook.worksheets.find((ws) => /form.?responses/i.test(ws.name)) ??
    workbook.worksheets[0];
  if (!sheet) throw new Error("The Excel file has no sheets.");

  const width = sheet.getRow(1).cellCount;
  const lines: string[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let col = 1; col <= Math.max(width, row.cellCount); col++) {
      cells.push(csvEscape(cellToString(row.getCell(col).value).trim()));
    }
    lines.push(cells.join(","));
  });

  return lines.join("\n");
}
