import PDFDocument from "pdfkit";
import {
  TransactionsSummaryReport,
  ExpensesByCategoryReport,
  MonthlyTrendReport,
} from "../../../domain/entities/report.entity";
import { addMetricCard } from "./pdf-components";
import { drawTable } from "./pdf-table";
import { drawBarChart, drawPieChart, drawLineChart } from "./pdf-charts";
import { formatCurrency, formatDate } from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function formatTransactionsSummary(
  doc: typeof PDFDocument.prototype,
  data: TransactionsSummaryReport
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 20) / 2;

  addMetricCard(
    doc,
    "Total Income",
    formatCurrency(data.totalIncome),
    margin,
    doc.y,
    cardWidth,
    "#10b981"
  );
  addMetricCard(
    doc,
    "Total Expense",
    formatCurrency(data.totalExpense),
    margin + cardWidth + 20,
    doc.y - 80,
    cardWidth,
    "#ef4444"
  );

  doc.moveDown(1);
  addMetricCard(
    doc,
    "Net Balance",
    formatCurrency(data.netBalance),
    margin,
    doc.y,
    cardWidth,
    "#3b82f6"
  );
  addMetricCard(
    doc,
    "Transactions",
    `${data.transactionCount}`,
    margin + cardWidth + 20,
    doc.y - 80,
    cardWidth,
    "#8b5cf6"
  );

  doc.moveDown(1);

  if (data.totalIncome > 0 || data.totalExpense > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Income vs Expense", margin, doc.y);
    doc.moveDown(0.5);

    const chartData = [
      { label: "Income", value: data.totalIncome, color: "#10b981" },
      { label: "Expense", value: data.totalExpense, color: "#ef4444" },
    ];

    drawBarChart(doc, chartData, "Income vs Expense", contentWidth, 150);
    doc.moveDown(2);
  }

  if (data.topIncomeCategory || data.topExpenseCategory) {
    doc.fontSize(14).fillColor("#1f2937").text("Top Categories", margin, doc.y);
    doc.moveDown(0.5);

    const topCategoriesData = [];
    if (data.topIncomeCategory) {
      topCategoriesData.push([
        "Top Income",
        data.topIncomeCategory.name,
        formatCurrency(data.topIncomeCategory.amount),
      ]);
    }
    if (data.topExpenseCategory) {
      topCategoriesData.push([
        "Top Expense",
        data.topExpenseCategory.name,
        formatCurrency(data.topExpenseCategory.amount),
      ]);
    }

    const columnWidths = [100, 200, 150];
    drawTable(
      doc,
      ["Type", "Category", "Amount"],
      topCategoriesData,
      columnWidths
    );
    doc.moveDown(1);
  }

  if (data.transactions.length > 0) {
    if (doc.y > 600) addNewPage(doc);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Transaction Details", margin, doc.y);
    doc.moveDown(0.5);

    const transactionsData = data.transactions
      .slice(0, 20)
      .map((t) => [
        formatDate(t.date),
        t.type,
        t.category || "N/A",
        formatCurrency(t.amount),
      ]);

    const columnWidths = [100, 80, 150, 120];
    drawTable(
      doc,
      ["Date", "Type", "Category", "Amount"],
      transactionsData,
      columnWidths
    );
  }
}

export function formatExpensesByCategory(
  doc: typeof PDFDocument.prototype,
  data: ExpensesByCategoryReport
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 20) / 2;

  addMetricCard(
    doc,
    "Total Expenses",
    formatCurrency(data.totalExpenses),
    margin,
    doc.y,
    cardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Categories",
    `${data.categoryCount}`,
    margin + cardWidth + 20,
    doc.y - 80,
    cardWidth,
    "#3b82f6"
  );

  doc.moveDown(1);

  if (data.categories.length > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Expense Distribution", margin, doc.y);
    doc.moveDown(0.5);

    const pieData = data.categories.slice(0, 10).map((cat) => ({
      label: cat.name,
      value: cat.amount,
      percentage: cat.percentage,
    }));

    drawPieChart(doc, pieData, "Expense Distribution", 200);
    doc.moveDown(2);

    if (doc.y > 600) addNewPage(doc);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Category Breakdown", margin, doc.y);
    doc.moveDown(0.5);

    const categoryData = data.categories.map((cat) => [
      cat.name,
      formatCurrency(cat.amount),
      `${cat.percentage.toFixed(1)}%`,
      `${cat.transactionCount}`,
    ]);

    const columnWidths = [150, 120, 100, 100];
    drawTable(
      doc,
      ["Category", "Amount", "Percentage", "Transactions"],
      categoryData,
      columnWidths
    );
  }
}

export function formatMonthlyTrend(
  doc: typeof PDFDocument.prototype,
  data: MonthlyTrendReport
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 30) / 3;

  addMetricCard(
    doc,
    "Avg Monthly Income",
    formatCurrency(data.averageMonthlyIncome),
    margin,
    doc.y,
    cardWidth,
    "#10b981"
  );
  addMetricCard(
    doc,
    "Avg Monthly Expense",
    formatCurrency(data.averageMonthlyExpense),
    margin + cardWidth + 15,
    doc.y - 80,
    cardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Trend",
    data.trend.toUpperCase(),
    margin + (cardWidth + 15) * 2,
    doc.y - 80,
    cardWidth,
    "#3b82f6"
  );

  doc.moveDown(1);

  if (data.months.length > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Monthly Financial Trend", margin, doc.y);
    doc.moveDown(0.5);

    const lineData = data.months.map((m) => ({
      label: m.month,
      income: m.income,
      expense: m.expense,
      balance: m.balance,
    }));

    // Convert lineData to the expected format
    const formattedLineData = data.months.map((m) => ({
      label: m.month,
      values: [
        { name: "Income", value: m.income, color: "#10b981" },
        { name: "Expense", value: m.expense, color: "#ef4444" },
        { name: "Balance", value: m.balance, color: "#3b82f6" },
      ],
    }));
    drawLineChart(
      doc,
      formattedLineData,
      "Monthly Financial Trend",
      contentWidth,
      180
    );
    doc.moveDown(2);

    if (doc.y > 600) addNewPage(doc);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Monthly Details", margin, doc.y);
    doc.moveDown(0.5);

    const monthData = data.months.map((m) => [
      m.month,
      formatCurrency(m.income),
      formatCurrency(m.expense),
      formatCurrency(m.balance),
      `${m.transactionCount}`,
    ]);

    const columnWidths = [100, 120, 120, 120, 100];
    drawTable(
      doc,
      ["Month", "Income", "Expense", "Balance", "Transactions"],
      monthData,
      columnWidths
    );
  }
}
