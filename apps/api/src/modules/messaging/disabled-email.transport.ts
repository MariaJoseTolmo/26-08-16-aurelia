import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  EmailDeliveryResult,
  EmailTransport,
  OutboundEmail,
} from './messaging.types';

@Injectable()
export class DisabledEmailTransport implements EmailTransport {
  async send(_message: OutboundEmail): Promise<EmailDeliveryResult> {
    throw new ServiceUnavailableException(
      'Email delivery is not configured. Register a transport provider in MessagingModule.',
    );
  }
}
