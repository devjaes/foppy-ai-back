import { IEmail } from "../entities/IEmail";

export interface IEmailService {
  /**
   * Send an email with optional attachments
   */
  sendEmail(email: IEmail): Promise<boolean>;
}
