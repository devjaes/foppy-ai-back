import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import {
  createNotificationSchema,
  selectNotificationSchema,
  updateNotificationSchema,
} from "../../application/dtos/notification.dto";

const tags = ["Notifications"];

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
  path: "/notifications",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.array(selectNotificationSchema)),
        },
      },
      description: "Notifications retrieved successfully",
    },
  },
});

export const getById = createRoute({
  path: "/notifications/:id",
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
          schema: baseResponseSchema(selectNotificationSchema),
        },
      },
      description: "Notification retrieved successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Notification not found",
    },
  },
});

export const listByUser = createRoute({
  path: "/users/:userId/notifications",
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
          schema: baseResponseSchema(z.array(selectNotificationSchema)),
        },
      },
      description: "User notifications retrieved successfully",
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

export const listUnreadByUser = createRoute({
  path: "/users/:userId/notifications/unread",
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
          schema: baseResponseSchema(z.array(selectNotificationSchema)),
        },
      },
      description: "User unread notifications retrieved successfully",
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
  path: "/notifications",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(createNotificationSchema, "Notification creation data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectNotificationSchema),
        },
      },
      description: "Notification created successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Invalid notification data",
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

export const update = createRoute({
  path: "/notifications/:id",
  method: "patch",
  tags,
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: jsonContentRequired(updateNotificationSchema, "Notification update data"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(selectNotificationSchema),
        },
      },
      description: "Notification updated successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Notification not found",
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
  path: "/notifications/:id",
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
      description: "Notification deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Notification not found",
    },
  },
});

export const markAsRead = createRoute({
  path: "/notifications/:id/read",
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
          schema: baseResponseSchema(selectNotificationSchema),
        },
      },
      description: "Notification marked as read",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Notification not found",
    },
  },
});

export const markAllAsRead = createRoute({
  path: "/users/:userId/notifications/read-all",
  method: "patch",
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
          schema: baseResponseSchema(z.object({ marked: z.boolean() })),
        },
      },
      description: "All notifications marked as read",
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

export type ListRoute = typeof list;
export type GetByIdRoute = typeof getById;
export type ListByUserRoute = typeof listByUser;
export type ListUnreadByUserRoute = typeof listUnreadByUser;
export type CreateRoute = typeof create;
export type UpdateRoute = typeof update;
export type DeleteRoute = typeof delete_;
export type MarkAsReadRoute = typeof markAsRead;
export type MarkAllAsReadRoute = typeof markAllAsRead;
