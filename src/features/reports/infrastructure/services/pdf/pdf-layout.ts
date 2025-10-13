import PDFDocument from "pdfkit";
import { COLORS, DIMENSIONS } from "./pdf-utils";

export function addModernHeader(doc: typeof PDFDocument, reportTitle: string) {
  doc
    .rect(0, 0, DIMENSIONS.PAGE_WIDTH, DIMENSIONS.HEADER_HEIGHT)
    .fillColor(COLORS.PRIMARY)
    .fill();

  doc
    .fontSize(24)
    .fillColor(COLORS.WHITE)
    .font("Helvetica-Bold")
    .text("FoppyAI", DIMENSIONS.MARGIN, 20, { align: "left" });

  doc
    .fontSize(10)
    .fillColor(COLORS.WHITE)
    .font("Helvetica")
    .text("Sistema de Gestión Financiera Personal", DIMENSIONS.MARGIN, 48);

  const date = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc
    .fontSize(10)
    .text(date, DIMENSIONS.PAGE_WIDTH - DIMENSIONS.MARGIN - 150, 25, {
      width: 150,
      align: "right",
    });

  doc
    .rect(0, DIMENSIONS.HEADER_HEIGHT - 5, DIMENSIONS.PAGE_WIDTH, 5)
    .fillColor(COLORS.SECONDARY)
    .fill();

  doc.y = DIMENSIONS.HEADER_HEIGHT + 20;
}

export function addModernFooter(
  doc: typeof PDFDocument,
  pageNum: number,
  totalPages: number
) {
  const footerY = DIMENSIONS.PAGE_HEIGHT - DIMENSIONS.FOOTER_HEIGHT;

  doc
    .rect(0, footerY, DIMENSIONS.PAGE_WIDTH, 2)
    .fillColor(COLORS.MEDIUM_GRAY)
    .fill();

  doc
    .fontSize(8)
    .fillColor(COLORS.TEXT)
    .font("Helvetica")
    .text(
      `© ${new Date().getFullYear()} FoppyAI. Todos los derechos reservados.`,
      DIMENSIONS.MARGIN,
      footerY + 15,
      { 
        width: DIMENSIONS.PAGE_WIDTH - DIMENSIONS.MARGIN * 2,
        align: "center"
      }
    );
}

export function addReportTitle(doc: typeof PDFDocument, title: string) {
  doc
    .fontSize(20)
    .fillColor(COLORS.PRIMARY)
    .font("Helvetica-Bold")
    .text(title, DIMENSIONS.MARGIN, doc.y, { align: "left" });
}

export function addNewPage(doc: typeof PDFDocument, reportTitle?: string) {
  doc.addPage();
  
  if (reportTitle) {
    addModernHeader(doc, reportTitle);
  } else {
    doc.y = DIMENSIONS.HEADER_HEIGHT + 20;
  }
}
