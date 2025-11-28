import { z } from "zod";
import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "../../domain/entities/recommendation.types";
import {
  Recommendation,
  QuickAction,
} from "../../domain/entities/recommendation.entity";

export const createRecommendationSchema = z.object({
  userId: z.number(),
  type: z.enum([
    "SPENDING_ANALYSIS",
    "GOAL_OPTIMIZATION",
    "BUDGET_SUGGESTION",
    "DEBT_REMINDER",
  ]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  data: z.any().optional(),
  actionable: z.boolean().default(false),
  actions: z
    .array(
      z.object({
        label: z.string(),
        path: z.string(),
        prefilledData: z.record(z.any()).optional(),
      })
    )
    .optional(),
  expiresAt: z.date().optional(),
});

export type CreateRecommendationDTO = z.infer<
  typeof createRecommendationSchema
>;

export const updateStatusSchema = z.object({
  status: z.enum(["VIEWED", "DISMISSED", "ACTED"]),
});

export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;

export interface RecommendationResponseDTO {
  id: number;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  data?: any;
  actionable: boolean;
  actions?: QuickAction[];
  status: RecommendationStatus;
  createdAt: string;
  expiresAt?: string;
}

export function toResponseDTO(rec: Recommendation): RecommendationResponseDTO {
  return {
    id: rec.id,
    type: rec.type,
    priority: rec.priority,
    title: rec.title,
    description: rec.description,
    data: rec.data,
    actionable: rec.actionable,
    actions: rec.actions,
    status: rec.status,
    createdAt: rec.createdAt.toISOString(),
    expiresAt: rec.expiresAt?.toISOString(),
  };
}
