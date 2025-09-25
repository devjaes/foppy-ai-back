import { IEmailService } from "@/email/domain/ports/email-service.port";
import { BrevoEmailAdapter } from "@/email/infrastructure/adapters/brevo-email.adapter";
import { DummyEmailAdapter } from "@/email/infrastructure/adapters/dummy-email.adapter";

export type EmailProvider = "brevo" | "dummy";

export class EmailServiceFactory {
  private static instance: EmailServiceFactory;
  private services: Map<EmailProvider, IEmailService> = new Map();

  private constructor() {}

  public static getInstance(): EmailServiceFactory {
    if (!EmailServiceFactory.instance) {
      EmailServiceFactory.instance = new EmailServiceFactory();
    }
    return EmailServiceFactory.instance;
  }

  /**
   * Get an email service instance
   *
   * @param provider The email provider to use
   * @returns The email service implementation
   */
  getEmailService(provider: EmailProvider = "brevo"): IEmailService {
    if (!this.services.has(provider)) {
      this.services.set(provider, this.createEmailService(provider));
    }

    return this.services.get(provider)!;
  }

  /**
   * Register a custom email service implementation
   */
  registerEmailService(provider: EmailProvider, service: IEmailService): void {
    this.services.set(provider, service);
  }

  /**
   * Create a new email service instance based on the provider
   */
  private createEmailService(provider: EmailProvider): IEmailService {
    switch (provider) {
      case "brevo":
        // Get from environment variables or configuration
        const apiKey = process.env.BREVO_API_KEY || "";
        const fromEmail =
          process.env.EMAIL_FROM_ADDRESS || "no-reply@example.com";
        const fromName = process.env.EMAIL_FROM_NAME || "App Name";

        if (!apiKey) {
          console.warn(
            "BREVO_API_KEY is not set, falling back to dummy email provider"
          );
          return DummyEmailAdapter.getInstance(fromEmail, fromName);
        }

        return BrevoEmailAdapter.getInstance(apiKey, fromEmail, fromName);

      case "dummy":
        return DummyEmailAdapter.getInstance(
          process.env.EMAIL_FROM_ADDRESS || "no-reply@example.com",
          process.env.EMAIL_FROM_NAME
        );

      default:
        return DummyEmailAdapter.getInstance();
    }
  }
}
