import { eq, and } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { goal_contribution_schedule } from "@/schema";
import { IGoalContributionScheduleRepository } from "@/goals/domain/ports/goal-contribution-schedule-repository.port";
import { IGoalContributionSchedule } from "@/goals/domain/entities/IGoalContributionSchedule";

export class PgGoalContributionScheduleRepository
  implements IGoalContributionScheduleRepository
{
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgGoalContributionScheduleRepository;

  private constructor() {}

  public static getInstance(): PgGoalContributionScheduleRepository {
    if (!PgGoalContributionScheduleRepository.instance) {
      PgGoalContributionScheduleRepository.instance =
        new PgGoalContributionScheduleRepository();
    }
    return PgGoalContributionScheduleRepository.instance;
  }

  async findAll(): Promise<IGoalContributionSchedule[]> {
    const result = await this.db.select().from(goal_contribution_schedule);
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<IGoalContributionSchedule | null> {
    const result = await this.db
      .select()
      .from(goal_contribution_schedule)
      .where(eq(goal_contribution_schedule.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByGoalId(goalId: number): Promise<IGoalContributionSchedule[]> {
    const result = await this.db
      .select()
      .from(goal_contribution_schedule)
      .where(eq(goal_contribution_schedule.goal_id, goalId));

    return result.map(this.mapToEntity);
  }

  async findByUserId(userId: number): Promise<IGoalContributionSchedule[]> {
    const result = await this.db
      .select()
      .from(goal_contribution_schedule)
      .where(eq(goal_contribution_schedule.user_id, userId));

    return result.map(this.mapToEntity);
  }

  async findPending(userId?: number): Promise<IGoalContributionSchedule[]> {
    let query = this.db
      .select()
      .from(goal_contribution_schedule)
      .where(
        userId
          ? and(
              eq(goal_contribution_schedule.status, "pending"),
              eq(goal_contribution_schedule.user_id, userId)
            )
          : eq(goal_contribution_schedule.status, "pending")
      );

    const result = await query;
    return result.map(this.mapToEntity);
  }

  async findByStatus(
    status: string,
    userId?: number
  ): Promise<IGoalContributionSchedule[]> {
    let query = this.db
      .select()
      .from(goal_contribution_schedule)
      .where(
        userId
          ? and(
              eq(goal_contribution_schedule.status, status),
              eq(goal_contribution_schedule.user_id, userId)
            )
          : eq(goal_contribution_schedule.status, status)
      );

    const result = await query;
    return result.map(this.mapToEntity);
  }

  async create(
    scheduleData: Omit<IGoalContributionSchedule, "id">
  ): Promise<IGoalContributionSchedule> {
    const result = await this.db
      .insert(goal_contribution_schedule)
      .values({
        goal_id: scheduleData.goalId,
        user_id: scheduleData.userId,
        scheduled_date: scheduleData.scheduledDate,
        amount: scheduleData.amount.toString(),
        status: scheduleData.status,
        contribution_id: scheduleData.contributionId || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(
    id: number,
    data: Partial<IGoalContributionSchedule>
  ): Promise<IGoalContributionSchedule> {
    const updateData: Record<string, any> = {};

    if (data.scheduledDate !== undefined)
      updateData.scheduled_date = data.scheduledDate;
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.status !== undefined) updateData.status = data.status;
    if (data.contributionId !== undefined)
      updateData.contribution_id = data.contributionId;

    const result = await this.db
      .update(goal_contribution_schedule)
      .set(updateData)
      .where(eq(goal_contribution_schedule.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(goal_contribution_schedule)
      .where(eq(goal_contribution_schedule.id, id))
      .returning();

    return result.length > 0;
  }

  async markAsCompleted(
    id: number,
    contributionId: number
  ): Promise<IGoalContributionSchedule> {
    const result = await this.db
      .update(goal_contribution_schedule)
      .set({
        status: "completed",
        contribution_id: contributionId,
      })
      .where(eq(goal_contribution_schedule.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async markAsSkipped(id: number): Promise<IGoalContributionSchedule> {
    const result = await this.db
      .update(goal_contribution_schedule)
      .set({
        status: "skipped",
      })
      .where(eq(goal_contribution_schedule.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  private mapToEntity(raw: any): IGoalContributionSchedule {
    return {
      id: raw.id,
      goalId: raw.goal_id,
      userId: raw.user_id,
      scheduledDate: raw.scheduled_date,
      amount: Number(raw.amount),
      status: raw.status,
      contributionId: raw.contribution_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}
