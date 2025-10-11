import PDFDocument from "pdfkit";
import { COLORS, DIMENSIONS, SPACING, checkPageBreak } from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function addSectionTitle(doc: typeof PDFDocument, title: string) {
  if (checkPageBreak(doc, 40)) {
    addNewPage(doc);
  }

  doc
    .fontSize(16)
    .fillColor(COLORS.SECONDARY)
    .font("Helvetica-Bold")
    .text(title, DIMENSIONS.MARGIN, doc.y);

  doc.moveDown(0.5);
  doc.rect(DIMENSIONS.MARGIN, doc.y, 150, 2).fillColor(COLORS.SECONDARY).fill();
  doc.moveDown(1);
}

export function addMetricCard(
  doc: typeof PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number = 120,
  color: string = COLORS.SECONDARY
) {
  const height = 60;

  doc.rect(x, y, width, height).fillColor(COLORS.LIGHT_GRAY).fill();

  doc.rect(x, y, width, 4).fillColor(color).fill();

  doc
    .fontSize(9)
    .fillColor(COLORS.TEXT)
    .font("Helvetica")
    .text(label, x + 10, y + 15, { width: width - 20, align: "center" });

  doc
    .fontSize(16)
    .fillColor(color)
    .font("Helvetica-Bold")
    .text(value, x + 10, y + 32, { width: width - 20, align: "center" });
}

export function drawProgressBar(
  doc: typeof PDFDocument,
  x: number,
  y: number,
  width: number,
  progress: number
) {
  const height = 12;
  const validProgress = Math.min(Math.max(progress, 0), 100);

  doc.rect(x, y, width, height).fillColor(COLORS.LIGHT_GRAY).fill();

  if (validProgress > 0) {
    const progressWidth = (width * validProgress) / 100;
    const color =
      validProgress >= 100
        ? COLORS.ACCENT
        : validProgress >= 70
        ? COLORS.WARNING
        : COLORS.SECONDARY;

    doc.rect(x, y, progressWidth, height).fillColor(color).fill();
  }

  doc
    .rect(x, y, width, height)
    .strokeColor(COLORS.MEDIUM_GRAY)
    .lineWidth(1)
    .stroke();

  doc
    .fontSize(8)
    .fillColor(COLORS.TEXT)
    .font("Helvetica-Bold")
    .text(`${validProgress.toFixed(1)}%`, x, y + 2, {
      width: width,
      align: "center",
    });
}
