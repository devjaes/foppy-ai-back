import PDFDocument from "pdfkit";
import { COLORS, DIMENSIONS, TABLE, checkPageBreak } from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function drawTable(
  doc: typeof PDFDocument,
  headers: string[],
  rows: string[][],
  columnWidths: number[]
) {
  const startX = DIMENSIONS.MARGIN;
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  const tableHeight = TABLE.HEADER_HEIGHT + rows.length * TABLE.ROW_HEIGHT;

  if (checkPageBreak(doc, tableHeight)) {
    addNewPage(doc);
  }

  let currentY = doc.y;

  doc.rect(startX, currentY, totalWidth, TABLE.HEADER_HEIGHT)
     .fillColor(TABLE.HEADER_COLOR)
     .fill();

  let x = startX;
  headers.forEach((header, i) => {
    doc.fontSize(10)
       .fillColor(COLORS.WHITE)
       .font("Helvetica-Bold")
       .text(
         header,
         x + TABLE.CELL_PADDING,
         currentY + TABLE.CELL_PADDING,
         {
           width: columnWidths[i] - 2 * TABLE.CELL_PADDING,
           align: "left",
         }
       );
    x += columnWidths[i];
  });

  currentY += TABLE.HEADER_HEIGHT;

  rows.forEach((row, rowIndex) => {
    const fillColor = rowIndex % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY;
    doc.rect(startX, currentY, totalWidth, TABLE.ROW_HEIGHT)
       .fillColor(fillColor)
       .fill();

    doc.rect(startX, currentY, totalWidth, TABLE.ROW_HEIGHT)
       .strokeColor(TABLE.BORDER_COLOR)
       .lineWidth(0.5)
       .stroke();

    x = startX;
    row.forEach((cell, colIndex) => {
      doc.fontSize(9)
         .fillColor(COLORS.TEXT)
         .font("Helvetica")
         .text(
           cell,
           x + TABLE.CELL_PADDING,
           currentY + TABLE.CELL_PADDING,
           {
             width: columnWidths[colIndex] - 2 * TABLE.CELL_PADDING,
             align: colIndex === 0 ? "left" : "right",
           }
         );
      x += columnWidths[colIndex];
    });

    currentY += TABLE.ROW_HEIGHT;
  });

  doc.y = currentY + 20;
}
