import {
  Report,
  ReportFilters,
  ReportFormat,
  ReportType,
  GoalStatusReport,
  GoalCategoryReport,
  ContributionReport,
  SavingsComparisonReport,
  SavingsSummaryReport,
} from "../../domain/entities/report.entity";
import { ReportService } from "../../domain/services/report.service";
import { ReportRepository } from "../../domain/repositories/report.repository";
import { PgBudgetRepository } from "@/budgets/infrastructure/adapters/budget.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";

import { PgGoalContributionRepository } from "../../../goals/infrastucture/adapters/goal-contribution.repository";
import { PgGoalRepository } from "../../../goals/infrastucture/adapters/goal.repository";
import { ExcelService } from "../../infrastructure/services/excel.service";
import { CSVService } from "../../infrastructure/services/csv.service";
import { ICategory } from "../../../categories/domain/entities/ICategory";
import { IGoal } from "../../../goals/domain/entities/IGoal";
import { IGoalContribution } from "../../../goals/domain/entities/IGoalContribution";

export class ReportServiceImpl implements ReportService {
  private static instance: ReportServiceImpl;
  private reportRepository: ReportRepository;
  private goalRepository: PgGoalRepository;
  private goalContributionRepository: PgGoalContributionRepository;
  private budgetRepository: PgBudgetRepository;
  private transactionRepository: PgTransactionRepository;
  private readonly excelService: ExcelService;
  private readonly csvService: CSVService;

  private constructor(
    reportRepository: ReportRepository,
    goalRepository: PgGoalRepository,
    goalContributionRepository: PgGoalContributionRepository,
    budgetRepository: PgBudgetRepository,
    transactionRepository: PgTransactionRepository,
    excelService: ExcelService,
    csvService: CSVService
  ) {
    this.reportRepository = reportRepository;
    this.goalRepository = goalRepository;
    this.goalContributionRepository = goalContributionRepository;
    this.budgetRepository = budgetRepository;
    this.transactionRepository = transactionRepository;
    this.excelService = excelService;
    this.csvService = csvService;
  }

  public static getInstance(
    reportRepository: ReportRepository,
    goalRepository: PgGoalRepository,
    goalContributionRepository: PgGoalContributionRepository,
    budgetRepository: PgBudgetRepository,
    transactionRepository: PgTransactionRepository,
    excelService: ExcelService,
    csvService: CSVService
  ): ReportServiceImpl {
    if (!ReportServiceImpl.instance) {
      ReportServiceImpl.instance = new ReportServiceImpl(
        reportRepository,
        goalRepository,
        goalContributionRepository,
        budgetRepository,
        transactionRepository,
        excelService,
        csvService
      );
    }
    return ReportServiceImpl.instance;
  }

  async generateReport(
    type: ReportType,
    format: ReportFormat,
    filters: ReportFilters
  ): Promise<Report> {
    let data: any;

    switch (type) {
      case ReportType.GOALS_BY_STATUS:
        data = await this.generateGoalsByStatusReport(filters);
        break;
      case ReportType.GOALS_BY_CATEGORY:
        data = await this.generateGoalsByCategoryReport(filters);
        break;
      case ReportType.CONTRIBUTIONS_BY_GOAL:
        data = await this.generateContributionsByGoalReport(filters);
        break;
      case ReportType.SAVINGS_COMPARISON:
        data = await this.generateSavingsComparisonReport(filters);
        break;
      case ReportType.SAVINGS_SUMMARY:
        data = await this.generateSavingsSummaryReport(filters);
        break;
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    const report: Report = {
      id: this.generateReportId(),
      type,
      format,
      filters,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      data,
      userId: filters.userId ? parseInt(filters.userId) : 0,
    };

    return this.reportRepository.save(report);
  }

  async getReport(id: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new Error("Report not found");
    }
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    await this.reportRepository.delete(id);
  }

  async cleanupExpiredReports(): Promise<void> {
    await this.reportRepository.deleteExpired();
  }

  private async generateGoalsByStatusReport(
    filters: ReportFilters
  ): Promise<GoalStatusReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for goals by status report");
    }

    const goals = await this.goalRepository.findByFilters(filters);
    const now = new Date();

    if (goals.length === 0) {
      console.log("No goals found");

      return {
        completed: 0,
        expired: 0,
        inProgress: 0,
        total: 0,
        goals: [],
      };
    }

    let inProgressGoals = 0;
    let expiredGoals = 0;
    let completedGoals = 0;

    const report: GoalStatusReport = {
      completed: completedGoals,
      expired: expiredGoals,
      inProgress: inProgressGoals,
      total: goals.length,
      goals: goals.map((goal: IGoal) => {
        const status = this.determineGoalStatus(goal, now);
        if (status === "completed") completedGoals++;
        else if (status === "expired") expiredGoals++;
        else inProgressGoals++;

        return {
          id: goal.id?.toString() || "",
          name: goal.name,
          status,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          progress: (goal.currentAmount / goal.targetAmount) * 100,
          deadline: goal.endDate,
        };
      }),
    };

    return {
      ...report,
      completed: completedGoals,
      expired: expiredGoals,
      inProgress: inProgressGoals,
    };
  }

  private async generateGoalsByCategoryReport(
    filters: ReportFilters
  ): Promise<GoalCategoryReport> {
    const goals = await this.goalRepository.findByFilters(filters);
    const categories = await this.goalRepository.findAll();

    const report: GoalCategoryReport = {
      categories: categories.map((category: ICategory) => {
        const categoryGoals = goals.filter(
          (goal: IGoal) => goal.categoryId === category.id
        );
        const totalAmount = categoryGoals.reduce(
          (sum: number, goal: IGoal) => sum + goal.targetAmount,
          0
        );
        const completedAmount = categoryGoals.reduce(
          (sum: number, goal: IGoal) => sum + goal.currentAmount,
          0
        );

        return {
          id: category.id?.toString() || "",
          name: category.name,
          totalGoals: categoryGoals.length,
          totalAmount,
          completedAmount,
          progress: (completedAmount / totalAmount) * 100,
          goals: categoryGoals.map((goal: IGoal) => ({
            id: goal.id?.toString() || "",
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            progress: (goal.currentAmount / goal.targetAmount) * 100,
          })),
        };
      }),
    };

    return report;
  }

  private async generateContributionsByGoalReport(
    filters: ReportFilters
  ): Promise<ContributionReport> {
    if (!filters.goalId) {
      throw new Error("Goal ID is required for contributions report");
    }

    const goal = await this.goalRepository.findById(Number(filters.goalId));
    if (!goal) {
      throw new Error("Goal not found");
    }

    const contributions = await this.goalContributionRepository.findByGoalId(
      Number(filters.goalId)
    );

    const report: ContributionReport = {
      goalId: goal.id?.toString() || "",
      goalName: goal.name,
      contributions: contributions.map((contribution: IGoalContribution) => ({
        id: contribution.id?.toString() || "",
        amount: contribution.amount,
        date: contribution.date,
        transactionId: contribution.transactionId,
      })),
      totalContributions: contributions.reduce(
        (sum: number, c: IGoalContribution) => sum + c.amount,
        0
      ),
      averageContribution:
        contributions.length > 0
          ? contributions.reduce(
              (sum: number, c: IGoalContribution) => sum + c.amount,
              0
            ) / contributions.length
          : 0,
      lastContributionDate:
        contributions.length > 0
          ? contributions[contributions.length - 1].date
          : undefined,
    };

    return report;
  }

  private async generateSavingsComparisonReport(
    filters: ReportFilters
  ): Promise<SavingsComparisonReport> {
    if (!filters.goalId) {
      throw new Error("Goal ID is required for savings comparison report");
    }

    const goal = await this.goalRepository.findById(Number(filters.goalId));
    if (!goal) {
      throw new Error("Goal not found");
    }

    const contributions = await this.goalContributionRepository.findByGoalId(
      Number(filters.goalId)
    );

    const plannedSavings = this.calculatePlannedSavings(goal, filters);
    const actualSavings = this.calculateActualSavings(contributions, filters);

    const report: SavingsComparisonReport = {
      goalId: goal.id?.toString() || "",
      goalName: goal.name,
      plannedSavings,
      actualSavings,
      deviations: plannedSavings.map((planned, index) => ({
        date: planned.date,
        plannedAmount: planned.amount,
        actualAmount: actualSavings[index]?.amount || 0,
        difference: (actualSavings[index]?.amount || 0) - planned.amount,
      })),
    };

    return report;
  }

  private async generateSavingsSummaryReport(
    filters: ReportFilters
  ): Promise<SavingsSummaryReport> {
    const goals = await this.goalRepository.findByFilters(filters);
    const categories = await this.goalRepository.findAll();
    const contributions = await this.goalContributionRepository.findByFilters(
      filters
    );

    const now = new Date();
    const completedGoals = goals.filter(
      (g: IGoal) => g.currentAmount >= g.targetAmount
    ).length;
    const expiredGoals = goals.filter(
      (g: IGoal) => g.endDate < now && g.currentAmount < g.targetAmount
    ).length;
    const inProgressGoals = goals.length - completedGoals - expiredGoals;

    const report: SavingsSummaryReport = {
      totalGoals: goals.length,
      totalTargetAmount: goals.reduce(
        (sum: number, g: IGoal) => sum + g.targetAmount,
        0
      ),
      totalCurrentAmount: goals.reduce(
        (sum: number, g: IGoal) => sum + g.currentAmount,
        0
      ),
      overallProgress:
        (goals.reduce(
          (sum: number, g: IGoal) => sum + g.currentAmount / g.targetAmount,
          0
        ) /
          goals.length) *
        100,
      completedGoals,
      expiredGoals,
      inProgressGoals,
      averageContribution:
        contributions.length > 0
          ? contributions.reduce(
              (sum: number, c: IGoalContribution) => sum + c.amount,
              0
            ) / contributions.length
          : 0,
      lastContributionDate:
        contributions.length > 0
          ? contributions[contributions.length - 1].date
          : undefined,
      categoryBreakdown: categories.map((category: ICategory) => {
        const categoryGoals = goals.filter(
          (g: IGoal) => g.categoryId === category.id
        );
        const totalAmount = categoryGoals.reduce(
          (sum: number, g: IGoal) => sum + g.targetAmount,
          0
        );
        const currentAmount = categoryGoals.reduce(
          (sum: number, g: IGoal) => sum + g.currentAmount,
          0
        );

        return {
          categoryId: category.id?.toString() || "",
          categoryName: category.name,
          totalGoals: categoryGoals.length,
          totalAmount,
          progress: (currentAmount / totalAmount) * 100,
        };
      }),
    };

    return report;
  }

  private determineGoalStatus(
    goal: IGoal,
    now: Date
  ): "completed" | "expired" | "inProgress" {
    if (goal.currentAmount >= goal.targetAmount) return "completed";
    if (goal.endDate < now) return "expired";
    return "inProgress";
  }

  private calculatePlannedSavings(
    goal: IGoal,
    filters: ReportFilters
  ): Array<{ date: Date; amount: number }> {
    const startDate = filters.startDate || new Date();
    const endDate = filters.endDate || goal.endDate;
    const groupBy = filters.groupBy || "month";

    const plannedSavings = [];
    let currentDate = new Date(startDate);
    const monthlyTarget =
      goal.targetAmount / this.monthsBetween(startDate, endDate);

    while (currentDate <= endDate) {
      plannedSavings.push({
        date: new Date(currentDate),
        amount: monthlyTarget,
      });

      if (groupBy === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (groupBy === "week") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return plannedSavings;
  }

  private calculateActualSavings(
    contributions: IGoalContribution[],
    filters: ReportFilters
  ): Array<{ date: Date; amount: number }> {
    const groupBy = filters.groupBy || "month";
    const groupedContributions = new Map<string, number>();

    contributions.forEach((contribution) => {
      const date = new Date(contribution.date);
      let key: string;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${date.getMonth()}`;
      } else if (groupBy === "week") {
        const weekNumber = Math.floor(date.getDate() / 7);
        key = `${date.getFullYear()}-${date.getMonth()}-${weekNumber}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }

      const currentAmount = groupedContributions.get(key) || 0;
      groupedContributions.set(key, currentAmount + contribution.amount);
    });

    return Array.from(groupedContributions.entries())
      .map(([key, amount]) => {
        const [year, month, day] = key.split("-").map(Number);
        return {
          date: new Date(year, month, day || 1),
          amount,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private monthsBetween(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1
    );
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
