import { notifications } from "@/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { NotificationType } from "../../domain/entities/INotification";

export const notificationBaseSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications)
  .extend({
    created_at: z.date(),
    updated_at: z.date(),
  })
  .transform((data) => ({
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  }));

export const notificationTypeSchema = z.enum([
  NotificationType.GOAL,
  NotificationType.DEBT,
  NotificationType.SUGGESTION,
  NotificationType.WARNING,
  NotificationType.CONGRATULATION,
]);

export const createNotificationSchema = notificationBaseSchema
  .extend({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional().nullable(),
    message: z.string().min(1, "Message is required"),
    type: notificationTypeSchema,
    expires_at: z.coerce.date().optional().nullable(),
    send_email: z.boolean().optional().default(true),
  })
  .omit({
    id: true,
    created_at: true,
    read: true,
  });

export const updateNotificationSchema = notificationBaseSchema
  .extend({
    title: z.string().min(1, "Title is required").optional(),
    subtitle: z.string().optional().nullable(),
    message: z.string().min(1, "Message is required").optional(),
    read: z.boolean().optional(),
    type: notificationTypeSchema.optional(),
    expires_at: z.coerce.date().optional().nullable(),
  })
  .partial()
  .omit({
    id: true,
    user_id: true,
    created_at: true,
  });
