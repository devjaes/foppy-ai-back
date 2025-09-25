import { z } from "zod";
import { selectNotificationSchema } from "../../application/dtos/notification.dto";
import { INotification } from "../../domain/entities/INotification";

export class NotificationApiAdapter {
  static toApiResponse(
    notification: INotification
  ): z.infer<typeof selectNotificationSchema> {
    return {
      id: notification.id,
      user_id: notification.userId,
      title: notification.title,
      subtitle: notification.subtitle || null,
      message: notification.message,
      read: notification.read,
      type: notification.type,
      created_at: notification.createdAt,
      expires_at: notification.expiresAt || null,
    };
  }

  static toApiResponseList(
    notifications: INotification[]
  ): z.infer<typeof selectNotificationSchema>[] {
    return notifications.map(this.toApiResponse);
  }
}
