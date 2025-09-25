import { goals } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const categorySchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
});

export const goalBaseSchema = createInsertSchema(goals);
export const selectGoalSchema = createSelectSchema(goals)
	.extend({
		category: categorySchema.nullable(),
		created_at: z.date(),
		updated_at: z.date(),
	})
	.transform((data) => ({
		...data,
		target_amount: Number(data.target_amount),
		current_amount: Number(data.current_amount),
		contribution_amount: Number(data.contribution_amount),
		created_at: new Date(data.created_at),
		updated_at: new Date(data.updated_at),
	}));

export const createGoalSchema = goalBaseSchema
	.extend({
		target_amount: z.number().positive("Target amount must be positive"),
		current_amount: z
			.number()
			.min(0, "Current amount cannot be negative")
			.optional(),
		end_date: z.coerce.date(),
		shared_user_id: z.number().optional(),
		category_id: z.number().int().optional(),
		contribution_frequency: z.number().int().positive().optional(),
		contribution_amount: z.number().positive("Contribution amount must be positive").optional(),
	})
	.omit({
		id: true,
	});

export const updateGoalSchema = goalBaseSchema
	.extend({
		target_amount: z
			.number()
			.positive("Target amount must be positive")
			.optional(),
		current_amount: z
			.number()
			.min(0, "Current amount cannot be negative")
			.optional(),
		end_date: z.coerce.date().optional(),
		shared_user_id: z.number().optional().nullable(),
		category_id: z.number().int().optional(),
		contribution_frequency: z.number().int().positive().optional(),
		contribution_amount: z.number().positive("Contribution amount must be positive").optional(),
	})
	.partial()
	.omit({
		id: true,
		user_id: true,
	});

export const updateProgressSchema = z.object({
	amount: z.number().min(0, "Amount cannot be negative"),
});

export type GoalResponse = z.infer<typeof selectGoalSchema>;
export type CreateGoalDto = z.infer<typeof createGoalSchema>;
export type UpdateGoalDTO = z.infer<typeof updateGoalSchema>;
export type UpdateProgressDTO = z.infer<typeof updateProgressSchema>;
