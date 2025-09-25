import { desc, eq, and, gte, lte } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { goal_contributions } from "@/schema";
import { IGoalContributionRepository } from "@/goals/domain/ports/goal-contribution-repository.port";
import { IGoalContribution } from "@/goals/domain/entities/IGoalContribution";
import { ReportFilters } from "../../../reports/domain/entities/report.entity";

export class PgGoalContributionRepository
  implements IGoalContributionRepository
{
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgGoalContributionRepository;

  private constructor() {}

  public static getInstance(): PgGoalContributionRepository {
    if (!PgGoalContributionRepository.instance) {
      PgGoalContributionRepository.instance =
        new PgGoalContributionRepository();
    }
    return PgGoalContributionRepository.instance;
  }

  async findAll(): Promise<IGoalContribution[]> {
    const result = await this.db.select().from(goal_contributions);
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<IGoalContribution | null> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByGoalId(goalId: number): Promise<IGoalContribution[]> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.goal_id, goalId));

    return result.map(this.mapToEntity);
  }

  async findByUserId(userId: number): Promise<IGoalContribution[]> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.user_id, userId));

    return result.map(this.mapToEntity);
  }

  async create(
    contributionData: Omit<IGoalContribution, "id" | "date">
  ): Promise<IGoalContribution> {
    const result = await this.db
      .insert(goal_contributions)
      .values({
        goal_id: contributionData.goalId,
        user_id: contributionData.userId,
        amount: contributionData.amount.toString(),
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(goal_contributions)
      .where(eq(goal_contributions.id, id))
      .returning();

    return result.length > 0;
  }

  async findLatestContribution(
    goalId: number
  ): Promise<IGoalContribution | null> {
    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(eq(goal_contributions.goal_id, goalId))
      .orderBy(desc(goal_contributions.date))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByFilters(filters: ReportFilters): Promise<IGoalContribution[]> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(goal_contributions.user_id, Number(filters.userId)));
    }

    if (filters.goalId) {
      conditions.push(eq(goal_contributions.goal_id, Number(filters.goalId)));
    }

    if (filters.startDate) {
      conditions.push(gte(goal_contributions.date, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(goal_contributions.date, filters.endDate));
    }

    const result = await this.db
      .select()
      .from(goal_contributions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(goal_contributions.date));

    return result.map(this.mapToEntity);
  }

  private mapToEntity(raw: any): IGoalContribution {
    return {
      id: raw.id,
      goalId: raw.goal_id,
      userId: raw.user_id,
      amount: Number(raw.amount),
      date: raw.date,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}
