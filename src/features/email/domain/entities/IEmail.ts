export interface IAttachment {
  filename: string;
  content: string | Buffer;
  type?: string;
}

export interface IEmail {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  from?: {
    email: string;
    name?: string;
  };
  replyTo?: {
    email: string;
    name?: string;
  };
  attachments?: IAttachment[];
}
