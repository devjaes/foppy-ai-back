import { categories } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const categoryBaseSchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);

export const createCategorySchema = categoryBaseSchema
  .extend({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    description: z.string().optional(),
  })
  .omit({
    id: true,
  });

export const updateCategorySchema = categoryBaseSchema
  .extend({
    name: z.string().min(2, "Category name must be at least 2 characters").optional(),
    description: z.string().optional().nullable(),
  })
  .partial()
  .omit({
    id: true,
  });

export type CategoryResponse = z.infer<typeof selectCategorySchema>;
export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;