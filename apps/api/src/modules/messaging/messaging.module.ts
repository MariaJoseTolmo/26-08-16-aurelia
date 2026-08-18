import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { DisabledEmailTransport } from './disabled-email.transport';
import { EmailTemplateService } from './email-template.service';
import { InspectionRejectionEmailTemplateService } from './inspection-rejection-email-template.service';
import { MessagingService } from './messaging.service';
import { EMAIL_TRANSPORT, EmailTransport } from './messaging.types';
import { SmtpEmailTransport } from './smtp-email.transport';
import { WasteSidrepRequestCorrectedEmailTemplateService } from './waste-sidrep-request-corrected-email-template.service';
import { WasteSidrepRequestRejectedEmailTemplateService } from './waste-sidrep-request-rejected-email-template.service';
import { WasteSinaderReportEmailTemplateService } from './waste-sinader-report-email-template.service';

export type MessagingModuleOptions = {
  emailTransport?: Type<EmailTransport>;
  disabled?: boolean;
};

@Global()
@Module({})
export class MessagingModule {
  static register(options: MessagingModuleOptions = {}): DynamicModule {
    const emailTransport = options.emailTransport ?? (options.disabled ? DisabledEmailTransport : SmtpEmailTransport);

    return {
      global: true,
      module: MessagingModule,
      providers: [
        EmailTemplateService,
        InspectionRejectionEmailTemplateService,
        WasteSidrepRequestCorrectedEmailTemplateService,
        WasteSidrepRequestRejectedEmailTemplateService,
        WasteSinaderReportEmailTemplateService,
        MessagingService,
        emailTransport,
        {
          provide: EMAIL_TRANSPORT,
          useExisting: emailTransport,
        },
      ],
      exports: [
        EmailTemplateService,
        InspectionRejectionEmailTemplateService,
        WasteSidrepRequestCorrectedEmailTemplateService,
        WasteSidrepRequestRejectedEmailTemplateService,
        WasteSinaderReportEmailTemplateService,
        MessagingService,
        EMAIL_TRANSPORT,
      ],
    };
  }
}
