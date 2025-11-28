import { z } from "zod";

export const setPlanSchema = z.object({
  planId: z.number().int().positive(),
  frequency: z.string().min(1),
  userId: z.number().int().positive(),
});

export type SetPlanDTO = z.infer<typeof setPlanSchema>;

