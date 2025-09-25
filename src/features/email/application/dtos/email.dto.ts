import { z } from "zod";

export const attachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  type: z.string().optional(),
});

export const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  from: z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
    })
    .optional(),
  replyTo: z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
    })
    .optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export type EmailDto = z.infer<typeof emailSchema>;
export type AttachmentDto = z.infer<typeof attachmentSchema>;
