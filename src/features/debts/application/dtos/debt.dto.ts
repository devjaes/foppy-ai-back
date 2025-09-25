import { debts } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const debtBaseSchema = createInsertSchema(debts);
export const selectDebtSchema = createSelectSchema(debts)
	.extend({
		category: z.object({
			id: z.number(),
			name: z.string(),
			description: z.string().nullable(),
		}).nullable(),
		creditor: z.object({
			id: z.number(),
			name: z.string(),
			email: z.string(),
		}).nullable(),
		created_at: z.date(),
		updated_at: z.date(),
	})
	.transform((data) => ({
		...data,
		original_amount: Number(data.original_amount),
		pending_amount: Number(data.pending_amount),
		created_at: new Date(data.created_at),
		updated_at: new Date(data.updated_at),
	}));

export const createDebtSchema = debtBaseSchema
	.extend({
		original_amount: z.number().positive("Amount must be positive"),
		due_date: z.coerce.date(),
		paid: z.boolean().default(false),
		creditor_id: z.number().optional(),
		category_id: z.number().optional(),
	})
	.omit({
		id: true,
		pending_amount: true,
	});

export const updateDebtSchema = debtBaseSchema
	.extend({
		description: z.string().optional(),
		pending_amount: z
			.number()
			.positive("Pending amount must be positive")
			.optional(),
		due_date: z.coerce.date().optional(),
		paid: z.boolean().optional(),
		category_id: z.number().optional(),
	})
	.partial()
	.omit({
		id: true,
		user_id: true,
		creditor_id: true,
		original_amount: true,
	});

export const payDebtSchema = z.object({
	amount: z.number().positive("Payment amount must be positive"),
	payment_method_id: z.number().optional(),
	description: z.string().optional(),
  });
