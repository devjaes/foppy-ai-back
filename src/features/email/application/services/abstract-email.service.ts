import { IEmail } from "@/email/domain/entities/IEmail";
import { IEmailService } from "@/email/domain/ports/email-service.port";

export abstract class AbstractEmailService implements IEmailService {
  protected defaultFromEmail: string;
  protected defaultFromName?: string;

  constructor(fromEmail: string, fromName?: string) {
    this.defaultFromEmail = fromEmail;
    this.defaultFromName = fromName;
  }

  /**
   * Send an email using the provider implementation
   */
  abstract sendEmail(email: IEmail): Promise<boolean>;

  /**
   * Prepare the email with defaults
   */
  protected prepareEmail(email: IEmail): IEmail {
    return {
      ...email,
      from: email.from || {
        email: this.defaultFromEmail,
        name: this.defaultFromName,
      },
    };
  }
}
