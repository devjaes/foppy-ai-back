import { Report, ReportType } from "../../domain/entities/report.entity";
import { Parser } from "json2csv";
import {
  prepareGoalsByStatusData,
  prepareGoalsByCategoryData,
  prepareContributionsByGoalData,
  prepareSavingsComparisonData,
  prepareSavingsSummaryData,
} from "./csv/csv-goal-formatters";
import {
  prepareTransactionsSummaryData,
  prepareExpensesByCategoryData,
  prepareMonthlyTrendData,
} from "./csv/csv-transaction-formatters";
import { prepareBudgetPerformanceData } from "./csv/csv-budget-formatters";
import { prepareFinancialOverviewData } from "./csv/csv-overview-formatters";

export class CSVService {
  async generateCSV(report: Report): Promise<string> {
    let fields: string[] = [];
    let data: any[] = [];

    switch (report.type) {
      case ReportType.GOALS_BY_STATUS:
        ({ fields, data } = prepareGoalsByStatusData(report.data));
        break;
      case ReportType.GOALS_BY_CATEGORY:
        ({ fields, data } = prepareGoalsByCategoryData(report.data));
        break;
      case ReportType.CONTRIBUTIONS_BY_GOAL:
        ({ fields, data } = prepareContributionsByGoalData(report.data));
        break;
      case ReportType.SAVINGS_COMPARISON:
        ({ fields, data } = prepareSavingsComparisonData(report.data));
        break;
      case ReportType.SAVINGS_SUMMARY:
        ({ fields, data } = prepareSavingsSummaryData(report.data));
        break;
      case ReportType.TRANSACTIONS_SUMMARY:
        ({ fields, data } = prepareTransactionsSummaryData(report.data));
        break;
      case ReportType.EXPENSES_BY_CATEGORY:
        ({ fields, data } = prepareExpensesByCategoryData(report.data));
        break;
      case ReportType.MONTHLY_TREND:
        ({ fields, data } = prepareMonthlyTrendData(report.data));
        break;
      case ReportType.BUDGET_PERFORMANCE:
        ({ fields, data } = prepareBudgetPerformanceData(report.data));
        break;
      case ReportType.FINANCIAL_OVERVIEW:
        ({ fields, data } = prepareFinancialOverviewData(report.data));
        break;
      default:
        throw new Error(
          `Unsupported report type for CSV export: ${report.type}`
        );
    }

    const parser = new Parser({ fields });
    return parser.parse(data);
  }
}
