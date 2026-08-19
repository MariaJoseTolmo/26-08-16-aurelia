import { Injectable, NotFoundException } from '@nestjs/common';
import type { MarkAllNotificationsReadResponse } from '@aurelia/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';

@Injectable()
export class NotificationRecipientStateService {
  constructor(
    @InjectRepository(NotificationRecipientEntity)
    private readonly recipientsRepository: Repository<NotificationRecipientEntity>,
  ) {}

  async dismiss(notificationId: string, userId: string): Promise<MarkAllNotificationsReadResponse> {
    const recipient = await this.recipientsRepository.findOneBy({ notificationId, userId });
    if (!recipient) throw new NotFoundException('Notification not found for user');

    const now = new Date();
    const updated = await this.recipientsRepository.query(
      'UPDATE notification_recipients SET read_at = COALESCE(read_at, $3), dismissed_at = COALESCE(dismissed_at, $3), updated_at = now() WHERE notification_id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId, now],
    ) as Array<{ id: string }>;

    return { updated: updated.length };
  }

  async readAndDismissPreviousInspectionThread(notificationId: string, userId: string): Promise<MarkAllNotificationsReadResponse> {
    const recipient = await this.recipientsRepository.findOne({
      where: { notificationId, userId },
      relations: { notification: true },
    });
    if (!recipient) throw new NotFoundException('Notification not found for user');

    const metadata = this.metadataOf(recipient.notification.metadata);
    const inspectionId = this.stringValue(metadata.inspectionId);
    const event = this.stringValue(metadata.event);
    const now = new Date();

    if (event !== 'inspection.closed' || !inspectionId) {
      if (!recipient.readAt) {
        recipient.readAt = now;
        await this.recipientsRepository.save(recipient);
        return { updated: 1 };
      }
      return { updated: 0 };
    }

    const cutoff = this.occurredAtOf(recipient.notification.createdAt, metadata.occurredAt);
    const rows = await this.recipientsRepository.find({
      where: { userId },
      relations: { notification: true },
    });
    const changed: NotificationRecipientEntity[] = [];

    for (const row of rows) {
      if (row.notificationId === notificationId) {
        if (!row.readAt) {
          row.readAt = now;
          changed.push(row);
        }
        continue;
      }
      if (row.dismissedAt) continue;
      const rowMetadata = this.metadataOf(row.notification.metadata);
      if (this.stringValue(rowMetadata.inspectionId) !== inspectionId) continue;
      if (this.occurredAtOf(row.notification.createdAt, rowMetadata.occurredAt).getTime() > cutoff.getTime()) continue;
      row.readAt = row.readAt ?? now;
      row.dismissedAt = now;
      changed.push(row);
    }

    if (changed.length > 0) await this.recipientsRepository.save(changed);
    return { updated: changed.length };
  }

  private metadataOf(value: Record<string, unknown> | null): Record<string, unknown> {
    return value ?? {};
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private occurredAtOf(createdAt: Date, value: unknown): Date {
    if (typeof value !== 'string') return createdAt;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? createdAt : parsed;
  }
}
