import { z } from "zod";
import { selectGoalContributionSchema } from "@/goals/application/dtos/goal-contribution.dto";
import { IGoalContribution } from "@/goals/domain/entities/IGoalContribution";

export class GoalContributionApiAdapter {
  static toApiResponse(
    contribution: IGoalContribution
  ): z.infer<typeof selectGoalContributionSchema> {
    return {
      id: contribution.id,
      goal_id: contribution.goalId,
      user_id: contribution.userId,
      amount: contribution.amount.toString(),
      date: contribution.date,
      updated_at: contribution.updatedAt || new Date(),
      created_at: contribution.createdAt || new Date(),
    };
  }

  static toApiResponseList(
    contributions: IGoalContribution[]
  ): z.infer<typeof selectGoalContributionSchema>[] {
    return contributions.map(this.toApiResponse);
  }
}
