import { eq, sql, and, gte, lte } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { categories, goal_contributions, goals } from "@/schema";
import { IGoalRepository } from "@/goals/domain/ports/goal-repository.port";
import { IGoal } from "@/goals/domain/entities/IGoal";
import { ReportFilters } from "../../../reports/domain/entities/report.entity";

export class PgGoalRepository implements IGoalRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgGoalRepository;

  private constructor() {}

  public static getInstance(): PgGoalRepository {
    if (!PgGoalRepository.instance) {
      PgGoalRepository.instance = new PgGoalRepository();
    }
    return PgGoalRepository.instance;
  }

  async findAll(): Promise<IGoal[]> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id));

    return result.map((row) => this.mapToEntity(row.goal, row.category));
  }

  async findAllWithLastContributionWithMoreThanOneWeekAgo(): Promise<IGoal[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await this.db
      .select({
        goal: goals,
        latestContribution: sql`MAX(${goal_contributions.date})`,
      })
      .from(goals)
      .leftJoin(goal_contributions, eq(goals.id, goal_contributions.goal_id))
      .groupBy(goals.id)
      .having(
        sql`MAX(${goal_contributions.date}) < ${oneWeekAgo} OR MAX(${goal_contributions.date}) IS NULL`
      );

    return result.map((row) => this.mapToEntity(row.goal));
  }

  async findById(id: number): Promise<IGoal | null> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(eq(goals.id, id));

    return result[0]
      ? this.mapToEntity(result[0].goal, result[0].category)
      : null;
  }

  async findByUserId(userId: number): Promise<IGoal[]> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(eq(goals.user_id, userId));

    return result.map((row) => this.mapToEntity(row.goal, row.category));
  }

  async findAllActive(): Promise<IGoal[]> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(
        sql`${goals.current_amount} < ${goals.target_amount}`
      );

    return result.map((row) => this.mapToEntity(row.goal, row.category));
  }

  async findSharedWithUser(userId: number): Promise<IGoal[]> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(eq(goals.shared_user_id, userId));

    return result.map((row) => this.mapToEntity(row.goal, row.category));
  }

  async create(goalData: Omit<IGoal, "id">): Promise<IGoal> {
    const result = await this.db
      .insert(goals)
      .values({
        user_id: goalData.userId,
        shared_user_id: goalData.sharedUserId,
        name: goalData.name,
        target_amount: goalData.targetAmount.toString(),
        current_amount: goalData.currentAmount.toString(),
        end_date: goalData.endDate,
        category_id: goalData.categoryId,
        contribution_frequency: goalData.contributionFrequency || 0,
        contribution_amount: goalData.contributionAmount?.toString() || "0"
      })
      .returning();

    const category = goalData.categoryId
      ? await this.db
          .select()
          .from(categories)
          .where(eq(categories.id, goalData.categoryId))
          .then((result) => result[0])
      : null;

    return this.mapToEntity(result[0], category);
  }

  async update(id: number, goalData: Partial<IGoal>): Promise<IGoal> {
    const updateData: Record<string, any> = {};

    if (goalData.name !== undefined) updateData.name = goalData.name;
    if (goalData.targetAmount !== undefined)
      updateData.target_amount = goalData.targetAmount.toString();
    if (goalData.currentAmount !== undefined)
      updateData.current_amount = goalData.currentAmount.toString();
    if (goalData.endDate !== undefined) updateData.end_date = goalData.endDate;
    if (goalData.sharedUserId !== undefined)
      updateData.shared_user_id = goalData.sharedUserId;
    if (goalData.categoryId !== undefined)
      updateData.category_id = goalData.categoryId;
    if (goalData.contributionFrequency !== undefined)
      updateData.contribution_frequency = goalData.contributionFrequency;
    if (goalData.contributionAmount !== undefined)
      updateData.contribution_amount = goalData.contributionAmount?.toString() || null;

    const result = await this.db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, id))
      .returning();

    const category = result[0].category_id
      ? await this.db
          .select()
          .from(categories)
          .where(eq(categories.id, result[0].category_id))
          .then((result) => result[0])
      : null;

    return this.mapToEntity(result[0], category);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(goals)
      .where(eq(goals.id, id))
      .returning();

    return result.length > 0;
  }

  async updateProgress(id: number, amount: number): Promise<IGoal> {
    const goal = await this.findById(id);
    if (!goal) throw new Error("Goal not found");

    const newAmount = goal.currentAmount + amount;

    const result = await this.db
      .update(goals)
      .set({
        current_amount: newAmount.toString(),
      })
      .where(eq(goals.id, id))
      .returning();

    const category = result[0].category_id
      ? await this.db
          .select()
          .from(categories)
          .where(eq(categories.id, result[0].category_id))
          .then((result) => result[0])
      : null;

    return this.mapToEntity(result[0], category);
  }

  async findByFilters(filters: ReportFilters): Promise<IGoal[]> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(goals.user_id, Number(filters.userId)));
    }

    if (filters.categoryId) {
      conditions.push(eq(goals.category_id, Number(filters.categoryId)));
    }

    if (filters.startDate) {
      conditions.push(gte(goals.end_date, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(goals.end_date, new Date(filters.endDate)));
    }

    if (filters.includeShared) {
      conditions.push(sql`${goals.shared_user_id} IS NOT NULL`);
    }

    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.map((row) => this.mapToEntity(row.goal, row.category));
  }

  private mapToEntity(raw: any, category?: any): IGoal {
    return {
      id: raw.id,
      userId: raw.user_id,
      sharedUserId: raw.shared_user_id,
      name: raw.name,
      targetAmount: Number(raw.target_amount),
      currentAmount: Number(raw.current_amount),
      endDate: raw.end_date,
      categoryId: raw.category_id,
      category: category
        ? {
            id: category.id,
            name: category.name,
          }
        : null,
      contributionFrequency: raw.contribution_frequency,
      contributionAmount: raw.contribution_amount ? Number(raw.contribution_amount) : 0,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }
}
