import PDFDocument from "pdfkit";
import { BudgetPerformanceReport } from "../../../domain/entities/report.entity";
import { addMetricCard, drawProgressBar } from "./pdf-components";
import { drawTable } from "./pdf-table";
import { formatCurrency } from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function formatBudgetPerformance(
  doc: typeof PDFDocument.prototype,
  data: BudgetPerformanceReport
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 30) / 4;

  addMetricCard(
    doc,
    "Total Budgets",
    `${data.totalBudgets}`,
    margin,
    doc.y,
    cardWidth,
    "#3b82f6"
  );
  addMetricCard(
    doc,
    "Exceeded",
    `${data.exceededCount}`,
    margin + cardWidth + 10,
    doc.y - 80,
    cardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Warning",
    `${data.warningCount}`,
    margin + (cardWidth + 10) * 2,
    doc.y - 80,
    cardWidth,
    "#f59e0b"
  );
  addMetricCard(
    doc,
    "Good",
    `${data.goodCount}`,
    margin + (cardWidth + 10) * 3,
    doc.y - 80,
    cardWidth,
    "#10b981"
  );

  doc.moveDown(1);

  if (data.budgets.length > 0) {
    doc.fontSize(14).fillColor("#1f2937").text("Budget Details", margin, doc.y);
    doc.moveDown(0.5);

    data.budgets.forEach((budget, index) => {
      if (doc.y > 650) addNewPage(doc);

      doc
        .fontSize(12)
        .fillColor("#1f2937")
        .text(`${budget.categoryName} (${budget.month})`, margin, doc.y);
      doc.moveDown(0.3);

      doc.fontSize(10).fillColor("#6b7280");
      doc.text(
        `Limit: ${formatCurrency(
          budget.limitAmount
        )} | Current: ${formatCurrency(budget.currentAmount)}`,
        margin,
        doc.y
      );
      doc.moveDown(0.5);

      const color =
        budget.status === "exceeded"
          ? "#ef4444"
          : budget.status === "warning"
          ? "#f59e0b"
          : "#10b981";

      drawProgressBar(doc, margin, doc.y, contentWidth, budget.percentage);
      doc.moveDown(1);

      if (index < data.budgets.length - 1) {
        doc.moveDown(0.5);
      }
    });

    if (doc.y > 600) addNewPage(doc);

    doc.fontSize(14).fillColor("#1f2937").text("Summary Table", margin, doc.y);
    doc.moveDown(0.5);

    const budgetData = data.budgets.map((b) => [
      b.categoryName,
      b.month,
      formatCurrency(b.limitAmount),
      formatCurrency(b.currentAmount),
      `${b.percentage.toFixed(1)}%`,
      b.status.toUpperCase(),
    ]);

    const columnWidths = [120, 80, 100, 100, 80, 80];
    drawTable(
      doc,
      ["Category", "Month", "Limit", "Current", "Used", "Status"],
      budgetData,
      columnWidths
    );
  }
}
