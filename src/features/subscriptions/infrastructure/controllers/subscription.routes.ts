import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";
import { setPlanSchema } from "@/subscriptions/application/dtos/subscription.dto";

const tags = ["Subscriptions"];

const planSchema = z.object({
  id: z.number(),
  name: z.string(),
  durationDays: z.number(),
  price: z.number(),
  frequency: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const subscriptionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  planId: z.number(),
  plan: planSchema.nullable(),
  frequency: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  retirementDate: z.date().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

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

export const listPlans = createRoute({
  path: "/plans",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(planSchema)),
        },
      },
      description: "Plans retrieved successfully",
    },
  },
});

export const setPlan = createRoute({
  path: "/subscriptions",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(setPlanSchema, "Set plan data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(subscriptionSchema),
        },
      },
      description: "Plan set successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Plan or user not found",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid data",
    },
  },
});

export const cancelPlan = createRoute({
  path: "/subscriptions/:id/cancel",
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
          schema: baseResponseSchema(subscriptionSchema),
        },
      },
      description: "Plan cancelled successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Subscription not found",
    },
  },
});

export const getUserSubscription = createRoute({
  path: "/users/:userId/subscription",
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
          schema: baseResponseSchema(subscriptionSchema.nullable()),
        },
      },
      description: "User subscription retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "User subscription not found",
    },
  },
});

export type ListPlansRoute = typeof listPlans;
export type SetPlanRoute = typeof setPlan;
export type CancelPlanRoute = typeof cancelPlan;
export type GetUserSubscriptionRoute = typeof getUserSubscription;

