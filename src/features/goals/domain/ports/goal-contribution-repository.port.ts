import { IGoalContribution } from "../entities/IGoalContribution";

export interface IGoalContributionRepository {
  findAll(): Promise<IGoalContribution[]>;
  findById(id: number): Promise<IGoalContribution | null>;
  findByGoalId(goalId: number): Promise<IGoalContribution[]>;
  findByUserId(userId: number): Promise<IGoalContribution[]>;
  create(
    contribution: Omit<IGoalContribution, "id" | "date">
  ): Promise<IGoalContribution>;
  delete(id: number): Promise<boolean>;
}
