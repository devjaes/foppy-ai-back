import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";
import {
  createGoalContributionSchema,
  selectGoalContributionSchema,
} from "../../application/dtos/goal-contribution.dto";

const tags = ["Goal Contributions"];

const baseResponseSchema = <T extends z.ZodType>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema,
    message: z.string(),
  });

const errorResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  message: z.string(),
});

export const list = createRoute({
  path: "/goal-contributions",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(selectGoalContributionSchema)),
        },
      },
      description: "Goal contributions retrieved successfully",
    },
  },
});

export const getById = createRoute({
  path: "/goal-contributions/:id",
  method: "get",
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
          schema: baseResponseSchema(selectGoalContributionSchema),
        },
      },
      description: "Goal contribution retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution not found",
    },
  },
});

export const listByGoal = createRoute({
  path: "/goals/:goalId/contributions",
  method: "get",
  tags,
  request: {
    params: z.object({
      goalId: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(selectGoalContributionSchema)),
        },
      },
      description: "Goal contributions retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal not found",
    },
  },
});

export const create = createRoute({
  path: "/goal-contributions",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(createGoalContributionSchema, "Goal contribution creation data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectGoalContributionSchema),
        },
      },
      description: "Goal contribution created successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid goal contribution data",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal or user not found",
    },
  },
});

export const delete_ = createRoute({
  path: "/goal-contributions/:id",
  method: "delete",
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
          schema: baseResponseSchema(z.object({ deleted: z.boolean() })),
        },
      },
      description: "Goal contribution deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution not found",
    },
  },
});

export type ListRoute = typeof list;
export type GetByIdRoute = typeof getById;
export type ListByGoalRoute = typeof listByGoal;
export type CreateRoute = typeof create;
export type DeleteRoute = typeof delete_;