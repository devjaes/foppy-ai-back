import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";
import { ReportFormat, ReportType } from "../../domain/entities/report.entity";
import type { RouteConfig } from "@hono/zod-openapi";

const tags = ["Reports"];

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

const reportFiltersSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    categoryId: z.string().optional(),
    userId: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  }));

const generateReportSchema = z.object({
  type: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat),
  filters: reportFiltersSchema,
});

export const generate: RouteConfig = createRoute({
  path: "/reports",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(generateReportSchema, "Report generation data"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(
            z.object({
              id: z.string(),
              type: z.nativeEnum(ReportType),
              format: z.nativeEnum(ReportFormat),
              createdAt: z.string(),
              expiresAt: z.string(),
            })
          ),
        },
      },
      description: "Report generated successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Failed to generate report",
    },
  },
});

export const get: RouteConfig = createRoute({
  path: "/reports/{id}",
  method: "get",
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(
            z.object({
              id: z.string(),
              type: z.nativeEnum(ReportType),
              format: z.nativeEnum(ReportFormat),
              data: z.any(),
              createdAt: z.string(),
              expiresAt: z.string(),
            })
          ),
        },
        "application/pdf": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
      description: "Report retrieved successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Failed to get report",
    },
  },
});

export const delete_: RouteConfig = createRoute({
  path: "/reports/{id}",
  method: "delete",
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Report deleted successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Failed to delete report",
    },
  },
});

export type GenerateRoute = typeof generate;
export type GetRoute = typeof get;
export type DeleteRoute = typeof delete_;
