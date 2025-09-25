import { createRouter } from "../../../../core/infrastructure/lib/create-app";
import { EmailService } from "@/email/application/services/email.service";
import * as routes from "./email.routes";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { SendEmailRoute } from "./email.routes";

const emailService = EmailService.getInstance();

const sendEmailHandler = createHandler<SendEmailRoute>(async (c) => {
  try {
    const { to, subject, text, html, cc, bcc } = c.req.valid("json");

    // Validate that either html or text is provided
    if (!html && !text) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Either of htmlContent or textContent is required",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Determine content based on whether html or text is provided
    const content = html || text || "";
    const isHtml = !!html;

    // Optional parameters
    const options = {
      isHtml,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
    };

    const result = await emailService.sendSimpleEmail(
      to,
      subject,
      content,
      options
    );

    return c.json(
      {
        success: true,
        data: result,
        message: "Email sent successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to send email",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const router = createRouter().openapi(routes.sendEmail, sendEmailHandler);

export default router;
