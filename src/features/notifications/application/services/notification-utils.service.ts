import {
  INotification,
  NotificationType,
} from "../../domain/entities/INotification";
import { INotificationRepository } from "../../domain/ports/notification-repository.port";
import { NotificationEmailService } from "./notification-email.service";
import { NotificationSocketService } from "../../infrastructure/websocket/notification-socket.service";

export class NotificationUtilsService {
  private static instance: NotificationUtilsService;

  private notificationEmailService: NotificationEmailService;
  private notificationSocketService: NotificationSocketService;

  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {
    this.notificationEmailService = NotificationEmailService.getInstance();
    this.notificationSocketService = NotificationSocketService.getInstance();
  }

  public static getInstance(
    notificationRepository: INotificationRepository
  ): NotificationUtilsService {
    if (!NotificationUtilsService.instance) {
      NotificationUtilsService.instance = new NotificationUtilsService(
        notificationRepository
      );
    }
    return NotificationUtilsService.instance;
  }

  async createNotification(
    userId: number,
    title: string,
    subtitle: string | null,
    message: string,
    type: NotificationType,
    expiresAt?: Date | null,
    sendEmail: boolean = true
  ): Promise<INotification> {
    const notification = await this.notificationRepository.create({
      userId,
      title,
      subtitle,
      message,
      read: false,
      type,
      expiresAt,
      updatedAt: new Date(),
    });

    // Send email notification if requested
    if (sendEmail) {
      try {
        await this.notificationEmailService.sendNotificationEmail(notification);
      } catch (error) {
        console.error("Error sending notification email:", error);
      }
    }

    // Broadcast notification via WebSocket
    try {
      this.notificationSocketService.broadcastNotification(
        userId,
        notification
      );
    } catch (error) {
      console.error("Error broadcasting notification via WebSocket:", error);
    }

    return notification;
  }

  async createGoalNotification(
    userId: number,
    goalName: string,
    progress: number,
    message: string,
    sendEmail: boolean = true
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `Meta: ${goalName}`,
      `Progreso: ${progress}%`,
      message,
      NotificationType.GOAL,
      this.getExpirationDate(30), // Expira en 30 días
      sendEmail
    );
  }

  async createDebtNotification(
    userId: number,
    debtDescription: string,
    dueDate: Date,
    message: string,
    sendEmail: boolean = true
  ): Promise<INotification> {
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );

    return await this.createNotification(
      userId,
      `Deuda: ${debtDescription}`,
      `Vence en ${daysUntilDue} días`,
      message,
      NotificationType.DEBT,
      this.getExpirationDate(Math.max(daysUntilDue + 1, 7)), // Expira un día después del vencimiento o en 7 días
      sendEmail
    );
  }

  async createSuggestionNotification(
    userId: number,
    title: string,
    message: string,
    sendEmail: boolean = true
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `Sugerencia: ${title}`,
      null,
      message,
      NotificationType.SUGGESTION,
      this.getExpirationDate(15), // Expira en 15 días
      sendEmail
    );
  }

  async createWarningNotification(
    userId: number,
    title: string,
    subtitle: string | null,
    message: string,
    sendEmail: boolean = true
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `Advertencia: ${title}`,
      subtitle,
      message,
      NotificationType.WARNING,
      this.getExpirationDate(7), // Expira en 7 días
      sendEmail
    );
  }

  async createCongratulationNotification(
    userId: number,
    achievement: string,
    message: string,
    sendEmail: boolean = true
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `¡Felicitaciones!`,
      achievement,
      message,
      NotificationType.CONGRATULATION,
      this.getExpirationDate(30), // Expira en 30 días
      sendEmail
    );
  }

  async deleteExpiredNotifications(): Promise<number> {
    return await this.notificationRepository.deleteExpired();
  }

  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}