import { IEmail, IAttachment } from "@/email/domain/entities/IEmail";
import { AbstractEmailService } from "@/email/application/services/abstract-email.service";
import {
  TransactionalEmailsApi,
  SendSmtpEmail,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

export class BrevoEmailAdapter extends AbstractEmailService {
  private apiInstance: TransactionalEmailsApi;
  private static instance: BrevoEmailAdapter;

  private constructor(apiKey: string, fromEmail: string, fromName?: string) {
    super(fromEmail, fromName);

    this.apiInstance = new TransactionalEmailsApi();
    this.apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }

  public static getInstance(
    apiKey: string,
    fromEmail: string,
    fromName?: string
  ): BrevoEmailAdapter {
    if (!BrevoEmailAdapter.instance) {
      BrevoEmailAdapter.instance = new BrevoEmailAdapter(
        apiKey,
        fromEmail,
        fromName
      );
    }
    return BrevoEmailAdapter.instance;
  }

  /**
   * Send an email using Brevo
   */
  async sendEmail(email: IEmail): Promise<boolean> {
    try {
      // Validate that either html or text content is provided
      if (!email.html && !email.text) {
        throw new Error("Either of htmlContent or textContent is required");
      }

      const preparedEmail = this.prepareEmail(email);
      const sendSmtpEmail = this.mapToBrevoEmail(preparedEmail);

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      return true;
    } catch (error) {
      console.error("Error sending email via Brevo:", error);
      return false;
    }
  }

  /**
   * Map our internal email format to Brevo's format
   */
  private mapToBrevoEmail(email: IEmail): SendSmtpEmail {
    const sendSmtpEmail = new SendSmtpEmail();

    // Set recipients
    sendSmtpEmail.to = this.formatRecipients(email.to);

    // Set CC and BCC if provided
    if (email.cc) {
      sendSmtpEmail.cc = this.formatRecipients(email.cc);
    }

    if (email.bcc) {
      sendSmtpEmail.bcc = this.formatRecipients(email.bcc);
    }

    // Set reply-to if provided
    if (email.replyTo) {
      sendSmtpEmail.replyTo = {
        email: email.replyTo.email,
        name: email.replyTo.name,
      };
    }

    // Set sender
    sendSmtpEmail.sender = {
      email: email.from?.email || this.defaultFromEmail,
      name: email.from?.name || this.defaultFromName,
    };

    // Set subject
    sendSmtpEmail.subject = email.subject;

    // Set content (HTML or Text)
    if (email.html) {
      sendSmtpEmail.htmlContent = email.html;
    }

    if (email.text) {
      sendSmtpEmail.textContent = email.text;
    }

    // Add attachments if provided
    if (email.attachments && email.attachments.length > 0) {
      sendSmtpEmail.attachment = this.formatAttachments(email.attachments);
    }

    return sendSmtpEmail;
  }

  /**
   * Format recipients to Brevo's format
   */
  private formatRecipients(
    recipients: string | string[]
  ): Array<{ email: string; name?: string }> {
    if (typeof recipients === "string") {
      return [{ email: recipients }];
    }

    return recipients.map((email) => ({ email }));
  }

  /**
   * Format attachments to Brevo's format
   */
  private formatAttachments(
    attachments: IAttachment[]
  ): Array<{ content: string; name: string; type?: string }> {
    return attachments.map((attachment) => {
      let content: string;

      if (Buffer.isBuffer(attachment.content)) {
        content = attachment.content.toString("base64");
      } else {
        content = Buffer.from(attachment.content).toString("base64");
      }

      return {
        content,
        name: attachment.filename,
        type: attachment.type,
      };
    });
  }
}
