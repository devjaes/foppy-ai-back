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
  data: TransactionsSummaryReport,
  reportTitle: string = "Resumen de Transacciones"
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 20) / 2;

  const row1Y = doc.y;
  addMetricCard(
    doc,
    "Total Ingresos",
    formatCurrency(data.totalIncome),
    margin,
    row1Y,
    cardWidth,
    "#10b981"
  );
  addMetricCard(
    doc,
    "Total Gastos",
    formatCurrency(data.totalExpense),
    margin + cardWidth + 20,
    row1Y,
    cardWidth,
    "#ef4444"
  );

  doc.y = row1Y + 80;
  
  const row2Y = doc.y;
  addMetricCard(
    doc,
    "Balance Neto",
    formatCurrency(data.netBalance),
    margin,
    row2Y,
    cardWidth,
    "#3b82f6"
  );
  addMetricCard(
    doc,
    "Transacciones",
    `${data.transactionCount}`,
    margin + cardWidth + 20,
    row2Y,
    cardWidth,
    "#8b5cf6"
  );

  doc.y = row2Y + 80;

  if (data.totalIncome > 0 || data.totalExpense > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Ingresos vs Gastos", margin, doc.y);
    doc.moveDown(1);

    const chartData = [
      { label: "Ingresos", value: data.totalIncome, color: "#10b981" },
      { label: "Gastos", value: data.totalExpense, color: "#ef4444" },
    ];

    drawBarChart(doc, chartData, "Ingresos vs Gastos", contentWidth, 150);
    doc.moveDown(2);
  }

  if (data.topIncomeCategory || data.topExpenseCategory) {
    doc.fontSize(14).fillColor("#1f2937").text("Categorías Principales", margin, doc.y);
    doc.moveDown(1);

    const topCategoriesData = [];
    if (data.topIncomeCategory) {
      topCategoriesData.push([
        "Mayor Ingreso",
        data.topIncomeCategory.name,
        formatCurrency(data.topIncomeCategory.amount),
      ]);
    }
    if (data.topExpenseCategory) {
      topCategoriesData.push([
        "Mayor Gasto",
        data.topExpenseCategory.name,
        formatCurrency(data.topExpenseCategory.amount),
      ]);
    }

    const columnWidths = [120, 200, 150];
    drawTable(
      doc,
      ["Tipo", "Categoría", "Monto"],
      topCategoriesData,
      columnWidths,
      reportTitle
    );
    doc.moveDown(1);
  }

  if (data.transactions.length > 0) {
    if (doc.y > 600) addNewPage(doc, reportTitle);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Detalle de Transacciones", margin, doc.y);
    doc.moveDown(1);

    const transactionsData = data.transactions
      .slice(0, 20)
      .map((t) => [
        formatDate(t.date),
        t.type === "INCOME" ? "Ingreso" : "Gasto",
        t.category || "N/A",
        formatCurrency(t.amount),
      ]);

    const columnWidths = [100, 80, 150, 120];
    drawTable(
      doc,
      ["Fecha", "Tipo", "Categoría", "Monto"],
      transactionsData,
      columnWidths,
      reportTitle
    );
  }
}

export function formatExpensesByCategory(
  doc: typeof PDFDocument.prototype,
  data: ExpensesByCategoryReport,
  reportTitle: string = "Gastos por Categoría"
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 20) / 2;

  const rowY = doc.y;
  addMetricCard(
    doc,
    "Total Gastos",
    formatCurrency(data.totalExpenses),
    margin,
    rowY,
    cardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Categorías",
    `${data.categoryCount}`,
    margin + cardWidth + 20,
    rowY,
    cardWidth,
    "#3b82f6"
  );

  doc.y = rowY + 80;

  if (data.categories.length > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Distribución de Gastos", margin, doc.y);
    doc.moveDown(1);

    const pieData = data.categories.slice(0, 10).map((cat) => ({
      label: cat.name,
      value: cat.amount,
      percentage: cat.percentage,
    }));

    drawPieChart(doc, pieData, "Distribución de Gastos", 200);
    doc.moveDown(2);

    if (doc.y > 600) addNewPage(doc, reportTitle);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Desglose por Categoría", margin, doc.y);
    doc.moveDown(1);

    const categoryData = data.categories.map((cat) => [
      cat.name,
      formatCurrency(cat.amount),
      `${cat.percentage.toFixed(1)}%`,
      `${cat.transactionCount}`,
    ]);

    const columnWidths = [150, 120, 100, 100];
    drawTable(
      doc,
      ["Categoría", "Monto", "Porcentaje", "Transacciones"],
      categoryData,
      columnWidths,
      reportTitle
    );
  }
}

export function formatMonthlyTrend(
  doc: typeof PDFDocument.prototype,
  data: MonthlyTrendReport,
  reportTitle: string = "Tendencia Mensual"
): void {
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = (contentWidth - 30) / 3;

  const rowY = doc.y;
  addMetricCard(
    doc,
    "Ingreso Mensual Promedio",
    formatCurrency(data.averageMonthlyIncome),
    margin,
    rowY,
    cardWidth,
    "#10b981"
  );
  addMetricCard(
    doc,
    "Gasto Mensual Promedio",
    formatCurrency(data.averageMonthlyExpense),
    margin + cardWidth + 15,
    rowY,
    cardWidth,
    "#ef4444"
  );
  addMetricCard(
    doc,
    "Tendencia",
    data.trend === "increasing" ? "CRECIENTE" : data.trend === "decreasing" ? "DECRECIENTE" : "ESTABLE",
    margin + (cardWidth + 15) * 2,
    rowY,
    cardWidth,
    "#3b82f6"
  );

  doc.y = rowY + 80;

  if (data.months.length > 0) {
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Tendencia Financiera Mensual", margin, doc.y);
    doc.moveDown(1);

    const formattedLineData = data.months.map((m) => ({
      label: m.month,
      values: [
        { name: "Ingresos", value: m.income, color: "#10b981" },
        { name: "Gastos", value: m.expense, color: "#ef4444" },
        { name: "Balance", value: m.balance, color: "#3b82f6" },
      ],
    }));
    drawLineChart(
      doc,
      formattedLineData,
      "Tendencia Financiera Mensual",
      contentWidth,
      180
    );
    doc.moveDown(2);

    if (doc.y > 600) addNewPage(doc, reportTitle);

    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Detalle Mensual", margin, doc.y);
    doc.moveDown(1);

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
      ["Mes", "Ingresos", "Gastos", "Balance", "Transacciones"],
      monthData,
      columnWidths,
      reportTitle
    );
  }
}
