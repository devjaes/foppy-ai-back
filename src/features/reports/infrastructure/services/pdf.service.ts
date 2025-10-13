import { Report, ReportType } from "../../domain/entities/report.entity";
import PDFDocument from "pdfkit";
import {
  addModernHeader,
  addModernFooter,
  addReportTitle,
} from "./pdf/pdf-layout";
import { DIMENSIONS, COLORS } from "./pdf/pdf-utils";
import {
  formatGoalsByStatus,
  formatGoalsByCategory,
  formatContributionsByGoal,
  formatSavingsComparison,
  formatSavingsSummary,
} from "./pdf/pdf-goal-formatters";
import {
  formatTransactionsSummary,
  formatExpensesByCategory,
  formatMonthlyTrend,
} from "./pdf/pdf-transaction-formatters";
import { formatBudgetPerformance } from "./pdf/pdf-budget-formatters";
import { formatFinancialOverview } from "./pdf/pdf-overview-formatters";

export class PDFService {
  async generatePDF(report: Report): Promise<Buffer> {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
      info: {
        Title: `Reporte Financiero - ${this.getReportTypeLabel(report.type)}`,
        Author: "FoppyAI",
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

      try {
        addModernHeader(doc, this.getReportTypeLabel(report.type));
        doc.moveDown(1);
        addReportTitle(doc, this.getReportTypeLabel(report.type));
        doc.moveDown(1);

        const reportTitle = this.getReportTypeLabel(report.type);

        switch (report.type) {
          case ReportType.GOALS_BY_STATUS:
            formatGoalsByStatus(doc, report.data, reportTitle);
            break;
          case ReportType.GOALS_BY_CATEGORY:
            formatGoalsByCategory(doc, report.data, reportTitle);
            break;
          case ReportType.CONTRIBUTIONS_BY_GOAL:
            formatContributionsByGoal(doc, report.data, reportTitle);
            break;
          case ReportType.SAVINGS_COMPARISON:
            formatSavingsComparison(doc, report.data, reportTitle);
            break;
          case ReportType.SAVINGS_SUMMARY:
            formatSavingsSummary(doc, report.data, reportTitle);
            break;
          case ReportType.TRANSACTIONS_SUMMARY:
            formatTransactionsSummary(doc, report.data, reportTitle);
            break;
          case ReportType.EXPENSES_BY_CATEGORY:
            formatExpensesByCategory(doc, report.data, reportTitle);
            break;
          case ReportType.MONTHLY_TREND:
            formatMonthlyTrend(doc, report.data, reportTitle);
            break;
          case ReportType.BUDGET_PERFORMANCE:
            formatBudgetPerformance(doc, report.data, reportTitle);
            break;
          case ReportType.FINANCIAL_OVERVIEW:
            formatFinancialOverview(doc, report.data, reportTitle);
            break;
          default:
            throw new Error(
              `Unsupported report type for PDF export: ${report.type}`
            );
        }

        const pageRange = doc.bufferedPageRange();
        const pageCount = pageRange.count;
        
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          
          const savedY = doc.y;
          const savedX = doc.x;
          const footerY = DIMENSIONS.PAGE_HEIGHT - DIMENSIONS.FOOTER_HEIGHT;
          
          doc
            .rect(0, footerY, DIMENSIONS.PAGE_WIDTH, 2)
            .fillColor(COLORS.MEDIUM_GRAY)
            .fill();

          doc
            .fontSize(8)
            .fillColor(COLORS.TEXT)
            .font("Helvetica");
          
          const textWidth = doc.widthOfString(`© ${new Date().getFullYear()} FoppyAI. Todos los derechos reservados.`);
          const textX = (DIMENSIONS.PAGE_WIDTH - textWidth) / 2;
          
          doc.text(
            `© ${new Date().getFullYear()} FoppyAI. Todos los derechos reservados.`,
            textX,
            footerY + 15,
            { 
              lineBreak: false,
              continued: false
            }
          );
          
          doc.x = savedX;
          doc.y = savedY;
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getReportTypeLabel(type: ReportType): string {
    const labels: Record<ReportType, string> = {
      [ReportType.GOAL]: "Reporte de Meta",
      [ReportType.CONTRIBUTION]: "Reporte de Contribuciones",
      [ReportType.BUDGET]: "Reporte de Presupuesto",
      [ReportType.EXPENSE]: "Reporte de Gastos",
      [ReportType.INCOME]: "Reporte de Ingresos",
      [ReportType.GOALS_BY_STATUS]: "Metas por Estado",
      [ReportType.GOALS_BY_CATEGORY]: "Metas por Categoría",
      [ReportType.CONTRIBUTIONS_BY_GOAL]: "Contribuciones por Meta",
      [ReportType.SAVINGS_COMPARISON]: "Comparación de Ahorro",
      [ReportType.SAVINGS_SUMMARY]: "Resumen de Ahorro",
      [ReportType.TRANSACTIONS_SUMMARY]: "Resumen de Transacciones",
      [ReportType.EXPENSES_BY_CATEGORY]: "Gastos por Categoría",
      [ReportType.MONTHLY_TREND]: "Tendencia Mensual",
      [ReportType.BUDGET_PERFORMANCE]: "Rendimiento de Presupuestos",
      [ReportType.FINANCIAL_OVERVIEW]: "Vista General Financiera",
    };
    return labels[type] || "Reporte Financiero";
  }
}
