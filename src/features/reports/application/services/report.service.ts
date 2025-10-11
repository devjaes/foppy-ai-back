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
  TransactionsSummaryReport,
  ExpensesByCategoryReport,
  MonthlyTrendReport,
  BudgetPerformanceReport,
  FinancialOverviewReport,
} from "../../domain/entities/report.entity";
import { ReportService } from "../../domain/services/report.service";
import { ReportRepository } from "../../domain/repositories/report.repository";
import { PgBudgetRepository } from "@/budgets/infrastructure/adapters/budget.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";

import { PgGoalContributionRepository } from "../../../goals/infrastucture/adapters/goal-contribution.repository";
import { PgGoalRepository } from "../../../goals/infrastucture/adapters/goal.repository";
import { ExcelService } from "../../infrastructure/services/excel.service";
import { CSVService } from "../../infrastructure/services/csv.service";
import { IGoal } from "../../../goals/domain/entities/IGoal";
import { IGoalContribution } from "../../../goals/domain/entities/IGoalContribution";
import { ITransaction } from "@/transactions/domain/entities/ITransaction";
import { IBudget } from "@/budgets/domain/entities/IBudget";

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
      case ReportType.TRANSACTIONS_SUMMARY:
        data = await this.generateTransactionsSummaryReport(filters);
        break;
      case ReportType.EXPENSES_BY_CATEGORY:
        data = await this.generateExpensesByCategoryReport(filters);
        break;
      case ReportType.MONTHLY_TREND:
        data = await this.generateMonthlyTrendReport(filters);
        break;
      case ReportType.BUDGET_PERFORMANCE:
        data = await this.generateBudgetPerformanceReport(filters);
        break;
      case ReportType.FINANCIAL_OVERVIEW:
        data = await this.generateFinancialOverviewReport(filters);
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

  private async generateTransactionsSummaryReport(
    filters: ReportFilters
  ): Promise<TransactionsSummaryReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for transactions summary report");
    }

    const transactions = await this.transactionRepository.findByFilters(
      Number(filters.userId),
      {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        type: undefined,
      }
    );

    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        averageIncome: 0,
        averageExpense: 0,
        transactions: [],
      };
    }

    const incomeTransactions = transactions.filter(
      (t: ITransaction) => t.type === "INCOME"
    );
    const expenseTransactions = transactions.filter(
      (t: ITransaction) => t.type === "EXPENSE"
    );

    const totalIncome = incomeTransactions.reduce(
      (sum: number, t: ITransaction) => sum + (t.amount || 0),
      0
    );
    const totalExpense = expenseTransactions.reduce(
      (sum: number, t: ITransaction) => sum + (t.amount || 0),
      0
    );

    const categoryTotals = new Map<
      string,
      { name: string; amount: number; type: string }
    >();
    transactions.forEach((t: ITransaction) => {
      const categoryName = t.category?.name || "Sin categoría";
      const key = `${t.type}-${categoryName}`;

      if (!categoryTotals.has(key)) {
        categoryTotals.set(key, {
          name: categoryName,
          amount: 0,
          type: t.type,
        });
      }

      const current = categoryTotals.get(key)!;
      current.amount += t.amount || 0;
    });

    const topIncome = Array.from(categoryTotals.values())
      .filter((c) => c.type === "INCOME")
      .sort((a, b) => b.amount - a.amount)[0];

    const topExpense = Array.from(categoryTotals.values())
      .filter((c) => c.type === "EXPENSE")
      .sort((a, b) => b.amount - a.amount)[0];

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
      transactionCount: transactions.length,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      averageIncome:
        incomeTransactions.length > 0
          ? Math.round((totalIncome / incomeTransactions.length) * 100) / 100
          : 0,
      averageExpense:
        expenseTransactions.length > 0
          ? Math.round((totalExpense / expenseTransactions.length) * 100) / 100
          : 0,
      topIncomeCategory: topIncome
        ? { name: topIncome.name, amount: topIncome.amount }
        : undefined,
      topExpenseCategory: topExpense
        ? { name: topExpense.name, amount: topExpense.amount }
        : undefined,
      transactions: transactions.map((t: ITransaction) => ({
        id: t.id?.toString() || "",
        type: t.type as "INCOME" | "EXPENSE",
        amount: t.amount || 0,
        category: t.category?.name,
        description: t.description || undefined,
        date: t.date || new Date(),
      })),
    };
  }

  private async generateExpensesByCategoryReport(
    filters: ReportFilters
  ): Promise<ExpensesByCategoryReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for expenses by category report");
    }

    const transactions = await this.transactionRepository.findByFilters(
      Number(filters.userId),
      {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        type: "EXPENSE",
      }
    );

    if (transactions.length === 0) {
      return {
        totalExpenses: 0,
        categoryCount: 0,
        categories: [],
      };
    }

    const totalExpenses = transactions.reduce(
      (sum: number, t: ITransaction) => sum + (t.amount || 0),
      0
    );

    const categoryMap = new Map<
      string,
      { id: string; name: string; transactions: ITransaction[] }
    >();

    transactions.forEach((t: ITransaction) => {
      const categoryId = t.categoryId?.toString() || "sin-categoria";
      const categoryName = t.category?.name || "Sin categoría";

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          transactions: [],
        });
      }

      categoryMap.get(categoryId)!.transactions.push(t);
    });

    const categories = Array.from(categoryMap.values())
      .map((category) => {
        const amount = category.transactions.reduce(
          (sum: number, t: ITransaction) => sum + (t.amount || 0),
          0
        );
        const percentage =
          totalExpenses > 0
            ? Math.round((amount / totalExpenses) * 100 * 100) / 100
            : 0;

        return {
          id: category.id,
          name: category.name,
          amount: Math.round(amount * 100) / 100,
          percentage,
          transactionCount: category.transactions.length,
          transactions: category.transactions.map((t: ITransaction) => ({
            id: t.id?.toString() || "",
            amount: t.amount || 0,
            description: t.description || undefined,
            date: t.date || new Date(),
          })),
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      categoryCount: categories.length,
      categories,
    };
  }

  private async generateMonthlyTrendReport(
    filters: ReportFilters
  ): Promise<MonthlyTrendReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for monthly trend report");
    }

    const transactions = await this.transactionRepository.findByFilters(
      Number(filters.userId),
      {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        type: undefined,
      }
    );

    if (transactions.length === 0) {
      return {
        months: [],
        averageMonthlyIncome: 0,
        averageMonthlyExpense: 0,
        trend: "stable",
      };
    }

    const monthlyData = new Map<
      string,
      { income: number; expense: number; count: number }
    >();

    transactions.forEach((t: ITransaction) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0, count: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      data.count++;

      if (t.type === "INCOME") {
        data.income += t.amount || 0;
      } else {
        data.expense += t.amount || 0;
      }
    });

    const months = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        balance: Math.round((data.income - data.expense) * 100) / 100,
        transactionCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = months.reduce((sum, m) => sum + m.expense, 0);
    const averageMonthlyIncome =
      months.length > 0
        ? Math.round((totalIncome / months.length) * 100) / 100
        : 0;
    const averageMonthlyExpense =
      months.length > 0
        ? Math.round((totalExpense / months.length) * 100) / 100
        : 0;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (months.length >= 2) {
      const firstHalf = months.slice(0, Math.floor(months.length / 2));
      const secondHalf = months.slice(Math.floor(months.length / 2));

      const firstHalfBalance =
        firstHalf.reduce((sum, m) => sum + m.balance, 0) / firstHalf.length;
      const secondHalfBalance =
        secondHalf.reduce((sum, m) => sum + m.balance, 0) / secondHalf.length;

      if (secondHalfBalance > firstHalfBalance * 1.1) trend = "increasing";
      else if (secondHalfBalance < firstHalfBalance * 0.9) trend = "decreasing";
    }

    return {
      months,
      averageMonthlyIncome,
      averageMonthlyExpense,
      trend,
    };
  }

  private async generateBudgetPerformanceReport(
    filters: ReportFilters
  ): Promise<BudgetPerformanceReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for budget performance report");
    }

    const budgets = await this.budgetRepository.findByUserId(
      Number(filters.userId)
    );

    if (budgets.length === 0) {
      return {
        totalBudgets: 0,
        exceededCount: 0,
        warningCount: 0,
        goodCount: 0,
        budgets: [],
      };
    }

    let exceededCount = 0;
    let warningCount = 0;
    let goodCount = 0;

    const budgetDetails = budgets.map((budget: IBudget) => {
      const limitAmount = budget.limitAmount || 0;
      const currentAmount = budget.currentAmount || 0;
      const percentage =
        limitAmount > 0
          ? Math.round((currentAmount / limitAmount) * 100 * 100) / 100
          : 0;

      let status: "exceeded" | "warning" | "good";
      if (percentage >= 100) {
        status = "exceeded";
        exceededCount++;
      } else if (percentage >= 80) {
        status = "warning";
        warningCount++;
      } else {
        status = "good";
        goodCount++;
      }

      const startDate = budget.month ? new Date(budget.month) : new Date();
      const monthKey = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}`;

      return {
        id: budget.id?.toString() || "",
        categoryName: budget.category?.name || "Sin categoría",
        limitAmount: Math.round(limitAmount * 100) / 100,
        currentAmount: Math.round(currentAmount * 100) / 100,
        percentage,
        status,
        month: monthKey,
      };
    });

    return {
      totalBudgets: budgets.length,
      exceededCount,
      warningCount,
      goodCount,
      budgets: budgetDetails,
    };
  }

  private async generateFinancialOverviewReport(
    filters: ReportFilters
  ): Promise<FinancialOverviewReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for financial overview report");
    }

    const startDate =
      filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    const [transactions, goals, budgets] = await Promise.all([
      this.transactionRepository.findByFilters(Number(filters.userId), {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        type: undefined,
      }),
      this.goalRepository.findByFilters({ userId: filters.userId }),
      this.budgetRepository.findByUserId(Number(filters.userId)),
    ]);

    const totalIncome = transactions
      .filter((t: ITransaction) => t.type === "INCOME")
      .reduce((sum: number, t: ITransaction) => sum + (t.amount || 0), 0);

    const totalExpense = transactions
      .filter((t: ITransaction) => t.type === "EXPENSE")
      .reduce((sum: number, t: ITransaction) => sum + (t.amount || 0), 0);

    const netBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.round((netBalance / totalIncome) * 100 * 100) / 100
        : 0;

    const now = new Date();
    const completedGoals = goals.filter(
      (g: IGoal) => (g.currentAmount || 0) >= (g.targetAmount || 0)
    ).length;
    const inProgressGoals = goals.filter(
      (g: IGoal) =>
        (g.currentAmount || 0) < (g.targetAmount || 0) && g.endDate >= now
    ).length;
    const totalSaved = goals.reduce(
      (sum: number, g: IGoal) => sum + (g.currentAmount || 0),
      0
    );
    const totalTarget = goals.reduce(
      (sum: number, g: IGoal) => sum + (g.targetAmount || 0),
      0
    );
    const overallProgress =
      totalTarget > 0
        ? Math.round((totalSaved / totalTarget) * 100 * 100) / 100
        : 0;

    const exceededBudgets = budgets.filter(
      (b: IBudget) => (b.currentAmount || 0) >= (b.limitAmount || 0)
    ).length;
    const totalUtilization = budgets.reduce((sum: number, b: IBudget) => {
      const limit = b.limitAmount || 0;
      const current = b.currentAmount || 0;
      return sum + (limit > 0 ? (current / limit) * 100 : 0);
    }, 0);
    const averageUtilization =
      budgets.length > 0
        ? Math.round((totalUtilization / budgets.length) * 100) / 100
        : 0;

    const expenseCategoryTotals = new Map<string, number>();
    const incomeCategoryTotals = new Map<string, number>();

    transactions.forEach((t: ITransaction) => {
      const categoryName = t.category?.name || "Sin categoría";
      const amount = t.amount || 0;

      if (t.type === "EXPENSE") {
        expenseCategoryTotals.set(
          categoryName,
          (expenseCategoryTotals.get(categoryName) || 0) + amount
        );
      } else {
        incomeCategoryTotals.set(
          categoryName,
          (incomeCategoryTotals.get(categoryName) || 0) + amount
        );
      }
    });

    const topExpenses = Array.from(expenseCategoryTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        percentage:
          totalExpense > 0
            ? Math.round((amount / totalExpense) * 100 * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topIncome = Array.from(incomeCategoryTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        percentage:
          totalIncome > 0
            ? Math.round((amount / totalIncome) * 100 * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
        savingsRate,
      },
      goals: {
        total: goals.length,
        completed: completedGoals,
        inProgress: inProgressGoals,
        totalSaved: Math.round(totalSaved * 100) / 100,
        totalTarget: Math.round(totalTarget * 100) / 100,
        overallProgress,
      },
      budgets: {
        total: budgets.length,
        exceeded: exceededBudgets,
        averageUtilization,
      },
      debts: {
        total: 0,
        totalAmount: 0,
        totalPending: 0,
      },
      topCategories: {
        expenses: topExpenses,
        income: topIncome,
      },
    };
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
      console.log("No goals found for user:", filters.userId);

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

    const goalsWithStatus = goals.map((goal: IGoal) => {
      const status = this.determineGoalStatus(goal, now);

      if (status === "completed") completedGoals++;
      else if (status === "expired") expiredGoals++;
      else inProgressGoals++;

      // Validaciones null-safe
      const targetAmount = goal.targetAmount || 0;
      const currentAmount = goal.currentAmount || 0;
      const progress =
        targetAmount > 0
          ? Math.round((currentAmount / targetAmount) * 100 * 100) / 100
          : 0;

      return {
        id: goal.id?.toString() || "",
        name: goal.name || "Sin nombre",
        status,
        targetAmount,
        currentAmount,
        progress,
        deadline: goal.endDate || new Date(),
        categoryName: goal.category?.name || "Sin categoría", // ADDED
      };
    });

    return {
      completed: completedGoals,
      expired: expiredGoals,
      inProgress: inProgressGoals,
      total: goals.length,
      goals: goalsWithStatus,
    };
  }

  private async generateGoalsByCategoryReport(
    filters: ReportFilters
  ): Promise<GoalCategoryReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for goals by category report");
    }

    const goals = await this.goalRepository.findByFilters(filters);

    if (goals.length === 0) {
      console.log("No goals found for user:", filters.userId);

      return {
        totalCategories: 0,
        totalGoals: 0,
        categories: [],
      };
    }

    // Agrupar metas por categoría
    const goalsByCategory = new Map<string, IGoal[]>();

    goals.forEach((goal: IGoal) => {
      const categoryId = goal.categoryId?.toString() || "sin-categoria";
      const categoryName = goal.category?.name || "Sin categoría";
      const key = `${categoryId}|${categoryName}`;

      if (!goalsByCategory.has(key)) {
        goalsByCategory.set(key, []);
      }
      goalsByCategory.get(key)!.push(goal);
    });

    const now = new Date();
    const categories = Array.from(goalsByCategory.entries()).map(
      ([key, categoryGoals]) => {
        const [categoryId, categoryName] = key.split("|");

        const totalAmount = categoryGoals.reduce(
          (sum: number, goal: IGoal) => sum + (goal.targetAmount || 0),
          0
        );
        const completedAmount = categoryGoals.reduce(
          (sum: number, goal: IGoal) => sum + (goal.currentAmount || 0),
          0
        );
        const progress =
          totalAmount > 0
            ? Math.round((completedAmount / totalAmount) * 100 * 100) / 100
            : 0;

        return {
          id: categoryId,
          name: categoryName,
          totalGoals: categoryGoals.length,
          totalAmount,
          completedAmount,
          progress,
          goals: categoryGoals.map((goal: IGoal) => {
            const targetAmount = goal.targetAmount || 0;
            const currentAmount = goal.currentAmount || 0;
            const goalProgress =
              targetAmount > 0
                ? Math.round((currentAmount / targetAmount) * 100 * 100) / 100
                : 0;

            return {
              id: goal.id?.toString() || "",
              name: goal.name || "Sin nombre",
              targetAmount,
              currentAmount,
              progress: goalProgress,
              endDate: goal.endDate || new Date(),
              status: this.determineGoalStatus(goal, now),
            };
          }),
        };
      }
    );

    return {
      totalCategories: categories.length,
      totalGoals: goals.length,
      categories,
    };
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

    const totalContributions = contributions.reduce(
      (sum: number, c: IGoalContribution) => sum + (c.amount || 0),
      0
    );

    const report: ContributionReport = {
      goalId: goal.id?.toString() || "",
      goalName: goal.name || "Sin nombre",
      contributions: contributions.map((contribution: IGoalContribution) => ({
        id: contribution.id?.toString() || "",
        amount: contribution.amount || 0,
        date: contribution.date || new Date(),
        transactionId: contribution?.id?.toString(),
      })),
      totalContributions,
      averageContribution:
        contributions.length > 0
          ? Math.round((totalContributions / contributions.length) * 100) / 100
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
      goalName: goal.name || "Sin nombre",
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
    if (!filters.userId) {
      throw new Error("User ID is required for savings summary report");
    }

    const goals = await this.goalRepository.findByFilters(filters);
    const contributions = await this.goalContributionRepository.findByFilters(
      filters
    );

    if (goals.length === 0) {
      return {
        totalGoals: 0,
        totalTargetAmount: 0,
        totalCurrentAmount: 0,
        overallProgress: 0,
        completedGoals: 0,
        expiredGoals: 0,
        inProgressGoals: 0,
        averageContribution: 0,
        lastContributionDate: undefined,
        categoryBreakdown: [],
      };
    }

    const now = new Date();
    const completedGoals = goals.filter(
      (g: IGoal) => (g.currentAmount || 0) >= (g.targetAmount || 0)
    ).length;
    const expiredGoals = goals.filter(
      (g: IGoal) =>
        g.endDate < now && (g.currentAmount || 0) < (g.targetAmount || 0)
    ).length;
    const inProgressGoals = goals.length - completedGoals - expiredGoals;

    const totalTargetAmount = goals.reduce(
      (sum: number, g: IGoal) => sum + (g.targetAmount || 0),
      0
    );
    const totalCurrentAmount = goals.reduce(
      (sum: number, g: IGoal) => sum + (g.currentAmount || 0),
      0
    );

    const overallProgress =
      totalTargetAmount > 0
        ? Math.round((totalCurrentAmount / totalTargetAmount) * 100 * 100) / 100
        : 0;

    const totalContributions = contributions.reduce(
      (sum: number, c: IGoalContribution) => sum + (c.amount || 0),
      0
    );

    // Agrupar por categoría
    const goalsByCategory = new Map<string, IGoal[]>();
    goals.forEach((goal: IGoal) => {
      const categoryId = goal.categoryId?.toString() || "sin-categoria";
      const categoryName = goal.category?.name || "Sin categoría";
      const key = `${categoryId}|${categoryName}`;

      if (!goalsByCategory.has(key)) {
        goalsByCategory.set(key, []);
      }
      goalsByCategory.get(key)!.push(goal);
    });

    const categoryBreakdown = Array.from(goalsByCategory.entries()).map(
      ([key, categoryGoals]) => {
        const [categoryId, categoryName] = key.split("|");
        const totalAmount = categoryGoals.reduce(
          (sum: number, g: IGoal) => sum + (g.targetAmount || 0),
          0
        );
        const currentAmount = categoryGoals.reduce(
          (sum: number, g: IGoal) => sum + (g.currentAmount || 0),
          0
        );
        const progress =
          totalAmount > 0
            ? Math.round((currentAmount / totalAmount) * 100 * 100) / 100
            : 0;

        return {
          categoryId,
          categoryName,
          totalGoals: categoryGoals.length,
          totalAmount,
          progress,
        };
      }
    );

    const report: SavingsSummaryReport = {
      totalGoals: goals.length,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress,
      completedGoals,
      expiredGoals,
      inProgressGoals,
      averageContribution:
        contributions.length > 0
          ? Math.round((totalContributions / contributions.length) * 100) / 100
          : 0,
      lastContributionDate:
        contributions.length > 0
          ? contributions[contributions.length - 1].date
          : undefined,
      categoryBreakdown,
    };

    return report;
  }

  private determineGoalStatus(
    goal: IGoal,
    now: Date
  ): "completed" | "expired" | "inProgress" {
    const currentAmount = goal.currentAmount || 0;
    const targetAmount = goal.targetAmount || 0;

    if (currentAmount >= targetAmount) return "completed";
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
    const monthsBetween = this.monthsBetween(startDate, endDate);
    const monthlyTarget =
      monthsBetween > 0 ? (goal.targetAmount || 0) / monthsBetween : 0;

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
      groupedContributions.set(key, currentAmount + (contribution.amount || 0));
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
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1;
    return months > 0 ? months : 1; // Evitar división por 0
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
