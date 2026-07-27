import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NotificationDeepLinkResponse,
  NotificationDeliveryResponse,
  NotificationDeliveryStatus,
} from '@aurelia/contracts';
import { createHmac, timingSafeEqual } from 'crypto';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { CreateNotificationDeepLinkDto } from './dto/notification-delivery.dto';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { NotificationEntity } from './entities/notification.entity';

type DeepLinkPayload = {
  notificationId: string;
  userId: string;
  entityType: string | null;
  entityId: string | null;
  route: string;
  exp: number;
};

@Injectable()
export class NotificationDeliveryService implements OnModuleInit, OnModuleDestroy {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveries: Repository<NotificationDeliveryEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    @InjectRepository(NotificationRecipientEntity)
    private readonly recipients: Repository<NotificationRecipientEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.retryTimer = setInterval(() => {
      void this.processDueRetries();
    }, 5 * 60 * 1000);
    this.retryTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  async registerInApp(notificationId: string, recipientUserIds: string[]): Promise<void> {
    await this.getNotificationOrThrow(notificationId);
    const uniqueIds = [...new Set(recipientUserIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;
    const users = await this.users.find({ where: { id: In(uniqueIds) } });
    const emailById = new Map(users.map((user) => [user.id, user.email]));
    const existing = await this.deliveries.find({ where: { notificationId, channel: 'in_app' } });
    const existingDestinations = new Set(existing.map((row) => row.destination));
    const now = new Date();
    const rows = uniqueIds
      .map((userId) => emailById.get(userId) ?? userId)
      .filter((destination) => !existingDestinations.has(destination))
      .map((destination) => this.deliveries.create({
        notificationId,
        channel: 'in_app',
        destination,
        status: NotificationDeliveryStatus.SENT,
        attemptCount: 1,
        maxAttempts: 1,
        lastError: null,
        nextRetryAt: null,
        sentAt: now,
        failedAt: null,
        metadata: null,
      }));
    if (rows.length > 0) await this.deliveries.save(rows);
  }

  async registerEmailAttempt(input: {
    notificationId: string;
    destination: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<NotificationDeliveryResponse> {
    await this.getNotificationOrThrow(input.notificationId);
    const row = await this.deliveries.save(this.deliveries.create({
      notificationId: input.notificationId,
      channel: 'email',
      destination: input.destination,
      status: NotificationDeliveryStatus.PENDING,
      attemptCount: 0,
      maxAttempts: 3,
      lastError: null,
      nextRetryAt: null,
      sentAt: null,
      failedAt: null,
      metadata: input.metadata ?? null,
    }));
    return this.toResponse(row);
  }

  async markSent(id: string, metadata?: Record<string, unknown>): Promise<NotificationDeliveryResponse> {
    const row = await this.getOrThrow(id);
    row.status = NotificationDeliveryStatus.SENT;
    row.attemptCount += 1;
    row.lastError = null;
    row.nextRetryAt = null;
    row.sentAt = new Date();
    row.failedAt = null;
    row.metadata = { ...(row.metadata ?? {}), ...(metadata ?? {}) };
    return this.toResponse(await this.deliveries.save(row));
  }

  async markFailed(
    id: string,
    reason: string,
    bounced = false,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationDeliveryResponse> {
    const row = await this.getOrThrow(id);
    row.attemptCount += 1;
    row.lastError = reason;
    row.failedAt = new Date();
    row.sentAt = null;
    row.metadata = { ...(row.metadata ?? {}), ...(metadata ?? {}) };

    if (bounced) {
      row.status = NotificationDeliveryStatus.BOUNCED;
      row.nextRetryAt = null;
    } else if (row.attemptCount < row.maxAttempts) {
      row.status = NotificationDeliveryStatus.RETRYING;
      row.nextRetryAt = new Date(Date.now() + this.backoffMs(row.attemptCount));
    } else {
      row.status = NotificationDeliveryStatus.FAILED;
      row.nextRetryAt = null;
    }

    return this.toResponse(await this.deliveries.save(row));
  }

  async retry(id: string): Promise<NotificationDeliveryResponse> {
    const row = await this.getOrThrow(id);
    if (row.status === NotificationDeliveryStatus.SENT) {
      throw new BadRequestException('A sent delivery cannot be retried');
    }
    if (row.status === NotificationDeliveryStatus.BOUNCED) {
      throw new BadRequestException('A bounced destination must be corrected before retrying');
    }
    if (row.attemptCount >= row.maxAttempts) {
      throw new BadRequestException('Notification delivery reached its maximum number of attempts');
    }
    row.status = NotificationDeliveryStatus.RETRYING;
    row.nextRetryAt = new Date();
    row.failedAt = null;
    return this.toResponse(await this.deliveries.save(row));
  }

  async list(status?: NotificationDeliveryStatus): Promise<NotificationDeliveryResponse[]> {
    const rows = await this.deliveries.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: 500,
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findByNotification(notificationId: string): Promise<NotificationDeliveryResponse[]> {
    await this.getNotificationOrThrow(notificationId);
    const rows = await this.deliveries.find({
      where: { notificationId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async countFailed(): Promise<number> {
    return this.deliveries.count({
      where: {
        status: In([NotificationDeliveryStatus.FAILED, NotificationDeliveryStatus.BOUNCED]),
      },
    });
  }

  async processDueRetries(now = new Date()): Promise<number> {
    const candidates = await this.deliveries
      .createQueryBuilder('delivery')
      .where('delivery.status IN (:...statuses)', {
        statuses: [NotificationDeliveryStatus.FAILED, NotificationDeliveryStatus.RETRYING],
      })
      .andWhere('delivery.next_retry_at IS NOT NULL')
      .andWhere('delivery.next_retry_at <= :now', { now })
      .andWhere('delivery.attempt_count < delivery.max_attempts')
      .getMany();
    for (const row of candidates) {
      row.status = NotificationDeliveryStatus.RETRYING;
      row.nextRetryAt = new Date(now.getTime() + this.backoffMs(Math.max(1, row.attemptCount)));
    }
    if (candidates.length > 0) await this.deliveries.save(candidates);
    return candidates.length;
  }

  async createDeepLink(
    notificationId: string,
    userId: string,
    dto: CreateNotificationDeepLinkDto,
  ): Promise<NotificationDeepLinkResponse> {
    const recipient = await this.recipients.findOne({
      where: { notificationId, userId },
      relations: { notification: true },
    });
    if (!recipient) throw new NotFoundException('Notification not found for user');

    const expiresInMinutes = dto.expiresInMinutes ?? this.defaultDeepLinkMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);
    const payload: DeepLinkPayload = {
      notificationId,
      userId,
      entityType: recipient.notification.entityType,
      entityId: recipient.notification.entityId,
      route: this.resolveRoute(recipient.notification),
      exp: expiresAt.getTime(),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const token = `${encodedPayload}.${this.sign(encodedPayload)}`;

    return {
      token,
      status: 'valid',
      requiresLogin: true,
      entityType: payload.entityType,
      entityId: payload.entityId,
      route: payload.route,
      expiresAt: expiresAt.toISOString(),
    };
  }

  resolveDeepLink(token: string): NotificationDeepLinkResponse {
    const invalid: NotificationDeepLinkResponse = {
      token: null,
      status: 'invalid',
      requiresLogin: true,
      entityType: null,
      entityId: null,
      route: '/login',
      expiresAt: null,
    };
    const [encodedPayload, signature, ...extra] = token.split('.');
    if (!encodedPayload || !signature || extra.length > 0 || !this.isValidSignature(encodedPayload, signature)) {
      return invalid;
    }

    let payload: DeepLinkPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as DeepLinkPayload;
    } catch {
      return invalid;
    }
    if (!payload.notificationId || !payload.userId || !payload.route || !Number.isFinite(payload.exp)) {
      return invalid;
    }

    const expiresAt = new Date(payload.exp);
    if (payload.exp <= Date.now()) {
      return {
        token: null,
        status: 'expired',
        requiresLogin: true,
        entityType: payload.entityType,
        entityId: payload.entityId,
        route: `/login?redirect=${encodeURIComponent(payload.route)}`,
        expiresAt: expiresAt.toISOString(),
      };
    }

    return {
      token,
      status: 'valid',
      requiresLogin: true,
      entityType: payload.entityType,
      entityId: payload.entityId,
      route: payload.route,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async getOrThrow(id: string): Promise<NotificationDeliveryEntity> {
    const row = await this.deliveries.findOneBy({ id });
    if (!row) throw new NotFoundException(`Notification delivery ${id} not found`);
    return row;
  }

  private async getNotificationOrThrow(id: string): Promise<NotificationEntity> {
    const row = await this.notifications.findOneBy({ id });
    if (!row) throw new NotFoundException(`Notification ${id} not found`);
    return row;
  }

  private backoffMs(attempt: number): number {
    return Math.min(24 * 60 * 60 * 1000, 15 * 60 * 1000 * 2 ** Math.max(0, attempt - 1));
  }

  private resolveRoute(notification: NotificationEntity): string {
    const inspectionId = this.metadataString(notification.metadata, 'inspectionId');
    if (notification.entityType === 'inspection' && notification.entityId) {
      return `/inspections?notification=1&inspectionId=${encodeURIComponent(notification.entityId)}`;
    }
    if (notification.entityType === 'inspection_finding' && notification.entityId) {
      const inspectionParam = inspectionId ? `&inspectionId=${encodeURIComponent(inspectionId)}` : '';
      return `/inspections?notification=1&findingId=${encodeURIComponent(notification.entityId)}${inspectionParam}`;
    }
    return '/notifications';
  }

  private metadataString(metadata: Record<string, unknown> | null, key: string): string | null {
    const value = metadata?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private defaultDeepLinkMinutes(): number {
    const configured = Number(this.config.get<string>('NOTIFICATION_DEEP_LINK_MINUTES'));
    if (!Number.isInteger(configured) || configured < 5 || configured > 10080) return 1440;
    return configured;
  }

  private deepLinkSecret(): string {
    const configured = this.config.get<string>('NOTIFICATION_DEEP_LINK_SECRET')?.trim();
    const fallback = this.config.get<string>('JWT_SECRET')?.trim();
    const secret = configured || fallback;
    if (!secret) throw new Error('NOTIFICATION_DEEP_LINK_SECRET or JWT_SECRET is required');
    return secret;
  }

  private sign(value: string): string {
    return createHmac('sha256', this.deepLinkSecret()).update(value).digest('base64url');
  }

  private isValidSignature(value: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(value), 'utf8');
    const received = Buffer.from(signature, 'utf8');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  private toResponse(row: NotificationDeliveryEntity): NotificationDeliveryResponse {
    return {
      id: row.id,
      notificationId: row.notificationId,
      channel: row.channel,
      destination: row.destination,
      status: row.status,
      attemptCount: row.attemptCount,
      maxAttempts: row.maxAttempts,
      lastError: row.lastError,
      nextRetryAt: row.nextRetryAt?.toISOString() ?? null,
      sentAt: row.sentAt?.toISOString() ?? null,
      failedAt: row.failedAt?.toISOString() ?? null,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
