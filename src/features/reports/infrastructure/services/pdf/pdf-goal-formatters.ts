import PDFDocument from "pdfkit";
import {
  COLORS,
  DIMENSIONS,
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  checkPageBreak,
} from "./pdf-utils";
import { addSectionTitle, addMetricCard, drawProgressBar } from "./pdf-components";
import { drawTable } from "./pdf-table";
import { addNewPage } from "./pdf-layout";

export function formatGoalsByStatus(doc: typeof PDFDocument, data: any) {
  if (!data || !data.goals) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Resumen General");

  const cardY = doc.y;
  const cardWidth = 110;
  const cardSpacing = 15;

  addMetricCard(doc, "Total Metas", data.total?.toString() || "0", DIMENSIONS.MARGIN, cardY, cardWidth, COLORS.SECONDARY);
  addMetricCard(doc, "Completadas", data.completed?.toString() || "0", DIMENSIONS.MARGIN + cardWidth + cardSpacing, cardY, cardWidth, COLORS.ACCENT);
  addMetricCard(doc, "En Progreso", data.inProgress?.toString() || "0", DIMENSIONS.MARGIN + 2 * (cardWidth + cardSpacing), cardY, cardWidth, COLORS.WARNING);
  addMetricCard(doc, "Expiradas", data.expired?.toString() || "0", DIMENSIONS.MARGIN + 3 * (cardWidth + cardSpacing), cardY, cardWidth, COLORS.DANGER);

  doc.y = cardY + 70;
  doc.moveDown(1);

  addSectionTitle(doc, "Detalle de Metas");

  if (data.goals.length === 0) {
    doc.fontSize(11).fillColor(COLORS.TEXT).text("No se encontraron metas para mostrar", DIMENSIONS.MARGIN, doc.y);
    return;
  }

  data.goals.forEach((goal: any, index: number) => {
    if (checkPageBreak(doc, 120)) {
      addNewPage(doc);
    }

    if (index > 0) {
      doc.moveDown(1);
    }

    const statusColor = getStatusColor(goal.status);
    const statusLabel = getStatusLabel(goal.status);

    doc.fontSize(13)
       .fillColor(COLORS.PRIMARY)
       .font("Helvetica-Bold")
       .text(goal.name || "Sin nombre", DIMENSIONS.MARGIN, doc.y, { continued: true })
       .fontSize(9)
       .fillColor(statusColor)
       .text(` [${statusLabel}]`, { continued: false });

    doc.moveDown(0.5);

    const col1X = DIMENSIONS.MARGIN;
    const col2X = DIMENSIONS.MARGIN + 250;
    const rowY = doc.y;

    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font("Helvetica")
       .text(`Meta: ${formatCurrency(goal.targetAmount || 0)}`, col1X, rowY)
       .text(`Categoría: ${goal.categoryName || "Sin categoría"}`, col2X, rowY);

    doc.moveDown(0.8);
    const row2Y = doc.y;

    doc.text(`Ahorrado: ${formatCurrency(goal.currentAmount || 0)}`, col1X, row2Y)
       .text(`Fecha límite: ${formatDate(goal.deadline)}`, col2X, row2Y);

    doc.moveDown(1);

    drawProgressBar(doc, DIMENSIONS.MARGIN, doc.y, 450, goal.progress || 0);

    doc.moveDown(1.5);
  });
}

export function formatGoalsByCategory(doc: typeof PDFDocument, data: any) {
  if (!data || !data.categories) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Resumen General");

  const cardY = doc.y;
  const cardWidth = 140;
  const cardSpacing = 20;

  addMetricCard(doc, "Total Categorías", data.totalCategories?.toString() || "0", DIMENSIONS.MARGIN, cardY, cardWidth, COLORS.SECONDARY);
  addMetricCard(doc, "Total Metas", data.totalGoals?.toString() || "0", DIMENSIONS.MARGIN + cardWidth + cardSpacing, cardY, cardWidth, COLORS.PRIMARY);

  doc.y = cardY + 70;
  doc.moveDown(1);

  addSectionTitle(doc, "Detalle por Categoría");

  if (data.categories.length === 0) {
    doc.fontSize(11).fillColor(COLORS.TEXT).text("No se encontraron categorías con metas", DIMENSIONS.MARGIN, doc.y);
    return;
  }

  data.categories.forEach((category: any, catIndex: number) => {
    if (checkPageBreak(doc, 200)) {
      addNewPage(doc);
    }

    if (catIndex > 0) {
      doc.moveDown(1.5);
    }

    doc.fontSize(14)
       .fillColor(COLORS.SECONDARY)
       .font("Helvetica-Bold")
       .text(category.name || "Sin nombre", DIMENSIONS.MARGIN, doc.y);

    doc.moveDown(0.5);

    const col1X = DIMENSIONS.MARGIN;
    const col2X = DIMENSIONS.MARGIN + 200;
    const col3X = DIMENSIONS.MARGIN + 350;
    const statsY = doc.y;

    doc.fontSize(9)
       .fillColor(COLORS.TEXT)
       .font("Helvetica")
       .text(`Metas: ${category.totalGoals || 0}`, col1X, statsY)
       .text(`Total: ${formatCurrency(category.totalAmount || 0)}`, col2X, statsY)
       .text(`Ahorrado: ${formatCurrency(category.completedAmount || 0)}`, col3X, statsY);

    doc.moveDown(1);

    drawProgressBar(doc, DIMENSIONS.MARGIN, doc.y, 450, category.progress || 0);

    doc.moveDown(1);

    if (category.goals && category.goals.length > 0) {
      const headers = ["Meta", "Objetivo", "Ahorrado", "Progreso", "Estado"];
      const rows = category.goals.map((goal: any) => [
        goal.name || "Sin nombre",
        formatCurrency(goal.targetAmount || 0),
        formatCurrency(goal.currentAmount || 0),
        `${(goal.progress || 0).toFixed(1)}%`,
        getStatusLabel(goal.status || "inProgress"),
      ]);

      drawTable(doc, headers, rows, [140, 80, 80, 70, 80]);
    }

    doc.moveDown(0.5);
  });
}

export function formatContributionsByGoal(doc: typeof PDFDocument, data: any) {
  if (!data) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Información de la Meta");

  doc.fontSize(14)
     .fillColor(COLORS.PRIMARY)
     .font("Helvetica-Bold")
     .text(data.goalName || "Sin nombre", DIMENSIONS.MARGIN, doc.y);

  doc.moveDown(1);

  const cardY = doc.y;
  const cardWidth = 150;
  const cardSpacing = 15;

  addMetricCard(doc, "Total Contribuciones", formatCurrency(data.totalContributions || 0), DIMENSIONS.MARGIN, cardY, cardWidth, COLORS.ACCENT);
  addMetricCard(doc, "Promedio", formatCurrency(data.averageContribution || 0), DIMENSIONS.MARGIN + cardWidth + cardSpacing, cardY, cardWidth, COLORS.SECONDARY);
  addMetricCard(doc, "Última Contribución", data.lastContributionDate ? formatDate(data.lastContributionDate) : "N/A", DIMENSIONS.MARGIN + 2 * (cardWidth + cardSpacing), cardY, cardWidth, COLORS.PRIMARY);

  doc.y = cardY + 70;
  doc.moveDown(1);

  addSectionTitle(doc, "Historial de Contribuciones");

  if (!data.contributions || data.contributions.length === 0) {
    doc.fontSize(11).fillColor(COLORS.TEXT).text("No se encontraron contribuciones", DIMENSIONS.MARGIN, doc.y);
    return;
  }

  const headers = ["Fecha", "Monto", "ID Transacción"];
  const rows = data.contributions.map((contrib: any) => [
    formatDate(contrib.date),
    formatCurrency(contrib.amount || 0),
    contrib.transactionId || "N/A",
  ]);

  drawTable(doc, headers, rows, [150, 150, 150]);
}

export function formatSavingsComparison(doc: typeof PDFDocument, data: any) {
  if (!data) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Comparación de Ahorro");

  doc.fontSize(14)
     .fillColor(COLORS.PRIMARY)
     .font("Helvetica-Bold")
     .text(data.goalName || "Sin nombre", DIMENSIONS.MARGIN, doc.y);

  doc.moveDown(1.5);

  if (!data.deviations || data.deviations.length === 0) {
    doc.fontSize(11).fillColor(COLORS.TEXT).text("No hay datos de comparación disponibles", DIMENSIONS.MARGIN, doc.y);
    return;
  }

  const headers = ["Fecha", "Planificado", "Real", "Diferencia"];
  const rows = data.deviations.map((dev: any) => {
    const diff = dev.difference || 0;
    const diffStr = (diff >= 0 ? "+" : "") + formatCurrency(Math.abs(diff));
    return [
      formatDate(dev.date),
      formatCurrency(dev.plannedAmount || 0),
      formatCurrency(dev.actualAmount || 0),
      diffStr,
    ];
  });

  drawTable(doc, headers, rows, [120, 120, 120, 120]);
}

export function formatSavingsSummary(doc: typeof PDFDocument, data: any) {
  if (!data) {
    doc.fontSize(12).fillColor(COLORS.TEXT).text("No hay datos disponibles");
    return;
  }

  addSectionTitle(doc, "Resumen General");

  const cardY = doc.y;
  const cardWidth = 110;
  const cardSpacing = 12;

  addMetricCard(doc, "Total Metas", data.totalGoals?.toString() || "0", DIMENSIONS.MARGIN, cardY, cardWidth, COLORS.SECONDARY);
  addMetricCard(doc, "Completadas", data.completedGoals?.toString() || "0", DIMENSIONS.MARGIN + cardWidth + cardSpacing, cardY, cardWidth, COLORS.ACCENT);
  addMetricCard(doc, "En Progreso", data.inProgressGoals?.toString() || "0", DIMENSIONS.MARGIN + 2 * (cardWidth + cardSpacing), cardY, cardWidth, COLORS.WARNING);
  addMetricCard(doc, "Expiradas", data.expiredGoals?.toString() || "0", DIMENSIONS.MARGIN + 3 * (cardWidth + cardSpacing), cardY, cardWidth, COLORS.DANGER);

  doc.y = cardY + 70;
  doc.moveDown(1);

  addSectionTitle(doc, "Métricas Financieras");

  const metricsY = doc.y;

  addMetricCard(doc, "Meta Total", formatCurrency(data.totalTargetAmount || 0), DIMENSIONS.MARGIN, metricsY, 150, COLORS.PRIMARY);
  addMetricCard(doc, "Ahorrado Total", formatCurrency(data.totalCurrentAmount || 0), DIMENSIONS.MARGIN + 165, metricsY, 150, COLORS.ACCENT);
  addMetricCard(doc, "Contribución Promedio", formatCurrency(data.averageContribution || 0), DIMENSIONS.MARGIN + 330, metricsY, 150, COLORS.SECONDARY);

  doc.y = metricsY + 70;
  doc.moveDown(1);

  doc.fontSize(11)
     .fillColor(COLORS.TEXT)
     .font("Helvetica")
     .text("Progreso General:", DIMENSIONS.MARGIN, doc.y);
  
  doc.moveDown(0.5);
  drawProgressBar(doc, DIMENSIONS.MARGIN, doc.y, 450, data.overallProgress || 0);
  doc.moveDown(1.5);

  if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
    addSectionTitle(doc, "Desglose por Categoría");

    const headers = ["Categoría", "Metas", "Monto Total", "Progreso"];
    const rows = data.categoryBreakdown.map((cat: any) => [
      cat.categoryName || "Sin categoría",
      cat.totalGoals?.toString() || "0",
      formatCurrency(cat.totalAmount || 0),
      `${(cat.progress || 0).toFixed(1)}%`,
    ]);

    drawTable(doc, headers, rows, [180, 80, 120, 100]);
  }
}
