import PDFDocument from "pdfkit";
import { FinancialOverviewReport } from "../../../domain/entities/report.entity";
import {
  addSectionTitle,
  addMetricCard,
  drawProgressBar,
} from "./pdf-components";
import { drawTable } from "./pdf-table";
import { drawBarChart, drawPieChart } from "./pdf-charts";
import {
  formatCurrency,
  formatDate,
  COLORS,
  DIMENSIONS,
  checkPageBreak,
} from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export function formatFinancialOverview(
  doc: typeof PDFDocument.prototype,
  data: FinancialOverviewReport,
  reportTitle: string = "Vista General Financiera"
): void {
  if (!data) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Resumen Financiero General", reportTitle);

  doc
    .fontSize(10)
    .fillColor(COLORS.TEXT)
    .text(
      `Período: ${formatDate(data.period?.startDate)} - ${formatDate(
        data.period?.endDate
      )}`,
      DIMENSIONS.MARGIN,
      doc.y
    );
  doc.moveDown(1);

  const cardY = doc.y;
  const cardWidth = 110;
  const cardSpacing = 15;

  addMetricCard(
    doc,
    "Total Ingresos",
    formatCurrency(data.summary?.totalIncome || 0),
    DIMENSIONS.MARGIN,
    cardY,
    cardWidth,
    COLORS.ACCENT
  );
  addMetricCard(
    doc,
    "Total Gastos",
    formatCurrency(data.summary?.totalExpense || 0),
    DIMENSIONS.MARGIN + cardWidth + cardSpacing,
    cardY,
    cardWidth,
    COLORS.DANGER
  );
  addMetricCard(
    doc,
    "Balance Neto",
    formatCurrency(data.summary?.netBalance || 0),
    DIMENSIONS.MARGIN + 2 * (cardWidth + cardSpacing),
    cardY,
    cardWidth,
    COLORS.SECONDARY
  );
  addMetricCard(
    doc,
    "Tasa de Ahorro",
    `${(data.summary?.savingsRate || 0).toFixed(1)}%`,
    DIMENSIONS.MARGIN + 3 * (cardWidth + cardSpacing),
    cardY,
    cardWidth,
    COLORS.PRIMARY
  );

  doc.y = cardY + 70;
  doc.moveDown(1);

  if (
    (data.summary?.totalIncome || 0) > 0 ||
    (data.summary?.totalExpense || 0) > 0
  ) {
    addSectionTitle(doc, "Ingresos vs Gastos", reportTitle);

    const chartData = [
      {
        label: "Ingresos",
        value: data.summary?.totalIncome || 0,
        color: COLORS.ACCENT,
      },
      {
        label: "Gastos",
        value: data.summary?.totalExpense || 0,
        color: COLORS.DANGER,
      },
    ];

    drawBarChart(doc, chartData, "Ingresos vs Gastos", 450, 150);
    doc.moveDown(2);
  }

  if (checkPageBreak(doc, 200)) {
    addNewPage(doc, reportTitle);
  }

  addSectionTitle(doc, "Resumen de Metas", reportTitle);

  const goalCardY = doc.y;
  const goalCardWidth = 120;
  const goalCardSpacing = 15;

  addMetricCard(
    doc,
    "Total Metas",
    (data.goals?.total || 0).toString(),
    DIMENSIONS.MARGIN,
    goalCardY,
    goalCardWidth,
    COLORS.SECONDARY
  );
  addMetricCard(
    doc,
    "Completadas",
    (data.goals?.completed || 0).toString(),
    DIMENSIONS.MARGIN + goalCardWidth + goalCardSpacing,
    goalCardY,
    goalCardWidth,
    COLORS.ACCENT
  );
  addMetricCard(
    doc,
    "En Progreso",
    (data.goals?.inProgress || 0).toString(),
    DIMENSIONS.MARGIN + 2 * (goalCardWidth + goalCardSpacing),
    goalCardY,
    goalCardWidth,
    COLORS.WARNING
  );

  doc.y = goalCardY + 70;
  doc.moveDown(0.8);

  doc
    .fontSize(10)
    .fillColor(COLORS.TEXT)
    .text(
      `Ahorrado: ${formatCurrency(
        data.goals?.totalSaved || 0
      )} / Meta: ${formatCurrency(data.goals?.totalTarget || 0)}`,
      DIMENSIONS.MARGIN,
      doc.y
    );
  doc.moveDown(0.5);

  drawProgressBar(
    doc,
    DIMENSIONS.MARGIN,
    doc.y,
    450,
    data.goals?.overallProgress || 0
  );
  doc.moveDown(1);

  addSectionTitle(doc, "Resumen de Presupuestos", reportTitle);

  const budgetCardY = doc.y;
  const budgetCardWidth = 120;
  const budgetCardSpacing = 15;

  addMetricCard(
    doc,
    "Total Presupuestos",
    (data.budgets?.total || 0).toString(),
    DIMENSIONS.MARGIN,
    budgetCardY,
    budgetCardWidth,
    COLORS.SECONDARY
  );
  addMetricCard(
    doc,
    "Excedidos",
    (data.budgets?.exceeded || 0).toString(),
    DIMENSIONS.MARGIN + budgetCardWidth + budgetCardSpacing,
    budgetCardY,
    budgetCardWidth,
    COLORS.DANGER
  );
  addMetricCard(
    doc,
    "Uso Promedio",
    `${(data.budgets?.averageUtilization || 0).toFixed(1)}%`,
    DIMENSIONS.MARGIN + 2 * (budgetCardWidth + budgetCardSpacing),
    budgetCardY,
    budgetCardWidth,
    COLORS.WARNING
  );

  doc.y = budgetCardY + 70;
  doc.moveDown(1);

  if (checkPageBreak(doc, 200)) {
    addNewPage(doc, reportTitle);
  }

  if (data.topCategories?.expenses && data.topCategories.expenses.length > 0) {
    addSectionTitle(doc, "Categorías de Gastos Principales", reportTitle);

    const expensePieData = data.topCategories.expenses.map((cat) => ({
      label: cat.name || "Sin nombre",
      value: cat.amount || 0,
      percentage: cat.percentage || 0,
    }));

    drawPieChart(doc, expensePieData, "Categorías de Gastos Principales", 180);
    doc.moveDown(2);
  }

  if (checkPageBreak(doc, 200)) {
    addNewPage(doc, reportTitle);
  }

  if (data.topCategories?.expenses && data.topCategories.expenses.length > 0) {
    addSectionTitle(doc, "Desglose de Gastos Principales", reportTitle);

    const expenseData = data.topCategories.expenses.map((cat) => [
      cat.name || "Sin nombre",
      formatCurrency(cat.amount || 0),
      `${(cat.percentage || 0).toFixed(1)}%`,
    ]);

    const columnWidths = [150, 120, 100];
    drawTable(
      doc,
      ["Categoría", "Monto", "Porcentaje"],
      expenseData,
      columnWidths,
      reportTitle
    );
    doc.moveDown(1);
  }

  if (data.topCategories?.income && data.topCategories.income.length > 0) {
    if (checkPageBreak(doc, 200)) {
      addNewPage(doc, reportTitle);
    }

    addSectionTitle(doc, "Desglose de Ingresos Principales", reportTitle);

    const incomeData = data.topCategories.income.map((cat) => [
      cat.name || "Sin nombre",
      formatCurrency(cat.amount || 0),
      `${(cat.percentage || 0).toFixed(1)}%`,
    ]);

    const columnWidths = [150, 120, 100];
    drawTable(
      doc,
      ["Categoría", "Monto", "Porcentaje"],
      incomeData,
      columnWidths,
      reportTitle
    );
  }
}
