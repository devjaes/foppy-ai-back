import { Report, ReportType } from "../../domain/entities/report.entity";
import { Parser } from "json2csv";

export class CSVService {
  async generateCSV(report: Report): Promise<string> {
    let fields: string[] = [];
    let data: any[] = [];

    switch (report.type) {
      case ReportType.GOALS_BY_STATUS:
        ({ fields, data } = this.prepareGoalsByStatusData(report.data));
        break;
      case ReportType.GOALS_BY_CATEGORY:
        ({ fields, data } = this.prepareGoalsByCategoryData(report.data));
        break;
      case ReportType.CONTRIBUTIONS_BY_GOAL:
        ({ fields, data } = this.prepareContributionsByGoalData(report.data));
        break;
      case ReportType.SAVINGS_COMPARISON:
        ({ fields, data } = this.prepareSavingsComparisonData(report.data));
        break;
      case ReportType.SAVINGS_SUMMARY:
        ({ fields, data } = this.prepareSavingsSummaryData(report.data));
        break;
      default:
        throw new Error(
          `Unsupported report type for CSV export: ${report.type}`
        );
    }

    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  private prepareGoalsByStatusData(data: any): {
    fields: string[];
    data: any[];
  } {
    const fields = [
      "name",
      "status",
      "targetAmount",
      "currentAmount",
      "progress",
      "deadline",
    ];
    const rows = data.goals.map((goal: any) => ({
      name: goal.name,
      status: goal.status,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: goal.progress,
      deadline: goal.deadline,
    }));

    // Add summary rows
    rows.push(
      {},
      { name: "Summary" },
      { name: "Total Goals", status: data.total },
      { name: "Completed Goals", status: data.completed },
      { name: "Expired Goals", status: data.expired },
      { name: "In Progress Goals", status: data.inProgress }
    );

    return { fields, data: rows };
  }

  private prepareGoalsByCategoryData(data: any): {
    fields: string[];
    data: any[];
  } {
    const fields = [
      "category",
      "totalGoals",
      "totalAmount",
      "completedAmount",
      "progress",
    ];
    const rows: any[] = [];

    data.categories.forEach((category: any) => {
      rows.push({
        category: category.name,
        totalGoals: category.totalGoals,
        totalAmount: category.totalAmount,
        completedAmount: category.completedAmount,
        progress: category.progress,
      });

      category.goals.forEach((goal: any) => {
        rows.push({
          category: `  ${goal.name}`,
          totalGoals: "",
          totalAmount: goal.targetAmount,
          completedAmount: goal.currentAmount,
          progress: goal.progress,
        });
      });

      rows.push({});
    });

    return { fields, data: rows };
  }

  private prepareContributionsByGoalData(data: any): {
    fields: string[];
    data: any[];
  } {
    const fields = ["date", "amount", "transactionId"];
    const rows = [
      { date: "Goal Name", amount: data.goalName },
      {},
      ...data.contributions.map((contribution: any) => ({
        date: contribution.date,
        amount: contribution.amount,
        transactionId: contribution.transactionId,
      })),
      {},
      { date: "Total Contributions", amount: data.totalContributions },
      { date: "Average Contribution", amount: data.averageContribution },
      { date: "Last Contribution", amount: data.lastContributionDate },
    ];

    return { fields, data: rows };
  }

  private prepareSavingsComparisonData(data: any): {
    fields: string[];
    data: any[];
  } {
    const fields = ["date", "plannedAmount", "actualAmount", "difference"];
    const rows = [
      { date: "Goal Name", plannedAmount: data.goalName },
      {},
      ...data.deviations.map((deviation: any) => ({
        date: deviation.date,
        plannedAmount: deviation.plannedAmount,
        actualAmount: deviation.actualAmount,
        difference: deviation.difference,
      })),
    ];

    return { fields, data: rows };
  }

  private prepareSavingsSummaryData(data: any): {
    fields: string[];
    data: any[];
  } {
    const fields = ["metric", "value"];
    const rows = [
      { metric: "Total Goals", value: data.totalGoals },
      { metric: "Total Target Amount", value: data.totalTargetAmount },
      { metric: "Total Current Amount", value: data.totalCurrentAmount },
      { metric: "Overall Progress (%)", value: data.overallProgress },
      { metric: "Completed Goals", value: data.completedGoals },
      { metric: "Expired Goals", value: data.expiredGoals },
      { metric: "In Progress Goals", value: data.inProgressGoals },
      { metric: "Average Contribution", value: data.averageContribution },
      { metric: "Last Contribution Date", value: data.lastContributionDate },
      {},
      { metric: "Category Breakdown" },
    ];

    data.categoryBreakdown.forEach((category: any) => {
      rows.push(
        { metric: category.categoryName },
        { metric: "  Total Goals", value: category.totalGoals },
        { metric: "  Total Amount", value: category.totalAmount },
        { metric: "  Progress (%)", value: category.progress },
        {}
      );
    });

    return { fields, data: rows };
  }
}
