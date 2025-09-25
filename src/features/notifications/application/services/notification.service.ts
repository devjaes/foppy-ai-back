import { INotificationRepository } from "../../domain/ports/notification-repository.port";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { INotificationService } from "../../domain/ports/notification-service.port";
import { NotificationApiAdapter } from "../../infrastructure/adapters/notification-api.adapter";
import { NotificationEmailService } from "./notification-email.service";
import { NotificationUtilsService } from "./notification-utils.service";
import {
  CreateRoute,
  DeleteRoute,
  GetByIdRoute,
  ListByUserRoute,
  ListUnreadByUserRoute,
  ListRoute,
  MarkAsReadRoute,
  MarkAllAsReadRoute,
  UpdateRoute,
} from "../../infrastructure/controllers/notification.routes";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";

export class NotificationService implements INotificationService {
  private static instance: NotificationService;
  private userRepository: PgUserRepository;
  private notificationEmailService: NotificationEmailService;
  private notificationUtils: NotificationUtilsService;

  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {
    this.userRepository = PgUserRepository.getInstance();
    this.notificationEmailService = NotificationEmailService.getInstance();
    this.notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );
  }

  public static getInstance(
    notificationRepository: INotificationRepository
  ): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService(
        notificationRepository
      );
    }
    return NotificationService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const notifications = await this.notificationRepository.findAll();
    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponseList(notifications),
        message: "Notifications retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const notification = await this.notificationRepository.findById(Number(id));

    if (!notification) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Notification not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponse(notification),
        message: "Notification retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByUserId = createHandler<ListByUserRoute>(async (c) => {
    const userId = c.req.param("userId");

    const user = await this.userRepository.findById(Number(userId));
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const notifications = await this.notificationRepository.findByUserId(
      Number(userId)
    );
    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponseList(notifications),
        message: "User notifications retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getUnreadByUserId = createHandler<ListUnreadByUserRoute>(async (c) => {
    const userId = c.req.param("userId");

    const user = await this.userRepository.findById(Number(userId));
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const notifications = await this.notificationRepository.findUnreadByUserId(
      Number(userId)
    );
    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponseList(notifications),
        message: "User unread notifications retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  create = createHandler<CreateRoute>(async (c) => {
    const data = c.req.valid("json");
    const sendEmail = data.send_email !== undefined ? data.send_email : true;

    const user = await this.userRepository.findById(data.user_id);
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const notification = await this.notificationRepository.create({
      userId: data.user_id,
      title: data.title,
      subtitle: data.subtitle || null,
      message: data.message,
      read: false,
      type: data.type,
      expiresAt: data.expires_at || null,
      updatedAt: new Date(),
    });

    // Send email notification if requested
    if (sendEmail) {
      try {
        await this.notificationEmailService.sendNotificationEmail(notification);
      } catch (error) {
        console.error("Error sending notification email:", error);
        // Continue even if email fails
      }
    }

    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponse(notification),
        message: "Notification created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  update = createHandler<UpdateRoute>(async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const notification = await this.notificationRepository.findById(Number(id));
    if (!notification) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Notification not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const updateData = {
      title: data.title,
      subtitle: data.subtitle,
      message: data.message,
      read: data.read,
      type: data.type,
      expiresAt: data.expires_at,
    };

    const updatedNotification = await this.notificationRepository.update(
      Number(id),
      updateData
    );

    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponse(updatedNotification),
        message: "Notification updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    const notification = await this.notificationRepository.findById(Number(id));

    if (!notification) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Notification not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const deleted = await this.notificationRepository.delete(Number(id));
    return c.json(
      {
        success: true,
        data: { deleted },
        message: "Notification deleted successfully",
      },
      HttpStatusCodes.OK
    );
  });

  markAsRead = createHandler<MarkAsReadRoute>(async (c) => {
    const id = c.req.param("id");
    const notification = await this.notificationRepository.findById(Number(id));

    if (!notification) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Notification not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const updatedNotification = await this.notificationRepository.markAsRead(
      Number(id)
    );
    return c.json(
      {
        success: true,
        data: NotificationApiAdapter.toApiResponse(updatedNotification),
        message: "Notification marked as read",
      },
      HttpStatusCodes.OK
    );
  });

  markAllAsRead = createHandler<MarkAllAsReadRoute>(async (c) => {
    const userId = c.req.param("userId");

    const user = await this.userRepository.findById(Number(userId));
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const marked = await this.notificationRepository.markAllAsRead(
      Number(userId)
    );
    return c.json(
      {
        success: true,
        data: { marked },
        message: "All notifications marked as read",
      },
      HttpStatusCodes.OK
    );
  });
}
