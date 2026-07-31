import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
} from 'typeorm';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';

@Injectable()
export class NotificationDeliverySubscriber
  implements EntitySubscriberInterface<NotificationRecipientEntity>, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDeliverySubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly deliveries: NotificationDeliveryService,
  ) {}

  listenTo(): typeof NotificationRecipientEntity {
    return NotificationRecipientEntity;
  }

  onModuleInit(): void {
    if (!this.dataSource.subscribers.includes(this)) {
      this.dataSource.subscribers.push(this);
    }
  }

  onModuleDestroy(): void {
    const index = this.dataSource.subscribers.indexOf(this);
    if (index >= 0) this.dataSource.subscribers.splice(index, 1);
  }

  afterInsert(event: InsertEvent<NotificationRecipientEntity>): void {
    const notificationId = event.entity?.notificationId;
    const userId = event.entity?.userId;
    if (!notificationId || !userId) return;
    void this.deliveries.registerInApp(notificationId, [userId]).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Unable to register in-app delivery notification=${notificationId}: ${detail}`);
    });
  }
}
