import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "../../domain/entities/recommendation.types";

const tags = ["Recommendations"];

const quickActionSchema = z.object({
  label: z.string(),
  path: z.string(),
  prefilledData: z.record(z.any()).optional(),
});

const recommendationResponseSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(RecommendationType),
  priority: z.nativeEnum(RecommendationPriority),
  title: z.string(),
  description: z.string(),
  data: z.any().optional(),
  actionable: z.boolean(),
  actions: z.array(quickActionSchema).optional(),
  status: z.nativeEnum(RecommendationStatus),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
});

const baseResponseSchema = <T extends z.ZodType>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema,
    message: z.string().optional(),
  });

const errorResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  message: z.string(),
});

export const getPending = createRoute({
  path: "/recommendations",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(recommendationResponseSchema)),
        },
      },
      description: "Pending recommendations retrieved successfully",
    },
    [HttpStatusCodes.UNAUTHORIZED]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "User not authorized to access recommendations",
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Unexpected error retrieving recommendations",
    },
  },
});

export const markAsViewed = createRoute({
  path: "/recommendations/:id/view",
  method: "patch",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ success: z.boolean() })),
        },
      },
      description: "Recommendation marked as viewed",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Recommendation not found",
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Unexpected error marking recommendation as viewed",
    },
  },
});

export const markAsDismissed = createRoute({
  path: "/recommendations/:id/dismiss",
  method: "patch",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ success: z.boolean() })),
        },
      },
      description: "Recommendation dismissed successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Recommendation not found",
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Unexpected error dismissing recommendation",
    },
  },
});

export const markAsActed = createRoute({
  path: "/recommendations/:id/act",
  method: "patch",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ success: z.boolean() })),
        },
      },
      description: "Recommendation marked as acted",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Recommendation not found",
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Unexpected error marking recommendation as acted",
    },
  },
});

export type GetPendingRoute = typeof getPending;
export type MarkAsViewedRoute = typeof markAsViewed;
export type MarkAsDismissedRoute = typeof markAsDismissed;
export type MarkAsActedRoute = typeof markAsActed;
