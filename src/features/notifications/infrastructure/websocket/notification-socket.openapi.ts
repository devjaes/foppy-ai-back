import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";

const tags = ["Notifications WebSocket"];

const baseResponseSchema = <T extends z.ZodType>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema,
    message: z.string(),
  });

export const wsStats = createRoute({
  path: "/notifications/ws/stats",
  method: "get",
  tags,
  description: "Get WebSocket notification connection statistics",
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: baseResponseSchema(
            z.object({
              totalConnections: z.number().describe("Total number of active WebSocket connections"),
            })
          ),
        },
      },
      description: "WebSocket statistics retrieved successfully",
    },
  },
});

// Note: WebSocket connection endpoint itself is not included in OpenAPI documentation
// as it's not a standard REST API endpoint
