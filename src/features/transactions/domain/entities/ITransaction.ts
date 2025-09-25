import { ICategory } from "@/categories/domain/entities/ICategory";
import { IPaymentMethod } from "@/payment-methods/domain/entities/IPaymentMethod";

export interface ITransaction {
  id: number;
  userId: number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId?: number | null;
  category: ICategory | null;
  description?: string | null;
  paymentMethodId?: number | null;
  paymentMethod: IPaymentMethod | null;
  date: Date;
  scheduledTransactionId?: number | null;
  debtId?: number | null;
  contributionId?: number | null;
  budgetId?: number | null;
  origin?: "DEBT" | "GOAL" | "BUDGET" | "OTHER" | null;
  createdAt?: Date;
  updatedAt?: Date;
}
