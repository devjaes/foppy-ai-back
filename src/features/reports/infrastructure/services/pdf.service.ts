import { Report, ReportType } from "../../domain/entities/report.entity";
import PDFDocument from "pdfkit";
import { addModernHeader, addModernFooter, addReportTitle } from "./pdf/pdf-layout";
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

        switch (report.type) {
          case ReportType.GOALS_BY_STATUS:
            formatGoalsByStatus(doc, report.data);
            break;
          case ReportType.GOALS_BY_CATEGORY:
            formatGoalsByCategory(doc, report.data);
            break;
          case ReportType.CONTRIBUTIONS_BY_GOAL:
            formatContributionsByGoal(doc, report.data);
            break;
          case ReportType.SAVINGS_COMPARISON:
            formatSavingsComparison(doc, report.data);
            break;
          case ReportType.SAVINGS_SUMMARY:
            formatSavingsSummary(doc, report.data);
            break;
          case ReportType.TRANSACTIONS_SUMMARY:
            formatTransactionsSummary(doc, report.data);
            break;
          case ReportType.EXPENSES_BY_CATEGORY:
            formatExpensesByCategory(doc, report.data);
            break;
          case ReportType.MONTHLY_TREND:
            formatMonthlyTrend(doc, report.data);
            break;
          case ReportType.BUDGET_PERFORMANCE:
            formatBudgetPerformance(doc, report.data);
            break;
          case ReportType.FINANCIAL_OVERVIEW:
            formatFinancialOverview(doc, report.data);
            break;
          default:
            throw new Error(`Unsupported report type for PDF export: ${report.type}`);
        }

        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          addModernFooter(doc, i + 1, pageCount);
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
