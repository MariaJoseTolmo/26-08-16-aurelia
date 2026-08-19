export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');

export const EmailTemplate = {
  INSPECTION_FINDING_ASSIGNED: 'inspection.finding-assigned',
} as const;

export type EmailTemplate = (typeof EmailTemplate)[keyof typeof EmailTemplate];

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export type OutboundEmail = RenderedEmail & {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
};

export type EmailDeliveryResult = {
  provider: string;
  messageId: string | null;
  accepted: string[];
  rejected: string[];
};

export interface EmailTransport {
  send(message: OutboundEmail): Promise<EmailDeliveryResult>;
}

export type CallToActionEmailParams = {
  subject: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  actionLabel: string;
  actionUrl: string;
  preheader?: string;
};

export type InspectionFindingAssignedEmailParams = {
  recipientName: string;
  companyName: string;
  inspectionNumber: string;
  observationCount: number;
  platformUrl: string;
};

export type SendTemplatedEmailInput<TParams> = {
  template: EmailTemplate;
  params: TParams;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
};
