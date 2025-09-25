import { IEmail } from "@/email/domain/entities/IEmail";
import { IEmailService } from "@/email/domain/ports/email-service.port";
import { EmailProvider, EmailServiceFactory } from "./email-service.factory";

export class EmailService {
  private emailService: IEmailService;
  private static instance: EmailService;

  private constructor(provider: EmailProvider = "brevo") {
    this.emailService =
      EmailServiceFactory.getInstance().getEmailService(provider);
  }

  public static getInstance(provider?: EmailProvider): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService(provider);
    }
    return EmailService.instance;
  }

  /**
   * Send a simple email
   *
   * @param to Recipient email or array of email addresses
   * @param subject Email subject
   * @param content HTML or text content
   * @param options Additional email options
   * @returns True if the email was sent successfully
   */
  async sendSimpleEmail(
    to: string | string[],
    subject: string,
    content: string,
    options?: {
      isHtml?: boolean;
      cc?: string | string[];
      bcc?: string | string[];
      replyTo?: string;
    }
  ): Promise<boolean> {
    const email: IEmail = {
      to,
      subject,
      ...(options?.isHtml ? { html: content } : { text: content }),
      ...(options?.cc && { cc: options.cc }),
      ...(options?.bcc && { bcc: options.bcc }),
      ...(options?.replyTo && {
        replyTo: {
          email: options.replyTo,
        },
      }),
    };

    return this.emailService.sendEmail(email);
  }

  /**
   * Send an email with attachments
   *
   * @param to Recipient email or array of email addresses
   * @param subject Email subject
   * @param content HTML or text content
   * @param attachments Array of attachments
   * @param options Additional email options
   * @returns True if the email was sent successfully
   */
  async sendEmailWithAttachments(
    to: string | string[],
    subject: string,
    content: string,
    attachments: Array<{
      filename: string;
      content: string | Buffer;
      type?: string;
    }>,
    options?: {
      isHtml?: boolean;
      cc?: string | string[];
      bcc?: string | string[];
      replyTo?: string;
    }
  ): Promise<boolean> {
    const email: IEmail = {
      to,
      subject,
      ...(options?.isHtml ? { html: content } : { text: content }),
      ...(options?.cc && { cc: options.cc }),
      ...(options?.bcc && { bcc: options.bcc }),
      ...(options?.replyTo && {
        replyTo: {
          email: options.replyTo,
        },
      }),
      attachments,
    };

    return this.emailService.sendEmail(email);
  }

  /**
   * Send a custom email with full configuration
   *
   * @param email Complete email object
   * @returns True if the email was sent successfully
   */
  async sendCustomEmail(email: IEmail): Promise<boolean> {
    return this.emailService.sendEmail(email);
  }
}
