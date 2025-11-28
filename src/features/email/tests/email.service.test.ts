import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../application/services/email.service';
import { EmailServiceFactory } from '../application/services/email-service.factory';
import { IEmailService } from '../domain/ports/email-service.port';

// Mocks
vi.mock('../application/services/email-service.factory', () => ({
  EmailServiceFactory: {
    getInstance: vi.fn().mockReturnValue({
      getEmailService: vi.fn(),
    }),
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let emailServiceMock: IEmailService;

  beforeEach(() => {
    emailServiceMock = {
      sendEmail: vi.fn(),
    } as any;

    (EmailServiceFactory.getInstance().getEmailService as any).mockReturnValue(emailServiceMock);

    (EmailService as any).instance = null;
    emailService = EmailService.getInstance();
  });

  describe('sendSimpleEmail', () => {
    it('should send simple email successfully', async () => {
      (emailServiceMock.sendEmail as any).mockResolvedValue(true);

      const result = await emailService.sendSimpleEmail(
        'test@example.com',
        'Subject',
        'Content'
      );

      expect(result).toBe(true);
      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Subject',
          text: 'Content',
        })
      );
    });

    it('should send simple html email successfully', async () => {
      (emailServiceMock.sendEmail as any).mockResolvedValue(true);

      const result = await emailService.sendSimpleEmail(
        'test@example.com',
        'Subject',
        '<p>Content</p>',
        { isHtml: true }
      );

      expect(result).toBe(true);
      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Subject',
          html: '<p>Content</p>',
        })
      );
    });
  });

  describe('sendEmailWithAttachments', () => {
    it('should send email with attachments successfully', async () => {
      (emailServiceMock.sendEmail as any).mockResolvedValue(true);

      const attachments = [{ filename: 'test.txt', content: 'test' }];
      const result = await emailService.sendEmailWithAttachments(
        'test@example.com',
        'Subject',
        'Content',
        attachments
      );

      expect(result).toBe(true);
      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Subject',
          text: 'Content',
          attachments,
        })
      );
    });
  });

  describe('sendCustomEmail', () => {
    it('should send custom email successfully', async () => {
      (emailServiceMock.sendEmail as any).mockResolvedValue(true);

      const email = {
        to: 'test@example.com',
        subject: 'Subject',
        text: 'Content',
      };
      const result = await emailService.sendCustomEmail(email);

      expect(result).toBe(true);
      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(email);
    });
  });
});
