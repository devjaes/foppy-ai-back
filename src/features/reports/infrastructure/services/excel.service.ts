import { Report, ReportType } from "../../domain/entities/report.entity";
import { Workbook, Worksheet } from "exceljs";
import {
  formatGoalsByStatus,
  formatGoalsByCategory,
  formatContributionsByGoal,
  formatSavingsComparison,
  formatSavingsSummary,
} from "./excel/excel-goal-formatters";
import {
  formatTransactionsSummary,
  formatExpensesByCategory,
  formatMonthlyTrend,
} from "./excel/excel-transaction-formatters";
import { formatBudgetPerformance } from "./excel/excel-budget-formatters";
import { formatFinancialOverview } from "./excel/excel-overview-formatters";

export class ExcelService {
  async generateExcel(report: Report): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Report");

    switch (report.type) {
      case ReportType.GOALS_BY_STATUS:
        formatGoalsByStatus(worksheet, report.data);
        break;
      case ReportType.GOALS_BY_CATEGORY:
        formatGoalsByCategory(worksheet, report.data);
        break;
      case ReportType.CONTRIBUTIONS_BY_GOAL:
        formatContributionsByGoal(worksheet, report.data);
        break;
      case ReportType.SAVINGS_COMPARISON:
        formatSavingsComparison(worksheet, report.data);
        break;
      case ReportType.SAVINGS_SUMMARY:
        formatSavingsSummary(worksheet, report.data);
        break;
      case ReportType.TRANSACTIONS_SUMMARY:
        formatTransactionsSummary(worksheet, report.data);
        break;
      case ReportType.EXPENSES_BY_CATEGORY:
        formatExpensesByCategory(worksheet, report.data);
        break;
      case ReportType.MONTHLY_TREND:
        formatMonthlyTrend(worksheet, report.data);
        break;
      case ReportType.BUDGET_PERFORMANCE:
        formatBudgetPerformance(worksheet, report.data);
        break;
      case ReportType.FINANCIAL_OVERVIEW:
        formatFinancialOverview(worksheet, report.data);
        break;
      default:
        throw new Error(
          `Unsupported report type for Excel export: ${report.type}`
        );
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
