import { goal_contribution_schedule } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const goalContributionScheduleBaseSchema = createInsertSchema(goal_contribution_schedule);
export const selectGoalContributionScheduleSchema = createSelectSchema(goal_contribution_schedule).transform((data) => ({
  ...data,
  amount: Number(data.amount),
}));

export const createGoalContributionScheduleSchema = goalContributionScheduleBaseSchema
  .extend({
    amount: z.number().positive("Amount must be positive"),
    scheduled_date: z.coerce.date(),
    status: z.enum(["pending", "completed", "skipped"]).default("pending"),
  })
  .omit({
    id: true,
    contribution_id: true,
  });

export const updateGoalContributionScheduleSchema = goalContributionScheduleBaseSchema
  .extend({
    amount: z.number().positive("Amount must be positive").optional(),
    scheduled_date: z.coerce.date().optional(),
    status: z.enum(["pending", "completed", "skipped"]).optional(),
  })
  .partial()
  .omit({
    id: true,
    goal_id: true,
    user_id: true,
    contribution_id: true,
  });

export type GoalContributionScheduleResponse = z.infer<typeof selectGoalContributionScheduleSchema>;
export type CreateGoalContributionScheduleDTO = z.infer<typeof createGoalContributionScheduleSchema>;
export type UpdateGoalContributionScheduleDTO = z.infer<typeof updateGoalContributionScheduleSchema>;