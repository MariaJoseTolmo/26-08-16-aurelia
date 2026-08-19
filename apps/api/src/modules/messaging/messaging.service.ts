import { Inject, Injectable } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import {
  EMAIL_TRANSPORT,
  EmailDeliveryResult,
  EmailRecipient,
  EmailTransport,
  InspectionFindingAssignedEmailParams,
  OutboundEmail,
  RenderedEmail,
} from './messaging.types';

@Injectable()
export class MessagingService {
  constructor(
    private readonly templates: EmailTemplateService,
    @Inject(EMAIL_TRANSPORT)
    private readonly emailTransport: EmailTransport,
  ) {}

  renderInspectionFindingAssigned(
    params: InspectionFindingAssignedEmailParams,
  ): RenderedEmail {
    return this.templates.renderInspectionFindingAssigned(params);
  }

  async sendInspectionFindingAssigned(input: {
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    replyTo?: EmailRecipient;
    params: InspectionFindingAssignedEmailParams;
  }): Promise<EmailDeliveryResult> {
    const rendered = this.renderInspectionFindingAssigned(input.params);
    return this.send({
      ...rendered,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
    });
  }

  async send(message: OutboundEmail): Promise<EmailDeliveryResult> {
    this.ensureRecipients(message.to, 'to');
    if (message.cc) this.ensureRecipients(message.cc, 'cc');
    if (message.bcc) this.ensureRecipients(message.bcc, 'bcc');
    if (message.replyTo) this.ensureRecipients([message.replyTo], 'replyTo');
    return this.emailTransport.send(message);
  }

  private ensureRecipients(recipients: EmailRecipient[], field: string): void {
    if (field === 'to' && recipients.length === 0) {
      throw new TypeError('At least one recipient is required');
    }

    recipients.forEach((recipient, index) => {
      const email = recipient.email?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new TypeError(`${field}[${index}].email is invalid`);
      }
    });
  }
}
