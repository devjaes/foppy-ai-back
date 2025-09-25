import { Report, ReportType } from "../../domain/entities/report.entity";
import { Workbook, Worksheet } from "exceljs";

export class ExcelService {
  async generateExcel(report: Report): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Report");

    switch (report.type) {
      case ReportType.GOALS_BY_STATUS:
        this.formatGoalsByStatus(worksheet, report.data);
        break;
      case ReportType.GOALS_BY_CATEGORY:
        this.formatGoalsByCategory(worksheet, report.data);
        break;
      case ReportType.CONTRIBUTIONS_BY_GOAL:
        this.formatContributionsByGoal(worksheet, report.data);
        break;
      case ReportType.SAVINGS_COMPARISON:
        this.formatSavingsComparison(worksheet, report.data);
        break;
      case ReportType.SAVINGS_SUMMARY:
        this.formatSavingsSummary(worksheet, report.data);
        break;
      default:
        throw new Error(
          `Unsupported report type for Excel export: ${report.type}`
        );
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  private formatGoalsByStatus(worksheet: Worksheet, data: any) {
    worksheet.addRow([
      "Name",
      "Status",
      "Target Amount",
      "Current Amount",
      "Progress",
      "Deadline",
    ]);

    data.goals?.forEach((goal: any) => {
      worksheet.addRow([
        goal.name,
        goal.status,
        goal.targetAmount,
        goal.currentAmount,
        goal.progress,
        goal.deadline,
      ]);
    });

    worksheet.addRow([]);
    worksheet.addRow(["Summary"]);
    worksheet.addRow(["Total Goals", data.total]);
    worksheet.addRow(["Completed Goals", data.completed]);
    worksheet.addRow(["Expired Goals", data.expired]);
    worksheet.addRow(["In Progress Goals", data.inProgress]);
  }

  private formatGoalsByCategory(worksheet: Worksheet, data: any) {
    worksheet.addRow([
      "Category",
      "Total Goals",
      "Total Amount",
      "Completed Amount",
      "Progress",
    ]);

    data.categories.forEach((category: any) => {
      worksheet.addRow([
        category.name,
        category.totalGoals,
        category.totalAmount,
        category.completedAmount,
        category.progress,
      ]);

      category.goals.forEach((goal: any) => {
        worksheet.addRow([
          `  ${goal.name}`,
          "",
          goal.targetAmount,
          goal.currentAmount,
          goal.progress,
        ]);
      });

      worksheet.addRow([]);
    });
  }

  private formatContributionsByGoal(worksheet: Worksheet, data: any) {
    worksheet.addRow(["Date", "Amount", "Transaction ID"]);

    worksheet.addRow(["Goal Name", data.goalName]);
    worksheet.addRow([]);

    data.contributions.forEach((contribution: any) => {
      worksheet.addRow([
        contribution.date,
        contribution.amount,
        contribution.transactionId,
      ]);
    });

    worksheet.addRow([]);
    worksheet.addRow(["Total Contributions", data.totalContributions]);
    worksheet.addRow(["Average Contribution", data.averageContribution]);
    worksheet.addRow(["Last Contribution", data.lastContributionDate]);
  }

  private formatSavingsComparison(worksheet: Worksheet, data: any) {
    worksheet.addRow(["Date", "Planned Amount", "Actual Amount", "Difference"]);

    worksheet.addRow(["Goal Name", data.goalName]);
    worksheet.addRow([]);

    data.deviations.forEach((deviation: any) => {
      worksheet.addRow([
        deviation.date,
        deviation.plannedAmount,
        deviation.actualAmount,
        deviation.difference,
      ]);
    });
  }

  private formatSavingsSummary(worksheet: Worksheet, data: any) {
    worksheet.addRow(["Metric", "Value"]);

    worksheet.addRow(["Total Goals", data.totalGoals]);
    worksheet.addRow(["Total Target Amount", data.totalTargetAmount]);
    worksheet.addRow(["Total Current Amount", data.totalCurrentAmount]);
    worksheet.addRow(["Overall Progress (%)", data.overallProgress]);
    worksheet.addRow(["Completed Goals", data.completedGoals]);
    worksheet.addRow(["Expired Goals", data.expiredGoals]);
    worksheet.addRow(["In Progress Goals", data.inProgressGoals]);
    worksheet.addRow(["Average Contribution", data.averageContribution]);
    worksheet.addRow(["Last Contribution Date", data.lastContributionDate]);

    worksheet.addRow([]);
    worksheet.addRow(["Category Breakdown"]);

    data.categoryBreakdown.forEach((category: any) => {
      worksheet.addRow([category.categoryName]);
      worksheet.addRow(["  Total Goals", category.totalGoals]);
      worksheet.addRow(["  Total Amount", category.totalAmount]);
      worksheet.addRow(["  Progress (%)", category.progress]);
      worksheet.addRow([]);
    });
  }
}
