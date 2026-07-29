import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionFindingStatus,
  NotificationDeliveryStatus,
  Role,
} from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { InspectionRejectionEmailTemplateService } from '../messaging/inspection-rejection-email-template.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationDeliveryService } from '../notifications/notification-delivery.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionFindingResponsibleEntity } from './entities/inspection-finding-responsible.entity';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionEntity } from './entities/inspection.entity';

type RejectionRecipient = {
  id: string;
  email: string;
  name: string;
};

@Injectable()
export class InspectionRejectionEmailService {
  private readonly logger = new Logger(InspectionRejectionEmailService.name);

  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFindingResponsibleEntity)
    private readonly findingResponsibles: Repository<InspectionFindingResponsibleEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly templates: InspectionRejectionEmailTemplateService,
    private readonly messaging: MessagingService,
    private readonly notifications: NotificationsService,
    private readonly notificationDeliveries: NotificationDeliveryService,
    private readonly config: ConfigService,
  ) {}

  async notifyFindingRejected(findingId: string, rejectedByUserId: string | null): Promise<void> {
    const finding = await this.findings.findOneBy({ id: findingId });
    if (!finding) throw new NotFoundException(`Inspection finding ${findingId} not found`);
    if (finding.status !== InspectionFindingStatus.REJECTED) return;

    const rejectionReason = finding.rejectionReason?.trim();
    if (!rejectionReason) {
      this.logger.warn(`Rejected finding has no rejection reason finding=${finding.id}`);
      return;
    }

    const inspection = await this.inspections.findOne({
      where: { id: finding.inspectionId },
      relations: { area: true, sector: true },
    });
    if (!inspection) throw new NotFoundException(`Inspection ${finding.inspectionId} not found`);

    const recipients = await this.resolveRecipients(finding, inspection);
    if (recipients.length === 0) {
      this.logger.warn(`Rejected finding has no active email recipient finding=${finding.id}`);
      return;
    }

    const reviewer = rejectedByUserId
      ? await this.users.findOneBy({ id: rejectedByUserId })
      : null;
    const rejectedByName = reviewer ? this.userFullName(reviewer) : 'Admin GF HSE';
    const rejectedByProfile = reviewer?.position?.trim() || 'Admin GF HSE';
    const inspectionNumber = this.resolveInspectionReference(inspection);
    const observationNumber = await this.resolveObservationNumber(finding);
    const rejectedAt = finding.rejectedAt ?? finding.updatedAt ?? new Date();
    const eventKey = `inspection.finding-rejected:${finding.id}:${rejectedAt.toISOString()}`;

    const duplicate = await this.findDuplicateNotification(recipients, eventKey);
    if (duplicate) {
      this.logger.log(`Rejected finding email skipped as duplicate finding=${finding.id}`);
      return;
    }

    const notification = await this.notifications.create({
      title: `Observación rechazada · Inspección #${inspectionNumber}`,
      body: `La observación ${observationNumber} fue rechazada y requiere corrección.`,
      category: 'inspection.finding-rejected',
      entityType: 'inspection_finding',
      entityId: finding.id,
      triggeredByUserId: rejectedByUserId ?? undefined,
      recipientUserIds: recipients.map((recipient) => recipient.id),
      metadata: {
        event: 'inspection.finding-rejected',
        eventKey,
        inspectionId: inspection.id,
        inspectionNumber,
        findingId: finding.id,
        observationNumber,
        group: 'rejected',
        occurredAt: rejectedAt.toISOString(),
      },
    });

    await Promise.all(recipients.map(async (recipient) => {
      try {
        await this.deliverToRecipient({
          notificationId: notification.id,
          recipient,
          finding,
          inspection,
          inspectionNumber,
          observationNumber,
          rejectionReason,
          rejectedByName,
          rejectedByProfile,
          eventKey,
        });
      } catch (error) {
        const detail = this.safeErrorDetail(error);
        this.logger.error(
          `Unable to prepare rejected finding email finding=${finding.id} recipientUser=${recipient.id}: ${detail}`,
        );
      }
    }));
  }

  private async deliverToRecipient(input: {
    notificationId: string;
    recipient: RejectionRecipient;
    finding: InspectionFindingEntity;
    inspection: InspectionEntity;
    inspectionNumber: string;
    observationNumber: string;
    rejectionReason: string;
    rejectedByName: string;
    rejectedByProfile: string;
    eventKey: string;
  }): Promise<void> {
    const deepLink = await this.notificationDeliveries.createDeepLink(
      input.notificationId,
      input.recipient.id,
      {},
    );
    if (!deepLink.token) throw new Error('Notification deep link token was not generated');

    const delivery = await this.notificationDeliveries.registerEmailAttempt({
      notificationId: input.notificationId,
      destination: input.recipient.email,
      metadata: {
        eventKey: input.eventKey,
        template: 'inspection.finding-rejected',
        inspectionId: input.inspection.id,
        findingId: input.finding.id,
        recipientUserId: input.recipient.id,
      },
    });

    const rendered = this.templates.render({
      recipientName: input.recipient.name,
      recipientEmail: input.recipient.email,
      inspectionNumber: input.inspectionNumber,
      observationNumber: input.observationNumber,
      rejectionReason: input.rejectionReason,
      rejectedByName: input.rejectedByName,
      rejectedByProfile: input.rejectedByProfile,
      areaName: input.inspection.area?.name ?? null,
      sectorName: input.inspection.sector?.name ?? null,
      inspectionMode: input.finding.checklistItemId ? 'Checklist' : 'Hallazgo',
      actionUrl: this.buildNotificationDeepLinkUrl(deepLink.token),
    });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const result = await this.messaging.send({
          ...rendered,
          to: [{ email: input.recipient.email, name: input.recipient.name }],
        });
        await this.notificationDeliveries.markSent(delivery.id, {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
          attempt,
        });
        this.logger.log(
          `Rejected finding email sent finding=${input.finding.id} recipientUser=${input.recipient.id} delivery=${delivery.id}`,
        );
        return;
      } catch (error) {
        const detail = this.safeErrorDetail(error);
        const state = await this.notificationDeliveries.markFailed(delivery.id, detail, false, {
          attempt,
          inspectionId: input.inspection.id,
          findingId: input.finding.id,
          recipientUserId: input.recipient.id,
        }).catch((trackingError) => {
          const trackingDetail = this.safeErrorDetail(trackingError);
          this.logger.warn(`Unable to update rejected email delivery=${delivery.id}: ${trackingDetail}`);
          return null;
        });

        if (attempt >= 3 || state?.status === NotificationDeliveryStatus.FAILED) {
          this.logger.error(
            `Rejected finding email failed finding=${input.finding.id} recipientUser=${input.recipient.id} delivery=${delivery.id}: ${detail}`,
          );
          return;
        }
        await this.delay(500 * 2 ** (attempt - 1));
      }
    }
  }

  private async resolveRecipients(
    finding: InspectionFindingEntity,
    inspection: InspectionEntity,
  ): Promise<RejectionRecipient[]> {
    const byUserId = new Map<string, UserEntity>();
    const responsibleRows = await this.findingResponsibles.find({
      where: { findingId: finding.id },
      relations: { user: true },
    });
    responsibleRows.forEach((row) => {
      if (row.user?.isActive) byUserId.set(row.user.id, row.user);
    });

    if (finding.ownerUserId && !byUserId.has(finding.ownerUserId)) {
      const owner = await this.users.findOneBy({ id: finding.ownerUserId, isActive: true });
      if (owner) byUserId.set(owner.id, owner);
    }

    if (byUserId.size === 0 && inspection.areaId) {
      const areaUsers = await this.users.find({
        where: { areaId: inspection.areaId, isActive: true },
        relations: { userRoles: { role: true } },
      });
      areaUsers
        .filter((user) => user.position?.toLowerCase().includes('supervisor')
          || user.userRoles?.some((userRole) => userRole.role?.code === Role.SUPERVISOR))
        .forEach((user) => byUserId.set(user.id, user));
    }

    const byEmail = new Map<string, RejectionRecipient>();
    byUserId.forEach((user) => {
      const email = user.email?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      const key = email.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { id: user.id, email, name: this.userFullName(user) });
      }
    });
    return Array.from(byEmail.values());
  }

  private async findDuplicateNotification(
    recipients: RejectionRecipient[],
    eventKey: string,
  ): Promise<boolean> {
    for (const recipient of recipients) {
      const existing = await this.notifications.findForUser(recipient.id);
      if (existing.some((notification) => notification.metadata?.eventKey === eventKey)) return true;
    }
    return false;
  }

  private async resolveObservationNumber(finding: InspectionFindingEntity): Promise<string> {
    const rows = await this.findings.find({
      where: { inspectionId: finding.inspectionId },
      order: { createdAt: 'ASC' },
    });
    const index = rows.findIndex((row) => row.id === finding.id);
    return index >= 0 ? String(index + 1) : finding.id.slice(0, 8).toUpperCase();
  }

  private resolveInspectionReference(inspection: InspectionEntity): string {
    const explicit = inspection.title.match(/\bINS-\d{4}-[A-Z0-9-]+\b/i)?.[0];
    if (explicit) return explicit.toUpperCase();
    const year = (inspection.scheduledAt ?? inspection.createdAt).getFullYear();
    const explicitNumber = inspection.title.match(/#(\d+)/)?.[1];
    const fallbackNumber = inspection.id.slice(0, 8).toUpperCase();
    return explicitNumber ?? `${year}-${fallbackNumber}`;
  }

  private buildNotificationDeepLinkUrl(token: string): string {
    const baseUrl = this.resolveWebAppUrl();
    const url = new URL(`/notifications/open/${encodeURIComponent(token)}`, `${baseUrl}/`);
    return url.toString();
  }

  private resolveWebAppUrl(): string {
    const configured = this.config.get<string>('WEB_APP_URL')?.trim();
    if (configured) return this.normalizeWebUrl(configured, 'WEB_APP_URL');

    const origins = (this.config.get<string>('CORS_ORIGINS') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const fallback = origins.find((origin) => origin.includes(':5173')) ?? origins[0];
    if (!fallback) throw new Error('WEB_APP_URL or CORS_ORIGINS is required to build email links');
    return this.normalizeWebUrl(fallback, 'CORS_ORIGINS');
  }

  private normalizeWebUrl(value: string, source: string): string {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${source} must contain a valid URL`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`${source} must use http or https`);
    }
    return parsed.toString().replace(/\/$/, '');
  }

  private userFullName(user: UserEntity): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  private safeErrorDetail(error: unknown): string {
    const smtp = this.config.get<{ user?: string | null; pass?: string | null }>('smtp');
    const secrets = [
      smtp?.user,
      smtp?.pass,
      this.config.get<string>('SMTP_USER'),
      this.config.get<string>('SMTP_PASS'),
    ].filter((value): value is string => Boolean(value));
    let detail = error instanceof Error ? error.message : String(error);
    for (const secret of secrets) detail = detail.split(secret).join('[REDACTED]');
    detail = detail
      .replace(/(AUTH(?:\s+PLAIN|\s+LOGIN)?\s+)[^\s]+/gi, '$1[REDACTED]')
      .replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, '[REDACTED]')
      .trim();
    return (detail || 'Email delivery failed').slice(0, 1000);
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
