import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import {
  createGoalContributionScheduleSchema,
  selectGoalContributionScheduleSchema,
  updateGoalContributionScheduleSchema,
} from "../../application/dtos/goal-contribution-schedule.dto";

const tags = ["Goal Contribution Schedule"];

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
  path: "/goal-contribution-schedules",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(selectGoalContributionScheduleSchema)),
        },
      },
      description: "Goal contribution schedules retrieved successfully",
    },
  },
});

export const getById = createRoute({
  path: "/goal-contribution-schedules/:id",
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
          schema: baseResponseSchema(selectGoalContributionScheduleSchema),
        },
      },
      description: "Goal contribution schedule retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution schedule not found",
    },
  },
});

export const listByGoal = createRoute({
  path: "/goals/:goalId/contribution-schedules",
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
          schema: baseResponseSchema(z.array(selectGoalContributionScheduleSchema)),
        },
      },
      description: "Goal contribution schedules retrieved successfully",
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

export const listByUser = createRoute({
  path: "/users/:userId/goal-contribution-schedules",
  method: "get",
  tags,
  request: {
    params: z.object({
      userId: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(selectGoalContributionScheduleSchema)),
        },
      },
      description: "User goal contribution schedules retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "User not found",
    },
  },
});

export const create = createRoute({
  path: "/goal-contribution-schedules",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(createGoalContributionScheduleSchema, "Goal contribution schedule creation data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectGoalContributionScheduleSchema),
        },
      },
      description: "Goal contribution schedule created successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid goal contribution schedule data",
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

export const update = createRoute({
  path: "/goal-contribution-schedules/:id",
  method: "patch",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: jsonContent(updateGoalContributionScheduleSchema, "Goal contribution schedule update data"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectGoalContributionScheduleSchema),
        },
      },
      description: "Goal contribution schedule updated successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution schedule not found",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid update data",
    },
  },
});

export const delete_ = createRoute({
  path: "/goal-contribution-schedules/:id",
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
      description: "Goal contribution schedule deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution schedule not found",
    },
  },
});

export const markAsCompleted = createRoute({
  path: "/goal-contribution-schedules/:id/complete",
  method: "post",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: jsonContent(
      z.object({
        contribution_id: z.number().int().positive(),
      }),
      "Contribution data"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectGoalContributionScheduleSchema),
        },
      },
      description: "Goal contribution schedule marked as completed successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution schedule not found",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid contribution ID",
    },
  },
});

export const markAsSkipped = createRoute({
  path: "/goal-contribution-schedules/:id/skip",
  method: "post",
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
          schema: baseResponseSchema(selectGoalContributionScheduleSchema),
        },
      },
      description: "Goal contribution schedule marked as skipped successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Goal contribution schedule not found",
    },
  },
});

export type ListRoute = typeof list;
export type GetByIdRoute = typeof getById;
export type ListByGoalRoute = typeof listByGoal;
export type ListByUserRoute = typeof listByUser;
export type CreateRoute = typeof create;
export type UpdateRoute = typeof update;
export type DeleteRoute = typeof delete_;
export type MarkAsCompletedRoute = typeof markAsCompleted;
export type MarkAsSkippedRoute = typeof markAsSkipped;