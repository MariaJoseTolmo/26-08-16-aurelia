import type { MobileSyncBatchRequest } from '@aurelia/contracts';

export interface MobileSyncMessage {
  messageId: string;
  sessionId: string;
  batch: MobileSyncBatchRequest;
  enqueuedAt: string;
}

export interface MobileSyncMessageBroker {
  publish(message: MobileSyncMessage): Promise<void>;
}
