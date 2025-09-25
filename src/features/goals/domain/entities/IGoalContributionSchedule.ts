export interface IGoalContributionSchedule {
  id: number;
  goalId: number;
  userId: number;
  scheduledDate: Date;
  amount: number;
  status: "pending" | "completed" | "skipped";
  contributionId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}
