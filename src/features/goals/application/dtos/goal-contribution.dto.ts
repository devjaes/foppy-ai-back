import { goal_contributions } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const goalContributionBaseSchema = createInsertSchema(goal_contributions);
export const selectGoalContributionSchema = createSelectSchema(goal_contributions);

export const createGoalContributionSchema = goalContributionBaseSchema
  .extend({
    amount: z.number().positive("Amount must be positive"),
    payment_method_id: z.number().optional(),
    description: z.string().optional(),
  })
  .omit({
    id: true,
    date: true,
  });
export type GoalContributionResponse = z.infer<typeof selectGoalContributionSchema>;
export type CreateGoalContributionDTO = z.infer<typeof createGoalContributionSchema>;