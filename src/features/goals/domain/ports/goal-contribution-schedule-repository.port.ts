import { IGoalContributionSchedule } from "../entities/IGoalContributionSchedule";

export interface IGoalContributionScheduleRepository {
  findAll(): Promise<IGoalContributionSchedule[]>;
  findById(id: number): Promise<IGoalContributionSchedule | null>;
  findByGoalId(goalId: number): Promise<IGoalContributionSchedule[]>;
  findByUserId(userId: number): Promise<IGoalContributionSchedule[]>;
  findPending(userId?: number): Promise<IGoalContributionSchedule[]>;
  findByStatus(status: string, userId?: number): Promise<IGoalContributionSchedule[]>;
  create(schedule: Omit<IGoalContributionSchedule, "id">): Promise<IGoalContributionSchedule>;
  update(id: number, data: Partial<IGoalContributionSchedule>): Promise<IGoalContributionSchedule>;
  delete(id: number): Promise<boolean>;
  markAsCompleted(id: number, contributionId: number): Promise<IGoalContributionSchedule>;
  markAsSkipped(id: number): Promise<IGoalContributionSchedule>;
}