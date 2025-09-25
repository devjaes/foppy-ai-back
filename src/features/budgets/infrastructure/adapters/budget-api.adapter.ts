import { z } from "zod";
import { selectBudgetSchema } from "@/budgets/application/dtos/budget.dto";
import { IBudget } from "@/budgets/domain/entities/IBudget";

export class BudgetApiAdapter {
	static toApiResponse(budget: IBudget): z.infer<typeof selectBudgetSchema> {
		return {
			id: budget.id,
			user_id: budget.userId,
			shared_user_id: budget.sharedUserId || null,
			category_id: budget.categoryId,
			category: budget.category ? {
				id: budget.category.id,
				name: budget.category.name,
				description: budget.category.description || null,
			} : null,
			limit_amount: Number(budget.limitAmount),
			current_amount: Number(budget.currentAmount),
			month: budget.month,
			created_at: budget.createdAt,
			updated_at: budget.updatedAt,
		};
	}

	static toApiResponseList(
		budgets: IBudget[]
	): z.infer<typeof selectBudgetSchema>[] {
		return budgets.map(this.toApiResponse);
	}
}
