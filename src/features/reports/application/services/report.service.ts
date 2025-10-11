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
  BudgetReport,
  ExpenseReport,
  IncomeReport,
  DebtReport,
  ComprehensiveReport,
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
      case ReportType.BUDGET:
        data = await this.generateBudgetReport(filters);
        break;
      case ReportType.EXPENSE:
        data = await this.generateExpenseReport(filters);
        break;
      case ReportType.INCOME:
        data = await this.generateIncomeReport(filters);
        break;
      case ReportType.DEBT:
        data = await this.generateDebtReport(filters);
        break;
      case ReportType.COMPREHENSIVE:
        data = await this.generateComprehensiveReport(filters);
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

  private async generateBudgetReport(
    filters: ReportFilters
  ): Promise<BudgetReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for budget report");
    }

    // TODO: Implement proper budget repository method
    const budgets: any[] = []; // await this.budgetRepository.findByFilters(filters);
    const now = new Date();

    if (budgets.length === 0) {
      return {
        totalBudgets: 0,
        totalBudgetAmount: 0,
        totalSpent: 0,
        averageUtilization: 0,
        overBudgetCount: 0,
        budgets: [],
        categoryBreakdown: [],
      };
    }

    let totalBudgetAmount = 0;
    let totalSpent = 0;
    let overBudgetCount = 0;

    const budgetData = budgets.map((budget: any) => {
      const utilization = (budget.current_amount / budget.limit_amount) * 100;
      totalBudgetAmount += budget.limit_amount;
      totalSpent += budget.current_amount;

      if (budget.current_amount > budget.limit_amount) {
        overBudgetCount++;
      }

      return {
        id: budget.id?.toString() || "",
        categoryName: budget.category?.name || "Sin categoría",
        limitAmount: budget.limit_amount,
        currentAmount: budget.current_amount,
        utilization: Math.round(utilization * 100) / 100,
        status:
          budget.current_amount > budget.limit_amount
            ? "over"
            : budget.current_amount === budget.limit_amount
            ? "at_limit"
            : "under",
        month: budget.month,
      };
    });

    // Agrupar por categoría
    const categoryMap = new Map();
    budgets.forEach((budget: any) => {
      const categoryId = budget.category?.id?.toString() || "unknown";
      const categoryName = budget.category?.name || "Sin categoría";

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalBudget: 0,
          totalSpent: 0,
          budgetCount: 0,
        });
      }

      const category = categoryMap.get(categoryId);
      category.totalBudget += budget.limit_amount;
      category.totalSpent += budget.current_amount;
      category.budgetCount += 1;
    });

    const categoryBreakdown = Array.from(categoryMap.values()).map(
      (category) => ({
        ...category,
        utilization:
          category.totalBudget > 0
            ? (category.totalSpent / category.totalBudget) * 100
            : 0,
      })
    );

    return {
      totalBudgets: budgets.length,
      totalBudgetAmount,
      totalSpent,
      averageUtilization:
        totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0,
      overBudgetCount,
      budgets: budgetData,
      categoryBreakdown,
    };
  }

  private async generateExpenseReport(
    filters: ReportFilters
  ): Promise<ExpenseReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for expense report");
    }

    // TODO: Implement proper transaction repository method with type filter
    const transactions: any[] = []; // await this.transactionRepository.findByFilters(expenseFilters);

    if (transactions.length === 0) {
      return {
        totalExpenses: 0,
        totalTransactions: 0,
        averageExpense: 0,
        topCategories: [],
        monthlyTrends: [],
        transactions: [],
      };
    }

    const totalExpenses = transactions.reduce(
      (sum: number, t: any) => sum + t.amount,
      0
    );
    const averageExpense = totalExpenses / transactions.length;

    // Agrupar por categoría
    const categoryMap = new Map();
    transactions.forEach((transaction: any) => {
      const categoryId = transaction.category?.id?.toString() || "unknown";
      const categoryName = transaction.category?.name || "Sin categoría";

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalAmount: 0,
          transactionCount: 0,
        });
      }

      const category = categoryMap.get(categoryId);
      category.totalAmount += transaction.amount;
      category.transactionCount += 1;
    });

    const topCategories = Array.from(categoryMap.values())
      .map((category) => ({
        ...category,
        percentage: (category.totalAmount / totalExpenses) * 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Agrupar por mes
    const monthlyMap = new Map();
    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          totalAmount: 0,
          transactionCount: 0,
        });
      }

      const month = monthlyMap.get(monthKey);
      month.totalAmount += transaction.amount;
      month.transactionCount += 1;
    });

    const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const transactionData = transactions
      .slice(0, 100)
      .map((transaction: any) => ({
        id: transaction.id?.toString() || "",
        amount: transaction.amount,
        description: transaction.description || "Sin descripción",
        categoryName: transaction.category?.name || "Sin categoría",
        date: new Date(transaction.date),
        paymentMethodName: transaction.payment_method?.name || "Sin método",
      }));

    return {
      totalExpenses,
      totalTransactions: transactions.length,
      averageExpense: Math.round(averageExpense * 100) / 100,
      topCategories,
      monthlyTrends,
      transactions: transactionData,
    };
  }

  private async generateIncomeReport(
    filters: ReportFilters
  ): Promise<IncomeReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for income report");
    }

    // TODO: Implement proper transaction repository method with type filter
    const transactions: any[] = []; // await this.transactionRepository.findByFilters(incomeFilters);

    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalTransactions: 0,
        averageIncome: 0,
        topCategories: [],
        monthlyTrends: [],
        transactions: [],
      };
    }

    const totalIncome = transactions.reduce(
      (sum: number, t: any) => sum + t.amount,
      0
    );
    const averageIncome = totalIncome / transactions.length;

    // Agrupar por categoría
    const categoryMap = new Map();
    transactions.forEach((transaction: any) => {
      const categoryId = transaction.category?.id?.toString() || "unknown";
      const categoryName = transaction.category?.name || "Sin categoría";

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalAmount: 0,
          transactionCount: 0,
        });
      }

      const category = categoryMap.get(categoryId);
      category.totalAmount += transaction.amount;
      category.transactionCount += 1;
    });

    const topCategories = Array.from(categoryMap.values())
      .map((category) => ({
        ...category,
        percentage: (category.totalAmount / totalIncome) * 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Agrupar por mes
    const monthlyMap = new Map();
    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          totalAmount: 0,
          transactionCount: 0,
        });
      }

      const month = monthlyMap.get(monthKey);
      month.totalAmount += transaction.amount;
      month.transactionCount += 1;
    });

    const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const transactionData = transactions
      .slice(0, 100)
      .map((transaction: any) => ({
        id: transaction.id?.toString() || "",
        amount: transaction.amount,
        description: transaction.description || "Sin descripción",
        categoryName: transaction.category?.name || "Sin categoría",
        date: new Date(transaction.date),
        paymentMethodName: transaction.payment_method?.name || "Sin método",
      }));

    return {
      totalIncome,
      totalTransactions: transactions.length,
      averageIncome: Math.round(averageIncome * 100) / 100,
      topCategories,
      monthlyTrends,
      transactions: transactionData,
    };
  }

  private async generateDebtReport(
    filters: ReportFilters
  ): Promise<DebtReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for debt report");
    }

    // Necesitamos acceso al repositorio de deudas
    // Por ahora, simularemos la estructura
    const debts: any[] = []; // await this.debtRepository.findByFilters(filters);

    if (debts.length === 0) {
      return {
        totalDebts: 0,
        totalOriginalAmount: 0,
        totalPendingAmount: 0,
        totalPaidAmount: 0,
        averageInterestRate: 0,
        overdueCount: 0,
        debts: [],
        paymentTrends: [],
      };
    }

    const now = new Date();
    let totalOriginalAmount = 0;
    let totalPendingAmount = 0;
    let totalPaidAmount = 0;
    let totalInterestRate = 0;
    let overdueCount = 0;

    const debtData = debts.map((debt: any) => {
      const paidAmount = debt.original_amount - debt.pending_amount;
      const isOverdue = debt.due_date < now && debt.pending_amount > 0;

      totalOriginalAmount += debt.original_amount;
      totalPendingAmount += debt.pending_amount;
      totalPaidAmount += paidAmount;
      totalInterestRate += debt.interest_rate || 0;

      if (isOverdue) {
        overdueCount++;
      }

      return {
        id: debt.id?.toString() || "",
        description: debt.description || "Sin descripción",
        originalAmount: debt.original_amount,
        pendingAmount: debt.pending_amount,
        paidAmount,
        interestRate: debt.interest_rate || 0,
        dueDate: new Date(debt.due_date),
        status:
          debt.pending_amount <= 0 ? "paid" : isOverdue ? "overdue" : "active",
        daysOverdue: isOverdue
          ? Math.floor(
              (now.getTime() - debt.due_date.getTime()) / (1000 * 60 * 60 * 24)
            )
          : undefined,
      };
    });

    return {
      totalDebts: debts.length,
      totalOriginalAmount,
      totalPendingAmount,
      totalPaidAmount,
      averageInterestRate:
        debts.length > 0 ? totalInterestRate / debts.length : 0,
      overdueCount,
      debts: debtData,
      paymentTrends: [], // Se implementaría con datos de transacciones de pago
    };
  }

  private async generateComprehensiveReport(
    filters: ReportFilters
  ): Promise<ComprehensiveReport> {
    if (!filters.userId) {
      throw new Error("User ID is required for comprehensive report");
    }

    // Obtener datos de todos los módulos
    const [goalsData, budgetData, expenseData, incomeData] = await Promise.all([
      this.generateSavingsSummaryReport(filters),
      this.generateBudgetReport(filters),
      this.generateExpenseReport(filters),
      this.generateIncomeReport(filters),
    ]);

    const totalIncome = incomeData.totalIncome;
    const totalExpenses = expenseData.totalExpenses;
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    // Crear desglose por categoría combinando ingresos y gastos
    const categoryMap = new Map();

    // Agregar gastos por categoría
    expenseData.topCategories.forEach((category) => {
      categoryMap.set(category.categoryId, {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        income: 0,
        expenses: category.totalAmount,
        netAmount: -category.totalAmount,
      });
    });

    // Agregar ingresos por categoría
    incomeData.topCategories.forEach((category) => {
      if (categoryMap.has(category.categoryId)) {
        const existing = categoryMap.get(category.categoryId);
        existing.income = category.totalAmount;
        existing.netAmount = category.totalAmount - existing.expenses;
      } else {
        categoryMap.set(category.categoryId, {
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          income: category.totalAmount,
          expenses: 0,
          netAmount: category.totalAmount,
        });
      }
    });

    // Agregar información de presupuestos si está disponible
    budgetData.categoryBreakdown.forEach((budget) => {
      if (categoryMap.has(budget.categoryId)) {
        const existing = categoryMap.get(budget.categoryId);
        existing.budgetLimit = budget.totalBudget;
        existing.budgetUtilization = budget.utilization;
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values());

    // Crear tendencias mensuales combinadas
    const monthlyMap = new Map();

    expenseData.monthlyTrends.forEach((month) => {
      monthlyMap.set(month.month, {
        month: month.month,
        income: 0,
        expenses: month.totalAmount,
        balance: -month.totalAmount,
        goalContributions: 0,
        debtPayments: 0,
      });
    });

    incomeData.monthlyTrends.forEach((month) => {
      if (monthlyMap.has(month.month)) {
        const existing = monthlyMap.get(month.month);
        existing.income = month.totalAmount;
        existing.balance = month.totalAmount - existing.expenses;
      } else {
        monthlyMap.set(month.month, {
          month: month.month,
          income: month.totalAmount,
          expenses: 0,
          balance: month.totalAmount,
          goalContributions: 0,
          debtPayments: 0,
        });
      }
    });

    const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return {
      period: {
        startDate: filters.startDate || new Date(),
        endDate: filters.endDate || new Date(),
        label: `${
          filters.startDate ? filters.startDate.toLocaleDateString() : "Inicio"
        } - ${filters.endDate ? filters.endDate.toLocaleDateString() : "Fin"}`,
      },
      financialSummary: {
        totalIncome,
        totalExpenses,
        netBalance,
        savingsRate: Math.round(savingsRate * 100) / 100,
      },
      goals: {
        totalGoals: goalsData.totalGoals,
        completedGoals: goalsData.completedGoals,
        inProgressGoals: goalsData.inProgressGoals,
        totalTargetAmount: goalsData.totalTargetAmount,
        totalCurrentAmount: goalsData.totalCurrentAmount,
        overallProgress: Math.round(goalsData.overallProgress * 100) / 100,
      },
      budgets: {
        totalBudgets: budgetData.totalBudgets,
        totalBudgetAmount: budgetData.totalBudgetAmount,
        totalSpent: budgetData.totalSpent,
        overBudgetCount: budgetData.overBudgetCount,
      },
      debts: {
        totalDebts: 0, // Se implementaría con datos reales
        totalPendingAmount: 0,
        totalPaidAmount: 0,
        overdueCount: 0,
      },
      categoryBreakdown,
      monthlyTrends,
    };
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
