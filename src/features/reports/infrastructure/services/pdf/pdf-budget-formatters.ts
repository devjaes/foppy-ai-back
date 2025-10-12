import PDFDocument from "pdfkit";
import { BudgetPerformanceReport } from "../../../domain/entities/report.entity";
import {
  addSectionTitle,
  addMetricCard,
  drawProgressBar,
} from "./pdf-components";
import { drawTable } from "./pdf-table";
import {
  formatCurrency,
  COLORS,
  DIMENSIONS,
  checkPageBreak,
} from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function formatBudgetPerformance(
  doc: typeof PDFDocument.prototype,
  data: BudgetPerformanceReport,
  reportTitle: string = "Rendimiento de Presupuestos"
): void {
  if (!data) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Rendimiento de Presupuestos", reportTitle);

  const cardY = doc.y;
  const cardWidth = 110;
  const cardSpacing = 15;

  addMetricCard(
    doc,
    "Total Presupuestos",
    data.totalBudgets?.toString() || "0",
    DIMENSIONS.MARGIN,
    cardY,
    cardWidth,
    COLORS.SECONDARY
  );
  addMetricCard(
    doc,
    "Excedidos",
    data.exceededCount?.toString() || "0",
    DIMENSIONS.MARGIN + cardWidth + cardSpacing,
    cardY,
    cardWidth,
    COLORS.DANGER
  );
  addMetricCard(
    doc,
    "Advertencia",
    data.warningCount?.toString() || "0",
    DIMENSIONS.MARGIN + 2 * (cardWidth + cardSpacing),
    cardY,
    cardWidth,
    COLORS.WARNING
  );
  addMetricCard(
    doc,
    "Buenos",
    data.goodCount?.toString() || "0",
    DIMENSIONS.MARGIN + 3 * (cardWidth + cardSpacing),
    cardY,
    cardWidth,
    COLORS.ACCENT
  );

  doc.y = cardY + 70;
  doc.moveDown(1);

  if (data.budgets && data.budgets.length > 0) {
    addSectionTitle(doc, "Detalle de Presupuestos", reportTitle);

    data.budgets.forEach((budget, index) => {
      if (checkPageBreak(doc, 120)) {
        addNewPage(doc, reportTitle);
      }

      if (index > 0) {
        doc.moveDown(1);
      }

      const statusColor =
        budget.status === "exceeded"
          ? COLORS.DANGER
          : budget.status === "warning"
          ? COLORS.WARNING
          : COLORS.ACCENT;
      const statusLabel =
        budget.status === "exceeded"
          ? "EXCEDIDO"
          : budget.status === "warning"
          ? "ADVERTENCIA"
          : "BUENO";

      doc
        .fontSize(13)
        .fillColor(COLORS.PRIMARY)
        .font("Helvetica-Bold")
        .text(
          budget.categoryName || "Sin categoría",
          DIMENSIONS.MARGIN,
          doc.y,
          { continued: true }
        )
        .fontSize(9)
        .fillColor(statusColor)
        .text(` [${statusLabel}]`, { continued: false });

      doc.moveDown(0.5);

      const col1X = DIMENSIONS.MARGIN;
      const col2X = DIMENSIONS.MARGIN + 250;
      const rowY = doc.y;

      doc
        .fontSize(10)
        .fillColor(COLORS.TEXT)
        .font("Helvetica")
        .text(`Límite: ${formatCurrency(budget.limitAmount || 0)}`, col1X, rowY)
        .text(`Mes: ${budget.month || "N/A"}`, col2X, rowY);

      doc.moveDown(0.8);
      const row2Y = doc.y;

      doc
        .text(
          `Actual: ${formatCurrency(budget.currentAmount || 0)}`,
          col1X,
          row2Y
        )
        .text(`Uso: ${(budget.percentage || 0).toFixed(1)}%`, col2X, row2Y);

      doc.moveDown(1);

      drawProgressBar(
        doc,
        DIMENSIONS.MARGIN,
        doc.y,
        450,
        budget.percentage || 0
      );

      doc.moveDown(1.5);
    });

    if (checkPageBreak(doc, 200)) {
      addNewPage(doc, reportTitle);
    }

    addSectionTitle(doc, "Resumen en Tabla", reportTitle);

    const budgetData = data.budgets.map((b) => [
      b.categoryName || "Sin categoría",
      b.month || "N/A",
      formatCurrency(b.limitAmount || 0),
      formatCurrency(b.currentAmount || 0),
      `${(b.percentage || 0).toFixed(1)}%`,
      b.status === "exceeded"
        ? "EXCEDIDO"
        : b.status === "warning"
        ? "ADVERTENCIA"
        : "BUENO",
    ]);

    const columnWidths = [140, 80, 100, 100, 80, 100];
    drawTable(
      doc,
      ["Categoría", "Mes", "Límite", "Actual", "Uso", "Estado"],
      budgetData,
      columnWidths,
      reportTitle
    );
  } else {
    doc
      .fontSize(11)
      .fillColor(COLORS.TEXT)
      .text(
        "No se encontraron presupuestos para mostrar",
        DIMENSIONS.MARGIN,
        doc.y
      );
  }
}
