import type ExcelJS from "exceljs";

/** Purple header, tinted allotment columns, fitted widths and a filter row. */
export function finishSheet(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
  tintedColumns: number[],
) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF5B2C83" },
  };
  header.height = 22;

  for (let r = 2; r <= sheet.rowCount; r++) {
    for (const col of tintedColumns) {
      sheet.getRow(r).getCell(col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3ECFA" },
      };
    }
  }

  sheet.columns.forEach((column) => {
    let width = 0;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length);
    });
    column.width = Math.min(Math.max(width + 2, 10), 50);
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columnCount },
  };
}
