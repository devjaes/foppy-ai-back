import { eq, sql, and, gte, lte, or } from "drizzle-orm";
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

  async findByUserId(userId: number): Promise<IGoal[]> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(or(eq(goals.user_id, userId), eq(goals.shared_user_id, userId)));

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

  async create(goal: IGoal): Promise<IGoal> {
    const result = await this.db
      .insert(goals)
      .values({
        user_id: goal.userId,
        shared_user_id: goal.sharedUserId,
        name: goal.name,
        target_amount: goal.targetAmount.toString(),
        current_amount: goal.currentAmount.toString(),
        end_date: goal.endDate,
        category_id: goal.categoryId,
        contribution_frequency: goal.contributionFrequency || 0,
        contribution_amount: goal.contributionAmount?.toString() || "0",
      })
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

  async update(id: number, goal: Partial<IGoal>): Promise<IGoal> {
    const result = await this.db
      .update(goals)
      .set({
        name: goal.name,
        target_amount: goal.targetAmount?.toString(),
        current_amount: goal.currentAmount?.toString(),
        end_date: goal.endDate,
        category_id: goal.categoryId,
        shared_user_id: goal.sharedUserId,
        contribution_frequency: goal.contributionFrequency ?? undefined,
        contribution_amount: goal.contributionAmount?.toString(),
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

  async findById(id: number): Promise<IGoal | null> {
    const result = await this.db
      .select({
        goal: goals,
        category: categories,
      })
      .from(goals)
      .leftJoin(categories, eq(goals.category_id, categories.id))
      .where(eq(goals.id, id));

    if (result.length === 0) return null;

    return this.mapToEntity(result[0].goal, result[0].category);
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

    // Usuario es obligatorio
    if (filters.userId) {
      conditions.push(
        or(
          eq(goals.user_id, Number(filters.userId)),
          eq(goals.shared_user_id, Number(filters.userId))
        )
      );
    }

    // Filtro por categoría (opcional)
    if (filters.categoryId) {
      conditions.push(eq(goals.category_id, Number(filters.categoryId)));
    }

    // FIXED: Determinar qué campo usar para filtrar fechas
    // Default: 'end_date' (para dashboard - metas que vencen en el período)
    // Opción: 'created_at' (para reportes - metas creadas en el período)
    const useCreatedAt = filters.filterBy === "created_at";
    const dateField = useCreatedAt ? goals.created_at : goals.end_date;

    // Si hay startDate, filtrar metas según el campo determinado
    if (filters.startDate) {
      conditions.push(gte(dateField, filters.startDate));
    }

    // Si hay endDate, filtrar metas según el campo determinado
    if (filters.endDate) {
      conditions.push(lte(dateField, filters.endDate));
    }

    // Incluir compartidas (opcional)
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
      contributionAmount: raw.contribution_amount
        ? Number(raw.contribution_amount)
        : 0,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}
