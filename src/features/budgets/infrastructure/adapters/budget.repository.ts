import { eq, and, gte, lt, sql } from "drizzle-orm";
import { getYear, getMonth } from "date-fns";
import DatabaseConnection from "@/core/infrastructure/database";
import { budgets, categories } from "@/schema";
import { IBudgetRepository } from "@/budgets/domain/ports/budget-repository.port";
import { IBudget } from "@/budgets/domain/entities/IBudget";

export class PgBudgetRepository implements IBudgetRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgBudgetRepository;

  private constructor() {}

  public static getInstance(): PgBudgetRepository {
    if (!PgBudgetRepository.instance) {
      PgBudgetRepository.instance = new PgBudgetRepository();
    }
    return PgBudgetRepository.instance;
  }

  async findAll(): Promise<IBudget[]> {
    const result = await this.db
      .select({
        id: budgets.id,
        user_id: budgets.user_id,
        shared_user_id: budgets.shared_user_id,
        category_id: budgets.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        limit_amount: budgets.limit_amount,
        current_amount: budgets.current_amount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id));
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<IBudget | null> {
    const result = await this.db
      .select({
        id: budgets.id,
        user_id: budgets.user_id,
        shared_user_id: budgets.shared_user_id,
        category_id: budgets.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        limit_amount: budgets.limit_amount,
        current_amount: budgets.current_amount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id))
      .where(eq(budgets.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByUserId(userId: number): Promise<IBudget[]> {
    const result = await this.db
      .select({
        id: budgets.id,
        user_id: budgets.user_id,
        shared_user_id: budgets.shared_user_id,
        category_id: budgets.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        limit_amount: budgets.limit_amount,
        current_amount: budgets.current_amount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id))
      .where(eq(budgets.user_id, userId));

    return result.map(this.mapToEntity);
  }

  async findByUserIdAndMonth(userId: number, month: Date): Promise<IBudget[]> {
    const year = month.getUTCFullYear();
    const monthNumber = month.getUTCMonth() + 1;

    const result = await this.db
      .select({
        id: budgets.id,
        user_id: budgets.user_id,
        shared_user_id: budgets.shared_user_id,
        category_id: budgets.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        limit_amount: budgets.limit_amount,
        current_amount: budgets.current_amount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id))
      .where(
        and(
          eq(budgets.user_id, userId),
          eq(sql`EXTRACT(YEAR FROM ${budgets.month})`, year),
          eq(sql`EXTRACT(MONTH FROM ${budgets.month})`, monthNumber)
        )
      );

    return result.map(this.mapToEntity);
  }

  async findSharedWithUser(userId: number): Promise<IBudget[]> {
    const result = await this.db
      .select({
        id: budgets.id,
        user_id: budgets.user_id,
        shared_user_id: budgets.shared_user_id,
        category_id: budgets.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        limit_amount: budgets.limit_amount,
        current_amount: budgets.current_amount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id))
      .where(eq(budgets.shared_user_id, userId));

    return result.map(this.mapToEntity);
  }

  async create(budgetData: Omit<IBudget, "id">): Promise<IBudget> {
    let categoryId = budgetData.categoryId;
    if (!categoryId) {
      const othersCategory = await this.db
        .select()
        .from(categories)
        .where(eq(categories.name, "Otros"))
        .limit(1);

      if (!othersCategory[0]) {
        throw new Error("No se encontró la categoría 'Otros'");
      }

      categoryId = othersCategory[0].id;
    }

    const result = await this.db
      .insert(budgets)
      .values({
        user_id: budgetData.userId,
        shared_user_id: budgetData.sharedUserId || null,
        category_id: categoryId,
        limit_amount: budgetData.limitAmount.toString(),
        current_amount: budgetData.currentAmount.toString(),
        month: budgetData.month,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: number, budgetData: Partial<IBudget>): Promise<IBudget> {
    const updateData: Record<string, any> = {};

    if (budgetData.categoryId !== undefined)
      updateData.category_id = budgetData.categoryId;
    if (budgetData.limitAmount !== undefined)
      updateData.limit_amount = budgetData.limitAmount.toString();
    if (budgetData.currentAmount !== undefined)
      updateData.current_amount = budgetData.currentAmount.toString();
    if (budgetData.month !== undefined) updateData.month = budgetData.month;
    if (budgetData.sharedUserId !== undefined)
      updateData.shared_user_id = budgetData.sharedUserId;

    const result = await this.db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(budgets)
      .where(eq(budgets.id, id))
      .returning();

    return result.length > 0;
  }

  async updateAmount(id: number, amount: number): Promise<IBudget> {
    const budget = await this.findById(id);
    if (!budget) throw new Error("Budget not found");

    const newAmount = budget.currentAmount + amount;

    const result = await this.db
      .update(budgets)
      .set({
        current_amount: newAmount.toString(),
      })
      .where(eq(budgets.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

	private mapToEntity(raw: any): IBudget {
		return {
			id: raw.id,
			userId: raw.user_id,
			sharedUserId: raw.shared_user_id,
			categoryId: raw.category_id,
			category: raw.category || null,
			limitAmount: Number(raw.limit_amount),
			currentAmount: Number(raw.current_amount),
			month: new Date(raw.month),
			createdAt: raw.created_at,
			updatedAt: raw.updated_at,
		};
	}
  async findByDateRange(startDate: Date, endDate: Date): Promise<IBudget[]> {
    const result = await this.db
      .select({
        id: budgets.id,
        user_id: budgets.user_id,
        shared_user_id: budgets.shared_user_id,
        category_id: budgets.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        limit_amount: budgets.limit_amount,
        current_amount: budgets.current_amount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id))
      .where(and(gte(budgets.month, startDate), lt(budgets.month, endDate)));

    return result.map(this.mapToEntity);
  }

  async updateLimitAmount(id: number, amount: number): Promise<IBudget> {
    const result = await this.db
      .update(budgets)
      .set({
        limit_amount: amount.toString(),
      })
      .where(eq(budgets.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

}
