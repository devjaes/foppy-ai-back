import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import {
  createFriendSchema,
  FriendResponseSchema,
  selectFriendSchema,
} from "@/friends/application/dtos/friend.dto";

const tags = ["Friends"];

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

const sendEmailSchema = z
  .object({
    to: z.string().email(),
    subject: z.string(),
    text: z.string().optional(),
    html: z.string().optional(),
    cc: z.string().email().optional(),
    bcc: z.string().email().optional(),
  })
  .refine((data) => !!data.html || !!data.text, {
    message: "Either of htmlContent or textContent is required",
    path: ["content"],
  });

export const sendEmail = createRoute({
  path: "/email",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(sendEmailSchema, "Email data"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(z.boolean()),
        },
      },
      description: "Email sent successfully",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Bad Request",
    },
  },
});

export type SendEmailRoute = typeof sendEmail;
