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
  GOALS_BY_STATUS = "GOALS_BY_STATUS",
  GOALS_BY_CATEGORY = "GOALS_BY_CATEGORY",
  CONTRIBUTIONS_BY_GOAL = "CONTRIBUTIONS_BY_GOAL",
  SAVINGS_COMPARISON = "SAVINGS_COMPARISON",
  SAVINGS_SUMMARY = "SAVINGS_SUMMARY",
  TRANSACTIONS_SUMMARY = "TRANSACTIONS_SUMMARY",
  EXPENSES_BY_CATEGORY = "EXPENSES_BY_CATEGORY",
  MONTHLY_TREND = "MONTHLY_TREND",
  BUDGET_PERFORMANCE = "BUDGET_PERFORMANCE",
  FINANCIAL_OVERVIEW = "FINANCIAL_OVERVIEW",
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
  filterBy?: "created_at" | "end_date";
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
    categoryName?: string;
  }>;
}

export interface GoalCategoryReport {
  totalCategories: number;
  totalGoals: number;
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
      endDate: Date;
      status: "completed" | "expired" | "inProgress";
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

export interface TransactionsSummaryReport {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  averageIncome: number;
  averageExpense: number;
  topIncomeCategory?: {
    name: string;
    amount: number;
  };
  topExpenseCategory?: {
    name: string;
    amount: number;
  };
  transactions: Array<{
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    category?: string;
    description?: string;
    date: Date;
  }>;
}

export interface ExpensesByCategoryReport {
  totalExpenses: number;
  categoryCount: number;
  categories: Array<{
    id: string;
    name: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    transactions: Array<{
      id: string;
      amount: number;
      description?: string;
      date: Date;
    }>;
  }>;
}

export interface MonthlyTrendReport {
  months: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
    transactionCount: number;
  }>;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface BudgetPerformanceReport {
  totalBudgets: number;
  exceededCount: number;
  warningCount: number;
  goodCount: number;
  budgets: Array<{
    id: string;
    categoryName: string;
    limitAmount: number;
    currentAmount: number;
    percentage: number;
    status: "exceeded" | "warning" | "good";
    month: string;
  }>;
}

export interface FinancialOverviewReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    savingsRate: number;
  };
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    totalSaved: number;
    totalTarget: number;
    overallProgress: number;
  };
  budgets: {
    total: number;
    exceeded: number;
    averageUtilization: number;
  };
  debts: {
    total: number;
    totalAmount: number;
    totalPending: number;
  };
  topCategories: {
    expenses: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
    income: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
}
