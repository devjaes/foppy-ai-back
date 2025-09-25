// Domain entities and ports
export { IEmail, IAttachment } from "./domain/entities/IEmail";
export { IEmailService } from "./domain/ports/email-service.port";

// Application services
export { EmailService } from "./application/services/email.service";
export {
  EmailServiceFactory,
  EmailProvider,
} from "./application/services/email-service.factory";

// Infrastructure adapters
export { BrevoEmailAdapter } from "./infrastructure/adapters/brevo-email.adapter";
export { DummyEmailAdapter } from "./infrastructure/adapters/dummy-email.adapter";
