import { eq } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { categories, debts } from "@/schema";
import { IDebt } from "@/debts/domain/entities/IDebt";
import { IDebtRepository } from "@/debts/domain/ports/debt-repository.port";

export class PgDebtRepository implements IDebtRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgDebtRepository;

  private constructor() {}

  public static getInstance(): PgDebtRepository {
    if (!PgDebtRepository.instance) {
      PgDebtRepository.instance = new PgDebtRepository();
    }
    return PgDebtRepository.instance;
  }

  async findAll(): Promise<IDebt[]> {
    const result = await this.db
      .select({
        id: debts.id,
        user_id: debts.user_id,
        description: debts.description,
        original_amount: debts.original_amount,
        pending_amount: debts.pending_amount,
        due_date: debts.due_date,
        paid: debts.paid,
        creditor_id: debts.creditor_id,
        category_id: debts.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(debts)
      .leftJoin(categories, eq(debts.category_id, categories.id));
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<IDebt | null> {
    const result = await this.db
      .select({
        id: debts.id,
        user_id: debts.user_id,
        description: debts.description,
        original_amount: debts.original_amount,
        pending_amount: debts.pending_amount,
        due_date: debts.due_date,
        paid: debts.paid,
        creditor_id: debts.creditor_id,
        category_id: debts.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(debts)
      .leftJoin(categories, eq(debts.category_id, categories.id))
      .where(eq(debts.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByUserId(userId: number): Promise<IDebt[]> {
    const result = await this.db
      .select({
        id: debts.id,
        user_id: debts.user_id,
        description: debts.description,
        original_amount: debts.original_amount,
        pending_amount: debts.pending_amount,
        due_date: debts.due_date,
        paid: debts.paid,
        creditor_id: debts.creditor_id,
        category_id: debts.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(debts)
      .leftJoin(categories, eq(debts.category_id, categories.id))
      .where(eq(debts.user_id, userId));

    return result.map(this.mapToEntity);
  }

  async findByCreditorId(creditorId: number): Promise<IDebt[]> {
    const result = await this.db
      .select({
        id: debts.id,
        user_id: debts.user_id,
        description: debts.description,
        original_amount: debts.original_amount,
        pending_amount: debts.pending_amount,
        due_date: debts.due_date,
        paid: debts.paid,
        creditor_id: debts.creditor_id,
        category_id: debts.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(debts)
      .leftJoin(categories, eq(debts.category_id, categories.id))
      .where(eq(debts.creditor_id, creditorId));

    return result.map(this.mapToEntity);
  }

  async findByStatus(paid: boolean): Promise<IDebt[]> {
    const result = await this.db
      .select({
        id: debts.id,
        user_id: debts.user_id,
        description: debts.description,
        original_amount: debts.original_amount,
        pending_amount: debts.pending_amount,
        due_date: debts.due_date,
        paid: debts.paid,
        creditor_id: debts.creditor_id,
        category_id: debts.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(debts)
      .leftJoin(categories, eq(debts.category_id, categories.id))
      .where(eq(debts.paid, paid));

    return result.map(this.mapToEntity);
  }

  async create(debtData: Omit<IDebt, "id">): Promise<IDebt> {
    let debtCategoryId = debtData.categoryId || null;

    if (!debtCategoryId) {
      const category = await this.db
        .select()
        .from(categories)
        .where(eq(categories.name, "Otros"))
        .limit(1);
      debtCategoryId = category[0].id;
    }

    const result = await this.db
      .insert(debts)
      .values({
        user_id: debtData.userId,
        description: debtData.description,
        original_amount: debtData.originalAmount.toString(),
        pending_amount: debtData.pendingAmount.toString(),
        due_date: debtData.dueDate,
        paid: debtData.paid,
        creditor_id: debtData.creditorId || null,
        category_id: debtCategoryId,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: number, debtData: Partial<IDebt>): Promise<IDebt> {
    const updateData: Record<string, any> = {};

    if (debtData.description !== undefined)
      updateData.description = debtData.description;
    if (debtData.pendingAmount !== undefined)
      updateData.pending_amount = debtData.pendingAmount.toString();
    if (debtData.dueDate !== undefined) updateData.due_date = debtData.dueDate;
    if (debtData.paid !== undefined) updateData.paid = debtData.paid;

    const result = await this.db
      .update(debts)
      .set(updateData)
      .where(eq(debts.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(debts)
      .where(eq(debts.id, id))
      .returning();

    return result.length > 0;
  }

  async updatePendingAmount(id: number, amount: number): Promise<IDebt> {
    const debt = await this.findById(id);
    if (!debt) throw new Error("Debt not found");

    const newAmount = debt.pendingAmount - amount;
    const paid = newAmount <= 0;

    const result = await this.db
      .update(debts)
      .set({
        pending_amount: newAmount.toString(),
        paid,
      })
      .where(eq(debts.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  private mapToEntity(raw: any): IDebt {
    return {
      id: raw.id,
      userId: raw.user_id,
      description: raw.description,
      originalAmount: Number(raw.original_amount),
      pendingAmount: Number(raw.pending_amount),
      dueDate: raw.due_date,
      paid: raw.paid,
      creditorId: raw.creditor_id,
      categoryId: raw.category_id,
      category: raw.category
        ? {
            id: raw.category.id,
            name: raw.category.name,
            description: raw.category.description,
          }
        : null,
      creditor: raw.creditor
        ? {
            id: raw.creditor.id,
            name: raw.creditor.name,
            email: raw.creditor.email,
            username: raw.creditor.username,
            passwordHash: raw.creditor.password_hash,
            registration_date: raw.creditor.registration_date,
            active: raw.creditor.active,
          }
        : null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}
