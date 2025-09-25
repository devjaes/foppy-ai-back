import { z } from "zod";
import { selectScheduledTransactionSchema } from "../../application/dtos/scheduled-transaction.dto";
import { IScheduledTransaction } from "../../domain/entities/IScheduledTransaction";

export class ScheduledTransactionApiAdapter {
	static toApiResponse(
		scheduledTransaction: IScheduledTransaction
	): z.infer<typeof selectScheduledTransactionSchema> {
		return {
			id: scheduledTransaction.id,
			user_id: scheduledTransaction.userId,
			name: scheduledTransaction.name,
			amount: scheduledTransaction.amount,
			category_id: scheduledTransaction.categoryId || null,
			description: scheduledTransaction.description || null,
			payment_method_id: scheduledTransaction.paymentMethodId || null,
			frequency: scheduledTransaction.frequency,
			next_execution_date: scheduledTransaction.nextExecutionDate,
			active: scheduledTransaction.active,
		};
	}

	static toApiResponseList(
		scheduledTransactions: IScheduledTransaction[]
	): z.infer<typeof selectScheduledTransactionSchema>[] {
		return scheduledTransactions.map(this.toApiResponse);
	}
}
