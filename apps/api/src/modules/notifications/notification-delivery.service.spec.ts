import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { NotificationDeliveryStatus } from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import type { UserEntity } from '../users/entities/user.entity';
import type { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import type { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import type { NotificationEntity } from './entities/notification.entity';
import { NotificationDeliveryService } from './notification-delivery.service';

function repositoryMock<T extends object>() {
  return {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (value: T) => value),
    create: jest.fn((value: Partial<T>) => value as T),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

function buildService() {
  const deliveries = repositoryMock<NotificationDeliveryEntity>();
  const notifications = repositoryMock<NotificationEntity>();
  const recipients = repositoryMock<NotificationRecipientEntity>();
  const users = repositoryMock<UserEntity>();
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'NOTIFICATION_DEEP_LINK_SECRET') return 'test-secret';
      if (key === 'NOTIFICATION_DEEP_LINK_MINUTES') return '60';
      return undefined;
    }),
  } as unknown as ConfigService;
  return {
    service: new NotificationDeliveryService(deliveries, notifications, recipients, users, config),
    deliveries,
    notifications,
    recipients,
  };
}

describe('NotificationDeliveryService', () => {
  it('crea y resuelve un deep link firmado para su destinatario', async () => {
    const { service, recipients } = buildService();
    recipients.findOne.mockResolvedValue({
      notificationId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      notification: {
        entityType: 'inspection_finding',
        entityId: '33333333-3333-4333-8333-333333333333',
        metadata: { inspectionId: '44444444-4444-4444-8444-444444444444' },
      },
    } as NotificationRecipientEntity);

    const link = await service.createDeepLink(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      { expiresInMinutes: 60 },
    );
    const resolved = service.resolveDeepLink(link.token ?? '');

    expect(resolved.status).toBe('valid');
    expect(resolved.requiresLogin).toBe(true);
    expect(resolved.route).toContain('findingId=33333333-3333-4333-8333-333333333333');
    expect(resolved.route).toContain('inspectionId=44444444-4444-4444-8444-444444444444');
  });

  it('rechaza un deep link manipulado', async () => {
    const { service, recipients } = buildService();
    recipients.findOne.mockResolvedValue({
      notificationId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      notification: {
        entityType: 'inspection',
        entityId: '44444444-4444-4444-8444-444444444444',
        metadata: null,
      },
    } as NotificationRecipientEntity);

    const link = await service.createDeepLink(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      { expiresInMinutes: 60 },
    );
    const token = link.token ?? '';
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;

    expect(service.resolveDeepLink(tampered).status).toBe('invalid');
  });

  it('programa retry con backoff mientras queden intentos', async () => {
    const { service, deliveries } = buildService();
    const row = {
      id: '55555555-5555-4555-8555-555555555555',
      notificationId: '11111111-1111-4111-8111-111111111111',
      channel: 'email',
      destination: 'responsable@example.com',
      status: NotificationDeliveryStatus.PENDING,
      attemptCount: 0,
      maxAttempts: 3,
      lastError: null,
      nextRetryAt: null,
      sentAt: null,
      failedAt: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NotificationDeliveryEntity;
    deliveries.findOneBy.mockResolvedValue(row);
    deliveries.save.mockImplementation(async (value) => value);

    const response = await service.markFailed(row.id, 'SMTP unavailable');

    expect(response.status).toBe(NotificationDeliveryStatus.RETRYING);
    expect(response.attemptCount).toBe(1);
    expect(response.nextRetryAt).not.toBeNull();
  });

  it('no reintenta destinos rebotados', async () => {
    const { service, deliveries } = buildService();
    deliveries.findOneBy.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      notificationId: '11111111-1111-4111-8111-111111111111',
      channel: 'email',
      destination: 'invalid@example.com',
      status: NotificationDeliveryStatus.BOUNCED,
      attemptCount: 1,
      maxAttempts: 3,
      lastError: 'Mailbox not found',
      nextRetryAt: null,
      sentAt: null,
      failedAt: new Date(),
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NotificationDeliveryEntity);

    await expect(service.retry('55555555-5555-4555-8555-555555555555'))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
