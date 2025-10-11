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

  // Diccionario de traducciones
  private readonly TRANSLATIONS = {
    // Títulos principales
    "Financial Report": "Reporte Financiero",
    "Goals by Status": "Metas por Estado",
    "Goals by Category": "Metas por Categoría",
    "Budget Summary": "Resumen de Presupuestos",
    "Expense Report": "Reporte de Gastos",
    "Income Report": "Reporte de Ingresos",
    "Debt Report": "Reporte de Deudas",
    "Comprehensive Report": "Reporte Completo",
    "Contributions by Goal": "Contribuciones por Meta",
    "Savings Comparison": "Comparación de Ahorros",
    "Savings Summary": "Resumen de Ahorros",

    // Métricas y etiquetas
    "Total Goals": "Total de Metas",
    Completed: "Completadas",
    "In Progress": "En Progreso",
    Expired: "Expiradas",
    Metric: "Métrica",
    Value: "Valor",
    "Total Budgets": "Total de Presupuestos",
    "Total Expenses": "Total de Gastos",
    "Total Income": "Total de Ingresos",
    "Total Debts": "Total de Deudas",
    Average: "Promedio",
    Utilization: "Utilización",
    "Over Budget": "Sobre Presupuesto",
    "Under Budget": "Bajo Presupuesto",
    "At Limit": "En el Límite",
    Category: "Categoría",
    Amount: "Cantidad",
    Date: "Fecha",
    Description: "Descripción",
    Status: "Estado",
    Progress: "Progreso",
    Target: "Meta",
    Current: "Actual",
    Paid: "Pagado",
    Pending: "Pendiente",
    Overdue: "Vencida",
    Active: "Activa",
    "Interest Rate": "Tasa de Interés",
    "Due Date": "Fecha de Vencimiento",
    "Original Amount": "Monto Original",
    "Paid Amount": "Monto Pagado",
    "Pending Amount": "Monto Pendiente",
    "Days Overdue": "Días de Retraso",

    // Secciones
    Summary: "Resumen",
    Details: "Detalles",
    Breakdown: "Desglose",
    Trends: "Tendencias",
    "Monthly Trends": "Tendencias Mensuales",
    "Category Breakdown": "Desglose por Categoría",
    "Top Categories": "Principales Categorías",
    "Financial Summary": "Resumen Financiero",
    "Goals Summary": "Resumen de Metas",
    "Budgets Summary": "Resumen de Presupuestos",
    "Debts Summary": "Resumen de Deudas",

    // Estados y mensajes
    "No data available": "No hay datos disponibles",
    "No goals found": "No se encontraron metas",
    "No budgets found": "No se encontraron presupuestos",
    "No transactions found": "No se encontraron transacciones",
    "No debts found": "No se encontraron deudas",
    "Generated on": "Generado el",
    Page: "Página",
    of: "de",

    // Footer
    "All rights reserved": "Todos los derechos reservados",
    Fopymes: "Fopymes",
    "Financial Analysis": "Análisis Financiero",
    "finances, report, goals, savings": "finanzas, reporte, metas, ahorro",
  };

  private translate(key: string): string {
    return this.TRANSLATIONS[key] || key;
  }

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
        case ReportType.BUDGET:
          this.formatBudgetReport(doc, report.data);
          break;
        case ReportType.EXPENSE:
          this.formatExpenseReport(doc, report.data);
          break;
        case ReportType.INCOME:
          this.formatIncomeReport(doc, report.data);
          break;
        case ReportType.DEBT:
          this.formatDebtReport(doc, report.data);
          break;
        case ReportType.COMPREHENSIVE:
          this.formatComprehensiveReport(doc, report.data);
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
      .text(
        this.translate("Financial Report") + " de " + this.translate("Fopymes"),
        50,
        20
      );

    const date = new Date().toLocaleDateString();
    doc
      .fontSize(10)
      .text(
        this.translate("Generated on") + " " + date,
        doc.page.width - 100,
        20,
        { align: "right" }
      );
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
        "© 2025 " +
          this.translate("Fopymes") +
          ". " +
          this.translate("All rights reserved") +
          ".",
        50,
        pageHeight - 20
      );

    doc.text(
      `${this.translate("Page")} ${
        doc.bufferedPageRange().start + 1
      } ${this.translate("of")} ${doc.bufferedPageRange().count}`,
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
      .text(this.translate("Goals by Status"), 50, 100);
    doc.moveDown();

    data.goals.forEach((goal: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 5)) {
        this.addNewPage(doc);
      }

      doc.fontSize(14).fillColor(this.PRIMARY_COLOR).text(goal.name);
      doc.moveDown();

      this.drawDataItem(doc, this.translate("Status"), goal.status, 20);
      this.drawDataItem(doc, this.translate("Target"), goal.targetAmount, 20);
      this.drawDataItem(doc, this.translate("Current"), goal.currentAmount, 20);
      this.drawDataItem(
        doc,
        this.translate("Progress"),
        `${goal.progress}%`,
        20
      );
      this.drawDataItem(doc, this.translate("Due Date"), goal.deadline, 20);
      doc.moveDown();
    });

    // Summary table
    doc
      .fontSize(16)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Summary"));
    doc.moveDown();

    const summaryHeaders = [this.translate("Metric"), this.translate("Value")];
    const summaryRows = [
      [this.translate("Total Goals"), data.total],
      [this.translate("Completed"), data.completed],
      [this.translate("Expired"), data.expired],
      [this.translate("In Progress"), data.inProgress],
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
      .text(this.translate("Goals by Category"));
    doc.moveDown();

    data.categories.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 10)) {
        this.addNewPage(doc);
      }

      doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text(category.name);
      doc.moveDown();

      this.drawDataItem(
        doc,
        this.translate("Total Goals"),
        category.totalGoals,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Total Amount"),
        category.totalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Current"),
        category.completedAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Progress"),
        `${category.progress}%`,
        20
      );
      doc.moveDown();

      doc
        .fontSize(14)
        .fillColor(this.SECONDARY_COLOR)
        .text(this.translate("Goals in this category") + ":");
      doc.moveDown();

      category.goals.forEach((goal: any) => {
        this.drawDataItem(doc, this.translate("Goal"), goal.name, 40);
        this.drawDataItem(doc, this.translate("Target"), goal.targetAmount, 40);
        this.drawDataItem(
          doc,
          this.translate("Current"),
          goal.currentAmount,
          40
        );
        this.drawDataItem(
          doc,
          this.translate("Progress"),
          `${goal.progress}%`,
          40
        );
        doc.moveDown();
      });
    });
  }

  private formatContributionsByGoal(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Contributions by Goal"));
    doc.moveDown();

    doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text(data.goalName);
    doc.moveDown();

    data.contributions.forEach((contribution: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 3)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, this.translate("Date"), contribution.date, 20);
      this.drawDataItem(doc, this.translate("Amount"), contribution.amount, 20);
      this.drawDataItem(
        doc,
        this.translate("Transaction ID"),
        contribution.transactionId,
        20
      );
      doc.moveDown();
    });

    // Summary table
    doc
      .fontSize(16)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Summary"));
    doc.moveDown();

    const summaryHeaders = [this.translate("Metric"), this.translate("Value")];
    const summaryRows = [
      [this.translate("Total Contributions"), data.totalContributions],
      [this.translate("Average Contribution"), data.averageContribution],
      [this.translate("Last Contribution"), data.lastContributionDate],
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
      .text(this.translate("Savings Comparison"));
    doc.moveDown();

    doc.fontSize(16).fillColor(this.PRIMARY_COLOR).text(data.goalName);
    doc.moveDown();

    data.deviations.forEach((deviation: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, this.translate("Date"), deviation.date, 20);
      this.drawDataItem(
        doc,
        this.translate("Target"),
        deviation.plannedAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Current"),
        deviation.actualAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Difference"),
        deviation.difference,
        20
      );
      doc.moveDown();
    });
  }

  private formatSavingsSummary(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Savings Summary"));
    doc.moveDown();

    // Overall metrics table
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Overall Metrics"));
    doc.moveDown();

    const metricsHeaders = [this.translate("Metric"), this.translate("Value")];
    const metricsRows = [
      [this.translate("Total Goals"), data.totalGoals],
      [this.translate("Total Target"), data.totalTargetAmount],
      [this.translate("Total Current"), data.totalCurrentAmount],
      [this.translate("Overall Progress"), `${data.overallProgress}%`],
      [this.translate("Completed"), data.completedGoals],
      [this.translate("Expired"), data.expiredGoals],
      [this.translate("In Progress"), data.inProgressGoals],
      [this.translate("Average Contribution"), data.averageContribution],
      [this.translate("Last Contribution"), data.lastContributionDate],
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
      .text(this.translate("Category Breakdown"));
    doc.moveDown();

    data.categoryBreakdown.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Category"),
        category.categoryName,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Total Goals"),
        category.totalGoals,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Total Amount"),
        category.totalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Progress"),
        `${category.progress}%`,
        20
      );
      doc.moveDown();
    });
  }

  private formatBudgetReport(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Budget Summary"));
    doc.moveDown();

    // Resumen general
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Summary"));
    doc.moveDown();

    const summaryHeaders = [this.translate("Metric"), this.translate("Value")];
    const summaryRows = [
      [this.translate("Total Budgets"), data.totalBudgets],
      [this.translate("Total Budget Amount"), data.totalBudgetAmount],
      [this.translate("Total Spent"), data.totalSpent],
      [
        this.translate("Average Utilization"),
        `${data.averageUtilization.toFixed(1)}%`,
      ],
      [this.translate("Over Budget"), data.overBudgetCount],
    ];

    this.drawSummaryTable(
      doc,
      summaryHeaders,
      summaryRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Desglose por categoría
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Category Breakdown"));
    doc.moveDown();

    data.categoryBreakdown.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Category"),
        category.categoryName,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Total Budget"),
        category.totalBudget,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Total Spent"),
        category.totalSpent,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Utilization"),
        `${category.utilization.toFixed(1)}%`,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Budget Count"),
        category.budgetCount,
        20
      );
      doc.moveDown();
    });

    // Detalles de presupuestos
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Budget Details"));
    doc.moveDown();

    data.budgets.forEach((budget: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Category"),
        budget.categoryName,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Limit Amount"),
        budget.limitAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Current Amount"),
        budget.currentAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Utilization"),
        `${budget.utilization.toFixed(1)}%`,
        20
      );
      this.drawDataItem(doc, this.translate("Status"), budget.status, 20);
      this.drawDataItem(doc, this.translate("Month"), budget.month, 20);
      doc.moveDown();
    });
  }

  private formatExpenseReport(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Expense Report"));
    doc.moveDown();

    // Resumen general
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Summary"));
    doc.moveDown();

    const summaryHeaders = [this.translate("Metric"), this.translate("Value")];
    const summaryRows = [
      [this.translate("Total Expenses"), data.totalExpenses],
      [this.translate("Total Transactions"), data.totalTransactions],
      [this.translate("Average Expense"), data.averageExpense],
    ];

    this.drawSummaryTable(
      doc,
      summaryHeaders,
      summaryRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Top categorías
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Top Categories"));
    doc.moveDown();

    data.topCategories.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 3)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Category"),
        category.categoryName,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Amount"),
        category.totalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Transaction Count"),
        category.transactionCount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Percentage"),
        `${category.percentage.toFixed(1)}%`,
        20
      );
      doc.moveDown();
    });

    // Tendencias mensuales
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Monthly Trends"));
    doc.moveDown();

    data.monthlyTrends.forEach((trend: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 3)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, this.translate("Month"), trend.month, 20);
      this.drawDataItem(
        doc,
        this.translate("Total Amount"),
        trend.totalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Transaction Count"),
        trend.transactionCount,
        20
      );
      doc.moveDown();
    });
  }

  private formatIncomeReport(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Income Report"));
    doc.moveDown();

    // Resumen general
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Summary"));
    doc.moveDown();

    const summaryHeaders = [this.translate("Metric"), this.translate("Value")];
    const summaryRows = [
      [this.translate("Total Income"), data.totalIncome],
      [this.translate("Total Transactions"), data.totalTransactions],
      [this.translate("Average Income"), data.averageIncome],
    ];

    this.drawSummaryTable(
      doc,
      summaryHeaders,
      summaryRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Top categorías
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Top Categories"));
    doc.moveDown();

    data.topCategories.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 3)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Category"),
        category.categoryName,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Amount"),
        category.totalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Transaction Count"),
        category.transactionCount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Percentage"),
        `${category.percentage.toFixed(1)}%`,
        20
      );
      doc.moveDown();
    });

    // Tendencias mensuales
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Monthly Trends"));
    doc.moveDown();

    data.monthlyTrends.forEach((trend: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 3)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, this.translate("Month"), trend.month, 20);
      this.drawDataItem(
        doc,
        this.translate("Total Amount"),
        trend.totalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Transaction Count"),
        trend.transactionCount,
        20
      );
      doc.moveDown();
    });
  }

  private formatDebtReport(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Debt Report"));
    doc.moveDown();

    // Resumen general
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Summary"));
    doc.moveDown();

    const summaryHeaders = [this.translate("Metric"), this.translate("Value")];
    const summaryRows = [
      [this.translate("Total Debts"), data.totalDebts],
      [this.translate("Total Original Amount"), data.totalOriginalAmount],
      [this.translate("Total Pending Amount"), data.totalPendingAmount],
      [this.translate("Total Paid Amount"), data.totalPaidAmount],
      [
        this.translate("Average Interest Rate"),
        `${data.averageInterestRate.toFixed(2)}%`,
      ],
      [this.translate("Overdue Count"), data.overdueCount],
    ];

    this.drawSummaryTable(
      doc,
      summaryHeaders,
      summaryRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Detalles de deudas
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Debt Details"));
    doc.moveDown();

    data.debts.forEach((debt: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 6)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Description"),
        debt.description,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Original Amount"),
        debt.originalAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Pending Amount"),
        debt.pendingAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Paid Amount"),
        debt.paidAmount,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Interest Rate"),
        `${debt.interestRate}%`,
        20
      );
      this.drawDataItem(doc, this.translate("Due Date"), debt.dueDate, 20);
      this.drawDataItem(doc, this.translate("Status"), debt.status, 20);
      if (debt.daysOverdue) {
        this.drawDataItem(
          doc,
          this.translate("Days Overdue"),
          debt.daysOverdue,
          20
        );
      }
      doc.moveDown();
    });
  }

  private formatComprehensiveReport(doc: typeof PDFDocument, data: any) {
    doc
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text(this.translate("Comprehensive Report"));
    doc.moveDown();

    // Información del período
    doc
      .fontSize(14)
      .fillColor(this.PRIMARY_COLOR)
      .text(`${this.translate("Period")}: ${data.period.label}`);
    doc.moveDown();

    // Resumen financiero
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Financial Summary"));
    doc.moveDown();

    const financialHeaders = [
      this.translate("Metric"),
      this.translate("Value"),
    ];
    const financialRows = [
      [this.translate("Total Income"), data.financialSummary.totalIncome],
      [this.translate("Total Expenses"), data.financialSummary.totalExpenses],
      [this.translate("Net Balance"), data.financialSummary.netBalance],
      [
        this.translate("Savings Rate"),
        `${data.financialSummary.savingsRate.toFixed(1)}%`,
      ],
    ];

    this.drawSummaryTable(
      doc,
      financialHeaders,
      financialRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Resumen de metas
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Goals Summary"));
    doc.moveDown();

    const goalsHeaders = [this.translate("Metric"), this.translate("Value")];
    const goalsRows = [
      [this.translate("Total Goals"), data.goals.totalGoals],
      [this.translate("Completed Goals"), data.goals.completedGoals],
      [this.translate("In Progress Goals"), data.goals.inProgressGoals],
      [this.translate("Total Target Amount"), data.goals.totalTargetAmount],
      [this.translate("Total Current Amount"), data.goals.totalCurrentAmount],
      [
        this.translate("Overall Progress"),
        `${data.goals.overallProgress.toFixed(1)}%`,
      ],
    ];

    this.drawSummaryTable(doc, goalsHeaders, goalsRows, 50, doc.y, [200, 150]);
    doc.moveDown();

    // Resumen de presupuestos
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Budgets Summary"));
    doc.moveDown();

    const budgetsHeaders = [this.translate("Metric"), this.translate("Value")];
    const budgetsRows = [
      [this.translate("Total Budgets"), data.budgets.totalBudgets],
      [this.translate("Total Budget Amount"), data.budgets.totalBudgetAmount],
      [this.translate("Total Spent"), data.budgets.totalSpent],
      [this.translate("Over Budget Count"), data.budgets.overBudgetCount],
    ];

    this.drawSummaryTable(
      doc,
      budgetsHeaders,
      budgetsRows,
      50,
      doc.y,
      [200, 150]
    );
    doc.moveDown();

    // Desglose por categoría
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Category Breakdown"));
    doc.moveDown();

    data.categoryBreakdown.forEach((category: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 5)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(
        doc,
        this.translate("Category"),
        category.categoryName,
        20
      );
      this.drawDataItem(doc, this.translate("Income"), category.income, 20);
      this.drawDataItem(doc, this.translate("Expenses"), category.expenses, 20);
      this.drawDataItem(
        doc,
        this.translate("Net Amount"),
        category.netAmount,
        20
      );
      if (category.budgetLimit) {
        this.drawDataItem(
          doc,
          this.translate("Budget Limit"),
          category.budgetLimit,
          20
        );
        this.drawDataItem(
          doc,
          this.translate("Budget Utilization"),
          `${category.budgetUtilization.toFixed(1)}%`,
          20
        );
      }
      doc.moveDown();
    });

    // Tendencias mensuales
    doc
      .fontSize(16)
      .fillColor(this.PRIMARY_COLOR)
      .text(this.translate("Monthly Trends"));
    doc.moveDown();

    data.monthlyTrends.forEach((trend: any) => {
      if (this.checkPageBreak(doc, this.SECTION_SPACING * 4)) {
        this.addNewPage(doc);
      }

      this.drawDataItem(doc, this.translate("Month"), trend.month, 20);
      this.drawDataItem(doc, this.translate("Income"), trend.income, 20);
      this.drawDataItem(doc, this.translate("Expenses"), trend.expenses, 20);
      this.drawDataItem(doc, this.translate("Balance"), trend.balance, 20);
      this.drawDataItem(
        doc,
        this.translate("Goal Contributions"),
        trend.goalContributions,
        20
      );
      this.drawDataItem(
        doc,
        this.translate("Debt Payments"),
        trend.debtPayments,
        20
      );
      doc.moveDown();
    });
  }
}
