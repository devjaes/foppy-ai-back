import { z } from "zod";
import { selectDebtSchema } from "@/debts/application/dtos/debt.dto";
import { IDebt } from "@/debts/domain/entities/IDebt";

export class DebtApiAdapter {
	static toApiResponse(debt: IDebt): z.infer<typeof selectDebtSchema> {
		return {
			id: debt.id,
			user_id: debt.userId,
			description: debt.description,
			original_amount: Number(debt.originalAmount),
			pending_amount: Number(debt.pendingAmount),
			due_date: debt.dueDate,
			paid: debt.paid,
			creditor_id: debt.creditorId || null,
			category_id: debt.categoryId || null,
			category: debt.category ? {
				id: debt.category.id,
				name: debt.category.name,
				description: debt.category.description || null,
			} : null,
			creditor: debt.creditor ? {
				id: debt.creditor.id,
				name: debt.creditor.name,
				email: debt.creditor.email,
			} : null,
			created_at: debt.createdAt,
			updated_at: debt.updatedAt,
		};
	}

	static toApiResponseList(debts: IDebt[]): z.infer<typeof selectDebtSchema>[] {
		return debts.map(this.toApiResponse);
	}
}
