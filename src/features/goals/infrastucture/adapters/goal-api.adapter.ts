import { z } from "zod";
import { selectGoalSchema } from "@/goals/application/dtos/goal.dto";
import { IGoal } from "@/goals/domain/entities/IGoal";

export class GoalApiAdapter {
	static toApiResponse(goal: IGoal): z.infer<typeof selectGoalSchema> {
		return {
			id: goal.id,
			user_id: goal.userId,
			shared_user_id: goal.sharedUserId || null,
			name: goal.name,
			target_amount: goal.targetAmount,
			current_amount: goal.currentAmount,
			end_date: goal.endDate,
			contribution_frequency: Number(goal.contributionFrequency),
			contribution_amount: Number(goal.contributionAmount),
			category_id: goal.categoryId || null,
			category: goal.category ? {
				id: goal.category.id,
				name: goal.category.name,
				description: goal.category.description || null,
			} : null,
			created_at: goal.createdAt,
			updated_at: goal.updatedAt,
		};
	}

	static toApiResponseList(goals: IGoal[]): z.infer<typeof selectGoalSchema>[] {
		return goals.map(this.toApiResponse);
	}
}
