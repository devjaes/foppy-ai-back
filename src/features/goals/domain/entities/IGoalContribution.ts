export interface IGoalContribution {
  id: number;
  goalId: number;
  userId: number;
  amount: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
