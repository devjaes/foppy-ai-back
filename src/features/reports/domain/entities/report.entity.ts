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
