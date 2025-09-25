import { z } from "zod";
import { selectGoalContributionScheduleSchema } from "@/goals/application/dtos/goal-contribution-schedule.dto";
import { IGoalContributionSchedule } from "@/goals/domain/entities/IGoalContributionSchedule";

export class GoalContributionScheduleApiAdapter {
  static toApiResponse(
    schedule: IGoalContributionSchedule
  ): z.infer<typeof selectGoalContributionScheduleSchema> {
    return {
      id: schedule.id,
      goal_id: schedule.goalId,
      user_id: schedule.userId,
      scheduled_date: schedule.scheduledDate,
      amount: Number(schedule.amount),
      status: schedule.status,
      contribution_id: schedule.contributionId || null,
      created_at: schedule.createdAt ?? new Date(),
      updated_at: schedule.updatedAt ?? new Date(),
    };
  }

  static toApiResponseList(
    schedules: IGoalContributionSchedule[]
  ): z.infer<typeof selectGoalContributionScheduleSchema>[] {
    return schedules.map(this.toApiResponse);
  }
}
