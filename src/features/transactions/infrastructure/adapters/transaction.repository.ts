import { and, between, eq, gte, lte, sql } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { transactions, categories, payment_methods } from "@/schema";
import { ITransactionRepository } from "../../domain/ports/transaction-repository.port";
import { ITransaction } from "../../domain/entities/ITransaction";
import { TransactionFilters } from "../../application/dtos/transaction.dto";
import { MonthlyTrendData } from "@/transactions/domain/entities/ITrends";
import { setEndOfDay, setStartOfDay } from "@/shared/utils/date.utils";

export class PgTransactionRepository implements ITransactionRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgTransactionRepository;

  private constructor() {}

  public static getInstance(): PgTransactionRepository {
    if (!PgTransactionRepository.instance) {
      PgTransactionRepository.instance = new PgTransactionRepository();
    }
    return PgTransactionRepository.instance;
  }

  async findAll(): Promise<ITransaction[]> {
    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      );
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<ITransaction | null> {
    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      )
      .where(eq(transactions.id, id));
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByUserId(userId: number): Promise<ITransaction[]> {
    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      )
      .where(eq(transactions.user_id, userId));
    return result.map(this.mapToEntity);
  }

  async findByUserIdAndDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ITransaction[]> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.user_id, userId),
          gte(transactions.date, setStartOfDay(startDate)),
          lte(transactions.date, setEndOfDay(endDate))
        )
      );
    return result.map(this.mapToEntity);
  }

  async findByFilters(
    userId: number,
    filters: TransactionFilters
  ): Promise<ITransaction[]> {
    const conditions = [eq(transactions.user_id, userId)];

    if (filters.startDate && filters.endDate) {
      conditions.push(
        between(
          transactions.date,
          setStartOfDay(new Date(filters.startDate)),
          setEndOfDay(new Date(filters.endDate))
        )
      );
    } else if (filters.startDate) {
      conditions.push(
        gte(transactions.date, setStartOfDay(new Date(filters.startDate)))
      );
    } else if (filters.endDate) {
      conditions.push(
        lte(transactions.date, setEndOfDay(new Date(filters.endDate)))
      );
    }

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters.category_id) {
      conditions.push(eq(transactions.category_id, filters.category_id));
    }

    if (filters.payment_method_id) {
      conditions.push(
        eq(transactions.payment_method_id, filters.payment_method_id)
      );
    }

    if (filters.min_amount) {
      conditions.push(
        gte(transactions.amount, sql`${filters.min_amount}::numeric`)
      );
    }

    if (filters.max_amount) {
      conditions.push(
        lte(transactions.amount, sql`${filters.max_amount}::numeric`)
      );
    }

    if (filters.debt_id) {
      conditions.push(eq(transactions.debt_id, filters.debt_id));
    }

    if (filters.contribution_id) {
      conditions.push(
        eq(transactions.contribution_id, filters.contribution_id)
      );
    }

    if (filters.budget_id) {
      conditions.push(eq(transactions.budget_id, filters.budget_id));
    }

    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      )
      .where(and(...conditions))
      .orderBy(transactions.date);

    return result.map(this.mapToEntity);
  }

  async create(
    transactionData: Omit<ITransaction, "id" | "date">
  ): Promise<ITransaction> {
    const result = await this.db
      .insert(transactions)
      .values({
        user_id: transactionData.userId,
        amount: transactionData.amount.toString(),
        type: transactionData.type,
        category_id: transactionData.categoryId,
        description: transactionData.description || null,
        payment_method_id: transactionData.paymentMethodId || null,
        scheduled_transaction_id:
          transactionData.scheduledTransactionId || null,
        debt_id: transactionData.debtId || null,
        contribution_id: transactionData.contributionId || null,
        budget_id: transactionData.budgetId || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(
    id: number,
    transactionData: Partial<ITransaction>
  ): Promise<ITransaction> {
    const updateData: Record<string, any> = {};

    if (transactionData.amount !== undefined) {
      updateData.amount = transactionData.amount;
    }
    if (transactionData.type !== undefined) {
      updateData.type = transactionData.type;
    }
    if (transactionData.categoryId !== undefined) {
      updateData.category_id = transactionData.categoryId;
    }
    if (transactionData.description !== undefined) {
      updateData.description = transactionData.description;
    }
    if (transactionData.paymentMethodId !== undefined) {
      updateData.payment_method_id = transactionData.paymentMethodId;
    }
    if (transactionData.scheduledTransactionId !== undefined) {
      updateData.scheduled_transaction_id =
        transactionData.scheduledTransactionId;
    }
    if (transactionData.debtId !== undefined) {
      updateData.debt_id = transactionData.debtId;
    }

    const result = await this.db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();

    return result.length > 0;
  }

  async getMonthlyBalance(
    userId: number,
    month: Date
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }> {
    const year = month.getUTCFullYear();
    const monthNumber = month.getUTCMonth();

    const startDate = new Date(Date.UTC(year, monthNumber, 1));
    const endDate = new Date(Date.UTC(year, monthNumber + 1, 0));

    const result = await this.db
      .select({
        type: transactions.type,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.user_id, userId),
          between(transactions.date, startDate, endDate)
        )
      )
      .groupBy(transactions.type);

    const totals = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    };

    result.forEach((row) => {
      if (row.type === "INCOME") {
        totals.totalIncome = Number(row.total) || 0;
      } else {
        totals.totalExpense = Number(row.total) || 0;
      }
    });

    totals.balance = totals.totalIncome - totals.totalExpense;
    return totals;
  }

  async getCategoryTotals(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{ categoryId: number; categoryName: string | null; total: number }>
  > {
    const utcStartDate = setStartOfDay(startDate);
    const utcEndDate = setEndOfDay(endDate);


    const result = await this.db
      .select({
        categoryId: transactions.category_id,
        categoryName: categories.name,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .where(
        and(
          eq(transactions.user_id, userId),
          between(transactions.date, utcStartDate, utcEndDate)
        )
      )
      .groupBy(transactions.category_id, categories.name);

    return result.map((row) => ({
      categoryId: row.categoryId || 0,
      categoryName: row.categoryName,
      total: Number(row.total) || 0,
    }));
  }
  private mapToEntity(raw: any): ITransaction {
    return {
      id: raw.id,
      userId: raw.user_id,
      amount: Number(raw.amount),
      type: raw.type,
      categoryId: raw.category_id,
      category: raw.category
        ? {
            id: raw.category.id,
            name: raw.category.name,
            description: raw.category.description,
          }
        : null,
      description: raw.description,
      paymentMethodId: raw.payment_method_id,
      paymentMethod: raw.payment_method
        ? {
            id: raw.payment_method.id,
            name: raw.payment_method.name,
            type: raw.payment_method.type,
            lastFourDigits: raw.payment_method.last_four_digits,
            userId: raw.payment_method.user_id,
            createdAt: raw.payment_method.created_at,
            updatedAt: raw.payment_method.updated_at,
          }
        : null,
      date: raw.date,
      scheduledTransactionId: raw.scheduled_transaction_id,
      debtId: raw.debt_id,
      budgetId: raw.budget_id,
      contributionId: raw.contribution_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }

  async getMonthlyTrends(userId: number): Promise<MonthlyTrendData[]> {
    console.log("Getting monthly trends for user:", userId);

    try {
      const result = await this.db
        .select({
          month: sql<string>`date_trunc('month', ${transactions.date})::date`,
          type: transactions.type,
          total: sql<string>`COALESCE(sum(${transactions.amount}::numeric), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.user_id, userId))
        .groupBy(
          sql`date_trunc('month', ${transactions.date})::date`,
          transactions.type
        )
        .orderBy(sql`date_trunc('month', ${transactions.date})::date`);

      console.log("Raw query result:", result);

      if (!result || result.length === 0) {
        return [];
      }

      const monthlyData: Record<string, MonthlyTrendData> = {};

      result.forEach(({ month, type, total }) => {
        const monthKey = month.substring(0, 7);

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            income: 0,
            expense: 0,
          };
        }

        if (type === "INCOME") {
          monthlyData[monthKey].income = Number(total) || 0;
        } else {
          monthlyData[monthKey].expense = Number(total) || 0;
        }
      });

      const trends = Object.values(monthlyData).sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );

      console.log("Processed trends:", trends);
      return trends;
    } catch (error) {
      console.error("Error in getMonthlyTrends:", error);
      throw error;
    }
  }

  async findByDebtId(debtId: number): Promise<ITransaction[]> {
    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      )
      .where(eq(transactions.debt_id, debtId));
    return result.map(this.mapToEntity);
  }

  async findByContributionId(contributionId: number): Promise<ITransaction[]> {
    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      )
      .where(eq(transactions.contribution_id, contributionId));
    return result.map(this.mapToEntity);
  }

  async findByBudgetId(budgetId: number): Promise<ITransaction[]> {
    const result = await this.db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        amount: transactions.amount,
        type: transactions.type,
        category_id: transactions.category_id,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        description: transactions.description,
        payment_method_id: transactions.payment_method_id,
        payment_method: {
          id: payment_methods.id,
          name: payment_methods.name,
          type: payment_methods.type,
          last_four_digits: payment_methods.last_four_digits,
          user_id: payment_methods.user_id,
        },
        date: transactions.date,
        scheduled_transaction_id: transactions.scheduled_transaction_id,
        debt_id: transactions.debt_id,
        budget_id: transactions.budget_id,
        contribution_id: transactions.contribution_id,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(
        payment_methods,
        eq(transactions.payment_method_id, payment_methods.id)
      )
      .where(eq(transactions.budget_id, budgetId));
    return result.map(this.mapToEntity);
  }
}
