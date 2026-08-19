import type { MobileSyncMessage, MobileSyncMessageBroker } from './mobile-sync-message';

export class InMemoryMobileSyncBroker implements MobileSyncMessageBroker {
  private readonly messages: MobileSyncMessage[] = [];

  async publish(message: MobileSyncMessage): Promise<void> {
    this.messages.push(message);
  }

  drain(): MobileSyncMessage[] {
    return this.messages.splice(0, this.messages.length);
  }

  peek(): MobileSyncMessage[] {
    return [...this.messages];
  }
}
