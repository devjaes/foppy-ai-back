import PDFDocument from "pdfkit";
import { COLORS, DIMENSIONS, checkPageBreak, formatCurrency } from "./pdf-utils";
import { addNewPage } from "./pdf-layout";

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export function drawBarChart(
  doc: typeof PDFDocument,
  data: ChartDataPoint[],
  title: string,
  width: number = 450,
  height: number = 200
) {
  if (checkPageBreak(doc, height + 60)) {
    addNewPage(doc);
  }

  const startX = DIMENSIONS.MARGIN;
  const startY = doc.y;
  const chartWidth = width;
  const chartHeight = height;
  const barWidth = chartWidth / (data.length * 2);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  doc.fontSize(12)
     .fillColor(COLORS.TEXT)
     .font("Helvetica-Bold")
     .text(title, startX, startY);

  doc.moveDown(0.5);
  const chartStartY = doc.y;

  doc.rect(startX, chartStartY, chartWidth, chartHeight)
     .strokeColor(COLORS.MEDIUM_GRAY)
     .lineWidth(1)
     .stroke();

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = chartStartY + (chartHeight / gridLines) * i;
    doc.moveTo(startX, y)
       .lineTo(startX + chartWidth, y)
       .strokeColor(COLORS.LIGHT_GRAY)
       .lineWidth(0.5)
       .stroke();

    const value = maxValue - (maxValue / gridLines) * i;
    doc.fontSize(8)
       .fillColor(COLORS.TEXT)
       .text(
         formatCurrency(value),
         startX - 60,
         y - 4,
         { width: 50, align: "right" }
       );
  }

  data.forEach((point, index) => {
    const barHeight = (point.value / maxValue) * chartHeight;
    const x = startX + (barWidth * 2 * index) + barWidth / 2;
    const y = chartStartY + chartHeight - barHeight;

    doc.rect(x, y, barWidth, barHeight)
       .fillColor(point.color || COLORS.SECONDARY)
       .fill();

    doc.fontSize(8)
       .fillColor(COLORS.TEXT)
       .text(
         point.label,
         x - 20,
         chartStartY + chartHeight + 5,
         { width: barWidth + 40, align: "center" }
       );

    doc.fontSize(7)
       .text(
         formatCurrency(point.value),
         x - 20,
         y - 12,
         { width: barWidth + 40, align: "center" }
       );
  });

  doc.y = chartStartY + chartHeight + 40;
}

export function drawPieChart(
  doc: typeof PDFDocument,
  data: ChartDataPoint[],
  title: string,
  size: number = 150
) {
  if (checkPageBreak(doc, size + 100)) {
    addNewPage(doc);
  }

  const startX = DIMENSIONS.MARGIN + size;
  const startY = doc.y + size / 2;
  const radius = size / 2;

  doc.fontSize(12)
     .fillColor(COLORS.TEXT)
     .font("Helvetica-Bold")
     .text(title, DIMENSIONS.MARGIN, doc.y);

  doc.moveDown(1.5);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2;

  const colors = [
    COLORS.SECONDARY,
    COLORS.ACCENT,
    COLORS.WARNING,
    COLORS.DANGER,
    "#9333ea",
    "#f97316",
  ];

  data.forEach((point, index) => {
    const percentage = (point.value / total) * 100;
    const angle = (point.value / total) * 2 * Math.PI;
    const color = point.color || colors[index % colors.length];

    doc.path(
      `M ${startX} ${startY} ` +
      `L ${startX + radius * Math.cos(currentAngle)} ${startY + radius * Math.sin(currentAngle)} ` +
      `A ${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} 1 ` +
      `${startX + radius * Math.cos(currentAngle + angle)} ${startY + radius * Math.sin(currentAngle + angle)} Z`
    )
       .fillColor(color)
       .fill();

    currentAngle += angle;
  });

  const legendX = startX + radius + 40;
  let legendY = startY - radius;

  data.forEach((point, index) => {
    const color = point.color || colors[index % colors.length];
    const percentage = ((point.value / total) * 100).toFixed(1);

    doc.rect(legendX, legendY, 12, 12)
       .fillColor(color)
       .fill();

    doc.fontSize(9)
       .fillColor(COLORS.TEXT)
       .font("Helvetica")
       .text(
         `${point.label} (${percentage}%)`,
         legendX + 18,
         legendY,
         { width: 150 }
       );

    legendY += 20;
  });

  doc.y = Math.max(startY + radius + 20, legendY + 20);
}

export function drawLineChart(
  doc: typeof PDFDocument,
  data: { label: string; values: { name: string; value: number; color: string }[] }[],
  title: string,
  width: number = 450,
  height: number = 200
) {
  if (checkPageBreak(doc, height + 80)) {
    addNewPage(doc);
  }

  const startX = DIMENSIONS.MARGIN + 50;
  const startY = doc.y;
  const chartWidth = width - 50;
  const chartHeight = height;

  doc.fontSize(12)
     .fillColor(COLORS.TEXT)
     .font("Helvetica-Bold")
     .text(title, DIMENSIONS.MARGIN, startY);

  doc.moveDown(0.5);
  const chartStartY = doc.y;

  const allValues = data.flatMap(d => d.values.map(v => v.value));
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  doc.rect(startX, chartStartY, chartWidth, chartHeight)
     .strokeColor(COLORS.MEDIUM_GRAY)
     .lineWidth(1)
     .stroke();

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = chartStartY + (chartHeight / gridLines) * i;
    doc.moveTo(startX, y)
       .lineTo(startX + chartWidth, y)
       .strokeColor(COLORS.LIGHT_GRAY)
       .lineWidth(0.5)
       .stroke();

    const value = maxValue - (valueRange / gridLines) * i;
    doc.fontSize(8)
       .fillColor(COLORS.TEXT)
       .text(
         formatCurrency(value),
         startX - 45,
         y - 4,
         { width: 40, align: "right" }
       );
  }

  if (data.length > 0 && data[0].values.length > 0) {
    const pointSpacing = chartWidth / (data.length - 1 || 1);

    data[0].values.forEach((series, seriesIndex) => {
      const color = series.color;
      let firstPoint = true;

      data.forEach((point, pointIndex) => {
        const value = point.values[seriesIndex]?.value || 0;
        const x = startX + pointSpacing * pointIndex;
        const y = chartStartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;

        if (firstPoint) {
          doc.moveTo(x, y);
          firstPoint = false;
        } else {
          doc.lineTo(x, y);
        }

        doc.circle(x, y, 3)
           .fillColor(color)
           .fill();
      });

      doc.strokeColor(color)
         .lineWidth(2)
         .stroke();
    });
  }

  data.forEach((point, index) => {
    const x = startX + (chartWidth / (data.length - 1 || 1)) * index;
    doc.fontSize(8)
       .fillColor(COLORS.TEXT)
       .text(
         point.label,
         x - 30,
         chartStartY + chartHeight + 10,
         { width: 60, align: "center" }
       );
  });

  if (data.length > 0 && data[0].values.length > 0) {
    const legendY = chartStartY + chartHeight + 40;
    let legendX = startX;

    data[0].values.forEach((series) => {
      doc.rect(legendX, legendY, 12, 12)
         .fillColor(series.color)
         .fill();

      doc.fontSize(9)
         .fillColor(COLORS.TEXT)
         .text(series.name, legendX + 18, legendY, { width: 80 });

      legendX += 120;
    });
  }

  doc.y = chartStartY + chartHeight + 70;
}
