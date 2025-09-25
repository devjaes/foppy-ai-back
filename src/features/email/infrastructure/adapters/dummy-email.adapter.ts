import { IEmail } from "@/email/domain/entities/IEmail";
import { AbstractEmailService } from "@/email/application/services/abstract-email.service";

export class DummyEmailAdapter extends AbstractEmailService {
  private static instance: DummyEmailAdapter;

  private constructor(fromEmail: string, fromName?: string) {
    super(fromEmail, fromName);
  }

  public static getInstance(
    fromEmail: string = "no-reply@example.com",
    fromName?: string
  ): DummyEmailAdapter {
    if (!DummyEmailAdapter.instance) {
      DummyEmailAdapter.instance = new DummyEmailAdapter(fromEmail, fromName);
    }
    return DummyEmailAdapter.instance;
  }

  /**
   * Send an email using Brevo
   */
  async sendEmail(email: IEmail): Promise<boolean> {
    const preparedEmail = this.prepareEmail(email);

    console.log("============ DUMMY EMAIL ============");
    console.log(
      `From: ${preparedEmail.from?.name} <${preparedEmail.from?.email}>`
    );

    if (Array.isArray(preparedEmail.to)) {
      console.log(`To: ${preparedEmail.to.join(", ")}`);
    } else {
      console.log(`To: ${preparedEmail.to}`);
    }

    console.log(`Subject: ${preparedEmail.subject}`);

    if (preparedEmail.html) {
      console.log("HTML Content:");
      console.log(preparedEmail.html);
    }

    if (preparedEmail.text) {
      console.log("Text Content:");
      console.log(preparedEmail.text);
    }

    if (preparedEmail.attachments && preparedEmail.attachments.length > 0) {
      console.log("Attachments:");
      preparedEmail.attachments.forEach((attachment) => {
        console.log(
          `- ${attachment.filename} (${attachment.type || "unknown type"})`
        );
      });
    }

    console.log("====================================");

    return true;
  }
}
