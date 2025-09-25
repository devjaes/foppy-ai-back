import { Report, ReportType } from "../../domain/entities/report.entity";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs/promises";
import { PDFDocument as PDFLib, rgb, StandardFonts } from "pdf-lib";

export class PDFService {
  private readonly HEADER_HEIGHT = 50;
  private readonly FOOTER_HEIGHT = 30;
  private readonly PRIMARY_COLOR = "#2c3e50";
  private readonly SECONDARY_COLOR = "#3498db";
  private readonly TEXT_COLOR = "#2c3e50";
  private readonly TABLE_HEADER_COLOR = "#f8f9fa";
  private readonly TABLE_BORDER_COLOR = "#dee2e6";
  private readonly ROW_HEIGHT = 25;
  private readonly HEADER_HEIGHT_TABLE = 30;
  private readonly MIN_SPACE_AFTER_TABLE = 30;
  private readonly CELL_PADDING = 5;
  private readonly ITEM_SPACING = 15;
  private readonly SECTION_SPACING = 20;

  async generatePDF(report: Report): Promise<Buffer> {
    // Si es un reporte de tipo GOAL, usamos el template
    if (report.type === ReportType.GOAL) {
      return this.generateGoalPDF(report);
    }

    // Para otros tipos de reportes, generamos dinámicamente
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "Reporte Financiero",
        Author: "Fopymes",
        Subject: "Análisis Financiero",
        Keywords: "finanzas, reporte, metas, ahorro",
        CreationDate: new Date(),
      },
    });

    const chunks: Uint8Array[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      doc.on("error", reject);

      this.addHeader(doc);
      doc.moveDown(2);
      doc.fontSize(24).fillColor(this.PRIMARY_COLOR).text("Reporte", 50, 60);
      doc.moveDown();

      switch (report.type) {
        case ReportType.GOALS_BY_STATUS:
          this.formatGoalsByStatus(doc, report.data);
          break;
        case ReportType.GOALS_BY_CATEGORY:
          this.formatGoalsByCategory(doc, report.data);
          break;
        case ReportType.CONTRIBUTIONS_BY_GOAL:
          this.formatContributionsByGoal(doc, report.data);
          break;
        case ReportType.SAVINGS_COMPARISON:
          this.formatSavingsComparison(doc, report.data);
          break;
        case ReportType.SAVINGS_SUMMARY:
          this.formatSavingsSummary(doc, report.data);
          break;
        default:
          reject(
            new Error(`Unsupported report type for PDF export: ${report.type}`)
          );
          return;
      }

      this.addFooter(doc);
      doc.end();
    });
  }

  private async generateGoalPDF(report: Report): Promise<Buffer> {
    try {
      // Cargar el template PDF
      const templatePath = path.join(
        __dirname,
        "../../domain/templates/goals.pdf"
      );
      const existingPdfBytes = await fs.readFile(templatePath);
      const pdfDoc = await PDFLib.load(new Uint8Array(existingPdfBytes));

      // Obtener la primera página
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      // Añadir el contenido al template
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Configurar el contenido
      page.drawText(`Meta: ${report.data.name}`, {
        x: 50,
        y: height - 150,
        size: 16,
        font: helveticaFont,
        color: rgb(0.17, 0.24, 0.31), // PRIMARY_COLOR en RGB
      });

      // Añadir más información de la meta
      const yPositions = {
        targetAmount: height - 180,
        currentAmount: height - 210,
        progress: height - 240,
        endDate: height - 270,
      };

      page.drawText(
        `Meta: $${report.data?.targetAmount?.toLocaleString() || "0"}`,
        {
          x: 50,
          y: yPositions.targetAmount,
          size: 12,
          font: helveticaFont,
        }
      );

      page.drawText(
        `Ahorrado: $${report.data?.currentAmount?.toLocaleString() || "0"}`,
        {
          x: 50,
          y: yPositions.currentAmount,
          size: 12,
          font: helveticaFont,
        }
      );

      const progress = (
        (report.data?.currentAmount / report.data?.targetAmount) *
        100
      ).toFixed(2);
      page.drawText(`Progreso: ${progress}%`, {
        x: 50,
        y: yPositions.progress,
        size: 12,
        font: helveticaFont,
      });

      page.drawText(
        `Fecha límite: ${
          report.data?.endDate
            ? new Date(report.data.endDate).toLocaleDateString()
            : "No disponible"
        }`,
        {
          x: 50,
          y: yPositions.endDate,
          size: 12,
          font: helveticaFont,
        }
      );

      // Guardar el PDF modificado
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Error al generar el PDF de meta:", error);
      throw new Error("No se pudo generar el PDF de meta");
    }
  }

  private addHeader(doc: typeof PDFDocument) {
    doc
      .rect(0, 0, doc.page.width, this.HEADER_HEIGHT)
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    doc
      .fontSize(16)
      .fillColor("#ffffff")
      .text("Reporte Financiero de Fopymes", 50, 20);

    const date = new Date().toLocaleDateString();
    doc.fontSize(10).text(date, doc.page.width - 100, 20, { align: "right" });
  }

  private addFooter(doc: typeof PDFDocument) {
    const pageHeight = doc.page.height;
    doc
      .rect(
        0,
        pageHeight - this.FOOTER_HEIGHT,
        doc.page.width,
        this.FOOTER_HEIGHT
      )
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    doc
      .fontSize(8)
      .fillColor("#ffffff")
      .text(
        "© 2025 Fopymes. Todos los derechos reservados.",
        50,
        pageHeight - 20
      );

    doc.text(
      `Página ${doc.bufferedPageRange().start + 1} de ${
        doc.bufferedPageRange().count
      }`,
      doc.page.width - 100,
      pageHeight - 20,
      { align: "right" }
    );
  }

  private checkPageBreak(
    doc: typeof PDFDocument,
    requiredHeight: number
  ): boolean {
    const currentY = doc.y;
    const pageHeight = doc.page.height;
    const footerHeight = this.FOOTER_HEIGHT;
    return currentY + requiredHeight > pageHeight - footerHeight;
  }

  private addNewPage(doc: typeof PDFDocument) {
    doc.addPage();
    this.addHeader(doc);
    doc.moveDown(2);
  }

  private drawSummaryTable(
    doc: typeof PDFDocument,
    headers: string[],
    rows: any[][],
    startX: number,
    startY: number,
    colWidths: number[]
  ) {
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableHeight =
      this.HEADER_HEIGHT_TABLE + rows.length * this.ROW_HEIGHT;

    if (this.checkPageBreak(doc, tableHeight)) {
      this.addNewPage(doc);
      startY = doc.y;
    }

    // Draw header
    doc
      .rect(startX, startY, tableWidth, this.HEADER_HEIGHT_TABLE)
      .fillColor(this.TABLE_HEADER_COLOR)
      .fill()
      .strokeColor(this.TABLE_BORDER_COLOR)
      .stroke();

    let x = startX;
    headers.forEach((header, i) => {
      doc
        .fontSize(12)
        .fillColor(this.PRIMARY_COLOR)
        .text(header, x + this.CELL_PADDING, startY + this.CELL_PADDING, {
          width: colWidths[i] - 2 * this.CELL_PADDING,
          align: "left",
        });
      x += colWidths[i];
    });

    // Draw rows
    rows.forEach((row, rowIndex) => {
      const y = startY + this.HEADER_HEIGHT_TABLE + rowIndex * this.ROW_HEIGHT;
      x = startX;

      doc
        .rect(startX, y, tableWidth, this.ROW_HEIGHT)
        .strokeColor(this.TABLE_BORDER_COLOR)
        .stroke();

      row.forEach((cell, colIndex) => {
        doc
          .fontSize(10)
          .fillColor(this.TEXT_COLOR)
          .text(cell.toString(), x + this.CELL_PADDING, y + this.CELL_PADDING, {
            width: colWidths[colIndex] - 2 * this.CELL_PADDING,
            align: "left",
          });
        x += colWidths[colIndex];
      });
    });

    doc.y =
      startY +
      this.HEADER_HEIGHT_TABLE +
      rows.length * this.ROW_HEIGHT +
      this.MIN_SPACE_AFTER_TABLE;
  }

  private drawDataItem(
    doc: typeof PDFDocument,
    label: string,
    value: string,
    indent: number = 0
  ) {
    if (this.checkPageBreak(doc, this.ITEM_SPACING)) {
      this.addNewPage(doc);
    }

    doc
      .fontSize(12)
      .fillColor(this.TEXT_COLOR)
      .text(`${label}:`, 50 + indent, doc.y, { continued: true })
      .text(value, { align: "left" });
    doc.moveDown();
  }

  private formatGoalsByStatus(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Metas por estado", 50, 100);
    doc.moveDown();

    data.goals.forEach((goal: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 5)) {
        this.addNewPage(doc);
      }

      doc.fontSize(14).fillColor(this.PRIMARY_COLOR).text(goal.name);
      doc.moveDown();

      this.drawDataItem(doc, "Estado", goal.status, 20);
      this.drawDataItem(doc, "Meta", goal.targetAmount, 20);
      this.drawDataItem(doc, "Ahorrado", goal.currentAmount, 20);
      this.drawDataItem(doc, "Progreso", `${goal.progress}%`, 20);
      this.drawDataItem(doc, "Plazo", goal.deadline, 20);
      doc.moveDown();
    });

    // Summary table
    doc.fontSize(16).fillColor(this.SECONDARY_COLOR).text("Resumen");
    doc.moveDown();

    const summaryHeaders = ["Métrica", "Valor"];
    const summaryRows = [
      ["Total Metas", data.total],
      ["Metas completadas", data.completed],
      ["Metas expiradas", data.expired],
      ["Metas en progreso", data.inProgress],
    ];

    this.drawSummaryTable(
      doc,
      summaryHeaders,
      summaryRows,
      50,
      doc.y,
      [150, 100]
    );
  }

  private formatGoalsByCategory(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Metas de ahorro por categoría");
    doc.moveDown();

    data.categories.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 10)) {
        this.addNewPage(doc);
      }

      doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text(category.name);
      doc.moveDown();

      this.drawDataItem(doc, "Total Metas", category.totalGoals, 20);
      this.drawDataItem(doc, "Total Cantidad", category.totalAmount, 20);
      this.drawDataItem(doc, "Ahorrado", category.completedAmount, 20);
      this.drawDataItem(doc, "Progreso", `${category.progress}%`, 20);
      doc.moveDown();

      doc
        .fontSize(14)
        .fillColor(this.SECONDARY_COLOR)
        .text("Metas en esta categoría:");
      doc.moveDown();

      category.goals.forEach((goal: any) => {
        this.drawDataItem(doc, "Meta de ahorro", goal.name, 40);
        this.drawDataItem(doc, "Meta", goal.targetAmount, 40);
        this.drawDataItem(doc, "Ahorrado", goal.currentAmount, 40);
        this.drawDataItem(doc, "Progreso", `${goal.progress}%`, 40);
        doc.moveDown();
      });
    });
  }

  private formatContributionsByGoal(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Contribuciones por meta");
    doc.moveDown();

    doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text(data.goalName);
    doc.moveDown();

    data.contributions.forEach((contribution: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 3)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, "Fecha", contribution.date, 20);
      this.drawDataItem(doc, "Cantidad", contribution.amount, 20);
      this.drawDataItem(
        doc,
        "ID de transacción",
        contribution.transactionId,
        20
      );
      doc.moveDown();
    });

    // Summary table
    doc.fontSize(16).fillColor(this.SECONDARY_COLOR).text("Resumen");
    doc.moveDown();

    const summaryHeaders = ["Metric", "Value"];
    const summaryRows = [
      ["Total Contribuciones", data.totalContributions],
      ["Contribución promedio", data.averageContribution],
      ["Última contribución", data.lastContributionDate],
    ];

    this.drawSummaryTable(
      doc,
      summaryHeaders,
      summaryRows,
      50,
      doc.y,
      [150, 100]
    );
  }

  private formatSavingsComparison(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Comparación de ahorro");
    doc.moveDown();

    doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text(data.goalName);
    doc.moveDown();

    data.deviations.forEach((deviation: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, "Fecha", deviation.date, 20);
      this.drawDataItem(doc, "Meta", deviation.plannedAmount, 20);
      this.drawDataItem(doc, "Ahorrado", deviation.actualAmount, 20);
      this.drawDataItem(doc, "Diferencia", deviation.difference, 20);
      doc.moveDown();
    });
  }

  private formatSavingsSummary(doc: typeof PDFDocument, data: any) {
    doc.fontSize(18).fillColor(this.SECONDARY_COLOR).text("Resumen de ahorro");
    doc.moveDown();

    // Overall metrics table
    doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text("Métricas generales");
    doc.moveDown();

    const metricsHeaders = ["Métrica", "Valor"];
    const metricsRows = [
      ["Total Metas", data.totalGoals],
      ["Meta total", data.totalTargetAmount],
      ["Ahorrado total", data.totalCurrentAmount],
      ["Progreso general", `${data.overallProgress}%`],
      ["Metas completadas", data.completedGoals],
      ["Metas expiradas", data.expiredGoals],
      ["Metas en progreso", data.inProgressGoals],
      ["Contribución promedio", data.averageContribution],
      ["Última contribución", data.lastContributionDate],
    ];

    this.drawSummaryTable(
      doc,
      metricsHeaders,
      metricsRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Category breakdown
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text("Desglose por categoría");
    doc.moveDown();

    data.categoryBreakdown.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, "Categoría", category.categoryName, 20);
      this.drawDataItem(doc, "Total Metas", category.totalGoals, 20);
      this.drawDataItem(doc, "Total Cantidad", category.totalAmount, 20);
      this.drawDataItem(doc, "Progreso", `${category.progress}%`, 20);
      doc.moveDown();
    });
  }
}
