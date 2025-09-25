import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";
import {
  createCategorySchema,
  selectCategorySchema,
  updateCategorySchema,
} from "../../application/dtos/category.dto";

const tags = ["Categories"];

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
  path: "/categories",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(selectCategorySchema)),
        },
      },
      description: "Categories retrieved successfully",
    },
  },
});

export const getById = createRoute({
  path: "/categories/:id",
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
          schema: baseResponseSchema(selectCategorySchema),
        },
      },
      description: "Category retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Category not found",
    },
  },
});

export const create = createRoute({
  path: "/categories",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(createCategorySchema, "Category creation data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectCategorySchema),
        },
      },
      description: "Category created successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid category data",
    },
    [HttpStatusCodes.CONFLICT]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Category name already exists",
    },
  },
});

export const update = createRoute({
  path: "/categories/:id",
  method: "patch",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: jsonContentRequired(updateCategorySchema, "Category update data"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectCategorySchema),
        },
      },
      description: "Category updated successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Category not found",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid update data",
    },
    [HttpStatusCodes.CONFLICT]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Category name already exists",
    },
  },
});

export const delete_ = createRoute({
  path: "/categories/:id",
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
      description: "Category deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Category not found",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Cannot delete category that is in use",
    },
  },
});

export type ListRoute = typeof list;
export type GetByIdRoute = typeof getById;
export type CreateRoute = typeof create;
export type UpdateRoute = typeof update;
export type DeleteRoute = typeof delete_;