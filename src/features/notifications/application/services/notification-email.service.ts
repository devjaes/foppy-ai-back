import { EmailService } from "@/email/application/services/email.service";
import { baseTemplate } from "../../infrastructure/templates/base.template";
import { INotification } from "../../domain/entities/INotification";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";

export class NotificationEmailService {
  private static instance: NotificationEmailService;
  private emailService: EmailService;
  private userRepository: PgUserRepository;

  private constructor() {
    this.emailService = EmailService.getInstance();
    this.userRepository = PgUserRepository.getInstance();
  }

  public static getInstance(): NotificationEmailService {
    if (!NotificationEmailService.instance) {
      NotificationEmailService.instance = new NotificationEmailService();
    }
    return NotificationEmailService.instance;
  }

  /**
   * Send a notification by email
   * @param notification Notification object to send
   * @returns Promise<boolean> true if email was sent successfully
   */
  async sendNotificationEmail(notification: INotification): Promise<boolean> {
    try {
      // Get the user email
      const user = await this.userRepository.findById(notification.userId);
      if (!user) {
        throw new Error(`User with ID ${notification.userId} not found`);
      }

      // Generate email content using the template
      const emailContent = baseTemplate(
        notification.title,
        notification.subtitle || null,
        notification.message,
        notification.type
      );

      // Send the email
      return await this.emailService.sendSimpleEmail(
        user.email,
        notification.title,
        emailContent,
        {
          isHtml: true,
        }
      );
    } catch (error) {
      console.error("Error sending notification email:", error);
      return false;
    }
  }

  /**
   * Send a notification by email with custom template
   * @param notification Notification object to send
   * @param template Custom HTML template to use
   * @returns Promise<boolean> true if email was sent successfully
   */
  async sendNotificationEmailWithTemplate(
    notification: INotification,
    template: string
  ): Promise<boolean> {
    try {
      // Get the user email
      const user = await this.userRepository.findById(notification.userId);
      if (!user) {
        throw new Error(`User with ID ${notification.userId} not found`);
      }

      // Send the email with the custom template
      return await this.emailService.sendSimpleEmail(
        user.email,
        notification.title,
        template,
        {
          isHtml: true,
        }
      );
    } catch (error) {
      console.error("Error sending notification email with template:", error);
      return false;
    }
  }
}
