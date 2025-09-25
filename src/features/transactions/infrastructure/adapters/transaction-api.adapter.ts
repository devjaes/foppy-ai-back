import { z } from "zod";
import { selectTransactionSchema } from "@/transactions/application/dtos/transaction.dto";
import { ITransaction } from "@/transactions/domain/entities/ITransaction";

export class TransactionApiAdapter {
	static toApiResponse(
		transaction: ITransaction
	): z.infer<typeof selectTransactionSchema> {
		
		return {
			id: transaction.id,
			user_id: transaction.userId,
			amount: transaction.amount.toString(),
			type: transaction.type,
			category_id: transaction.categoryId || null,
			category: transaction.category ? {
				id: transaction.category.id,
				name: transaction.category.name,
				description: transaction.category.description ?? null,
			} : null,
			description: transaction.description || null,
			payment_method_id: transaction.paymentMethodId || null,
			payment_method: transaction.paymentMethod ? {
				id: transaction.paymentMethod.id,
				name: transaction.paymentMethod.name,
				type: transaction.paymentMethod.type,
				last_four_digits: transaction.paymentMethod.lastFourDigits ?? null,
				user_id: transaction.paymentMethod.userId,
			} : null,
			date: transaction.date,
			scheduled_transaction_id: transaction.scheduledTransactionId || null,
			debt_id: transaction.debtId || null,
			contribution_id: transaction.contributionId || null,
			budget_id: transaction.budgetId || null,
			origin: transaction.debtId ? "DEBT" : 
				transaction.contributionId ? "GOAL" : 
				transaction.budgetId ? "BUDGET" : 
				"OTHER",
			created_at: transaction.createdAt ?? new Date(),
			updated_at: transaction.updatedAt ?? new Date(),
		};
	}

	static toApiResponseList(
		transactions: ITransaction[]
	): z.infer<typeof selectTransactionSchema>[] {
		return transactions.map(this.toApiResponse);
	}
}
