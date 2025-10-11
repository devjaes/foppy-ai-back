export interface Report {
  id: string;
  userId: number;
  type: ReportType;
  format: ReportFormat;
  filters: ReportFilters;
  createdAt: Date;
  expiresAt: Date;
  data: any;
}

export enum ReportType {
  GOAL = "GOAL",
  CONTRIBUTION = "CONTRIBUTION",
  BUDGET = "BUDGET",
  EXPENSE = "EXPENSE",
  INCOME = "INCOME",
  DEBT = "DEBT",
  COMPREHENSIVE = "COMPREHENSIVE",
  GOALS_BY_STATUS = "GOALS_BY_STATUS",
  GOALS_BY_CATEGORY = "GOALS_BY_CATEGORY",
  CONTRIBUTIONS_BY_GOAL = "CONTRIBUTIONS_BY_GOAL",
  SAVINGS_COMPARISON = "SAVINGS_COMPARISON",
  SAVINGS_SUMMARY = "SAVINGS_SUMMARY",
}

export enum ReportFormat {
  JSON = "JSON",
  PDF = "PDF",
  EXCEL = "EXCEL",
  CSV = "CSV",
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  userId?: string;
  goalId?: string;
  includeShared?: boolean;
  groupBy?: "day" | "week" | "month";
  [key: string]: any;
}

export interface GoalStatusReport {
  completed: number;
  expired: number;
  inProgress: number;
  total: number;
  goals: Array<{
    id: string;
    name: string;
    status: "completed" | "expired" | "inProgress";
    targetAmount: number;
    currentAmount: number;
    progress: number;
    deadline: Date;
  }>;
}

export interface GoalCategoryReport {
  categories: Array<{
    id: string;
    name: string;
    totalGoals: number;
    totalAmount: number;
    completedAmount: number;
    progress: number;
    goals: Array<{
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      progress: number;
    }>;
  }>;
}

export interface ContributionReport {
  goalId: string;
  goalName: string;
  contributions: Array<{
    id: string;
    amount: number;
    date: Date;
    transactionId?: string;
  }>;
  totalContributions: number;
  averageContribution: number;
  lastContributionDate?: Date;
}

export interface SavingsComparisonReport {
  goalId: string;
  goalName: string;
  plannedSavings: Array<{
    date: Date;
    amount: number;
  }>;
  actualSavings: Array<{
    date: Date;
    amount: number;
  }>;
  deviations: Array<{
    date: Date;
    plannedAmount: number;
    actualAmount: number;
    difference: number;
  }>;
}

export interface SavingsSummaryReport {
  totalGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallProgress: number;
  completedGoals: number;
  expiredGoals: number;
  inProgressGoals: number;
  averageContribution: number;
  lastContributionDate?: Date;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalGoals: number;
    totalAmount: number;
    progress: number;
  }>;
}

// Nuevas interfaces para tipos de reportes expandidos
export interface BudgetReport {
  totalBudgets: number;
  totalBudgetAmount: number;
  totalSpent: number;
  averageUtilization: number;
  overBudgetCount: number;
  budgets: Array<{
    id: string;
    categoryName: string;
    limitAmount: number;
    currentAmount: number;
    utilization: number;
    status: "under" | "over" | "at_limit";
    month: string;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalBudget: number;
    totalSpent: number;
    utilization: number;
    budgetCount: number;
  }>;
}

export interface ExpenseReport {
  totalExpenses: number;
  totalTransactions: number;
  averageExpense: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    categoryName: string;
    date: Date;
    paymentMethodName: string;
  }>;
}

export interface IncomeReport {
  totalIncome: number;
  totalTransactions: number;
  averageIncome: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    categoryName: string;
    date: Date;
    paymentMethodName: string;
  }>;
}

export interface DebtReport {
  totalDebts: number;
  totalOriginalAmount: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  averageInterestRate: number;
  overdueCount: number;
  debts: Array<{
    id: string;
    description: string;
    originalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    interestRate: number;
    dueDate: Date;
    status: "active" | "paid" | "overdue";
    daysOverdue?: number;
  }>;
  paymentTrends: Array<{
    month: string;
    totalPaid: number;
    totalInterest: number;
    paymentCount: number;
  }>;
}

export interface ComprehensiveReport {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  financialSummary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
  };
  goals: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  };
  budgets: {
    totalBudgets: number;
    totalBudgetAmount: number;
    totalSpent: number;
    overBudgetCount: number;
  };
  debts: {
    totalDebts: number;
    totalPendingAmount: number;
    totalPaidAmount: number;
    overdueCount: number;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    income: number;
    expenses: number;
    netAmount: number;
    budgetLimit?: number;
    budgetUtilization?: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
    goalContributions: number;
    debtPayments: number;
  }>;
}
