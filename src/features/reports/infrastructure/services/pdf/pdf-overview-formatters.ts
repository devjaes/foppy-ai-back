import PDFDocument from "pdfkit";
import { FinancialOverviewReport } from "../../../domain/entities/report.entity";
import { addMetricCard, drawProgressBar } from "./pdf-components";
import { drawTable } from "./pdf-table";
import { drawBarChart, drawPieChart } from "./pdf-charts";
import { formatCurrency, formatDate } from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function formatFinancialOverview(
  doc: typeof PDFDocument.prototype,
  data: FinancialOverviewReport
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 30) / 4;

  doc
    .fontSize(12)
    .fillColor("#6b7280")
    .text(
      `Period: ${formatDate(data.period.startDate)} - ${formatDate(
        data.period.endDate
      )}`,
      margin,
      doc.y
    );
  doc.moveDown(1);

  doc
    .fontSize(14)
    .fillColor("#1f2937")
    .text("Financial Summary", margin, doc.y);
  doc.moveDown(0.5);

  addMetricCard(
    doc,
    "Total Income",
    formatCurrency(data.summary.totalIncome),
    margin,
    doc.y,
    cardWidth,
    "#10b981"
  );
  addMetricCard(
    doc,
    "Total Expense",
    formatCurrency(data.summary.totalExpense),
    margin + cardWidth + 10,
    doc.y - 80,
    cardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Net Balance",
    formatCurrency(data.summary.netBalance),
    margin + (cardWidth + 10) * 2,
    doc.y - 80,
    cardWidth,
    "#3b82f6"
  );
  addMetricCard(
    doc,
    "Savings Rate",
    `${data.summary.savingsRate.toFixed(1)}%`,
    margin + (cardWidth + 10) * 3,
    doc.y - 80,
    cardWidth,
    "#8b5cf6"
  );

  doc.moveDown(1);

  if (data.summary.totalIncome > 0 || data.summary.totalExpense > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Income vs Expense", margin, doc.y);
    doc.moveDown(0.5);

    const chartData = [
      { label: "Income", value: data.summary.totalIncome, color: "#10b981" },
      { label: "Expense", value: data.summary.totalExpense, color: "#ef4444" },
    ];

    drawBarChart(doc, chartData, "Income vs Expense", contentWidth, 150);
    doc.moveDown(2);
  }

  if (doc.y > 600) addNewPage(doc);

  doc.fontSize(14).fillColor("#1f2937").text("Goals Overview", margin, doc.y);
  doc.moveDown(0.5);

  const goalCardWidth = (contentWidth - 20) / 3;
  addMetricCard(
    doc,
    "Total Goals",
    `${data.goals.total}`,
    margin,
    doc.y,
    goalCardWidth,
    "#3b82f6"
  );
  addMetricCard(
    doc,
    "Completed",
    `${data.goals.completed}`,
    margin + goalCardWidth + 10,
    doc.y - 70,
    goalCardWidth,
    "#10b981"
  );
  addMetricCard(
    doc,
    "In Progress",
    `${data.goals.inProgress}`,
    margin + (goalCardWidth + 10) * 2,
    doc.y - 70,
    goalCardWidth,
    "#f59e0b"
  );

  doc.moveDown(0.8);

  doc
    .fontSize(10)
    .fillColor("#6b7280")
    .text(
      `Saved: ${formatCurrency(
        data.goals.totalSaved
      )} / Target: ${formatCurrency(data.goals.totalTarget)}`,
      margin,
      doc.y
    );
  doc.moveDown(0.5);

  drawProgressBar(doc, margin, doc.y, contentWidth, data.goals.overallProgress);
  doc.moveDown(1);

  doc.fontSize(14).fillColor("#1f2937").text("Budgets Overview", margin, doc.y);
  doc.moveDown(0.5);

  const budgetCardWidth = (contentWidth - 20) / 3;
  addMetricCard(
    doc,
    "Total Budgets",
    `${data.budgets.total}`,
    margin,
    doc.y,
    budgetCardWidth,
    "#3b82f6"
  );
  addMetricCard(
    doc,
    "Exceeded",
    `${data.budgets.exceeded}`,
    margin + budgetCardWidth + 10,
    doc.y - 70,
    budgetCardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Avg Usage",
    `${data.budgets.averageUtilization.toFixed(1)}%`,
    margin + (budgetCardWidth + 10) * 2,
    doc.y - 70,
    budgetCardWidth,
    "#f59e0b"
  );

  doc.moveDown(1);

  if (doc.y > 600) addNewPage(doc);

  if (data.topCategories.expenses.length > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Top Expense Categories", margin, doc.y);
    doc.moveDown(0.5);

    const expensePieData = data.topCategories.expenses.map((cat) => ({
      label: cat.name,
      value: cat.amount,
      percentage: cat.percentage,
    }));

    drawPieChart(doc, expensePieData, "Top Expense Categories", 180);
    doc.moveDown(2);
  }

  if (doc.y > 600) addNewPage(doc);

  if (data.topCategories.expenses.length > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Top Expenses Breakdown", margin, doc.y);
    doc.moveDown(0.5);

    const expenseData = data.topCategories.expenses.map((cat) => [
      cat.name,
      formatCurrency(cat.amount),
      `${cat.percentage.toFixed(1)}%`,
    ]);

    const columnWidths = [150, 120, 100];
    drawTable(
      doc,
      ["Category", "Amount", "Percentage"],
      expenseData,
      columnWidths
    );
    doc.moveDown(1);
  }

  if (data.topCategories.income.length > 0) {
    if (doc.y > 600) addNewPage(doc);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Top Income Breakdown", margin, doc.y);
    doc.moveDown(0.5);

    const incomeData = data.topCategories.income.map((cat) => [
      cat.name,
      formatCurrency(cat.amount),
      `${cat.percentage.toFixed(1)}%`,
    ]);

    const columnWidths = [150, 120, 100];
    drawTable(
      doc,
      ["Category", "Amount", "Percentage"],
      incomeData,
      columnWidths
    );
  }
}
