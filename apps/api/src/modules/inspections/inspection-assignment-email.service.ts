import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionFindingStatus,
  InspectionStatus,
  NotificationDeliveryStatus,
} from '@aurelia/contracts';
import { In, Repository } from 'typeorm';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationDeliveryService } from '../notifications/notification-delivery.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanyEntity } from '../organization/entities/company.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionFindingResponsibleEntity } from './entities/inspection-finding-responsible.entity';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionEntity } from './entities/inspection.entity';

type TrackedAssignmentLink = {
  platformUrl: string;
  deliveryId: string | null;
  skipEmail: boolean;
};

@Injectable()
export class InspectionAssignmentEmailService {
  private readonly logger = new Logger(InspectionAssignmentEmailService.name);

  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFindingResponsibleEntity)
    private readonly findingResponsibles: Repository<InspectionFindingResponsibleEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    private readonly messaging: MessagingService,
    private readonly notifications: NotificationsService,
    private readonly notificationDeliveries: NotificationDeliveryService,
    private readonly config: ConfigService,
  ) {}

  async notifyInspectionAssigned(inspectionId: string, recipientUserIds?: string[]): Promise<void> {
    const inspection = await this.inspections.findOneBy({ id: inspectionId });
    if (!inspection || !this.isNotifiableStatus(inspection.status)) return;

    const activeFindings = (await this.findings.find({ where: { inspectionId } })).filter(
      (finding) =>
        finding.status !== InspectionFindingStatus.CLOSED
        && finding.status !== InspectionFindingStatus.CANCELLED,
    );
    if (activeFindings.length === 0) return;

    const findingIds = activeFindings.map((finding) => finding.id);
    const responsibleRows = findingIds.length
      ? await this.findingResponsibles.find({ where: { findingId: In(findingIds) } })
      : [];
    const findingById = new Map(activeFindings.map((finding) => [finding.id, finding]));
    const findingIdsByUser = new Map<string, Set<string>>();

    responsibleRows.forEach((row) => this.addAssignment(findingIdsByUser, row.userId, row.findingId));
    activeFindings.forEach((finding) => {
      if (finding.ownerUserId) this.addAssignment(findingIdsByUser, finding.ownerUserId, finding.id);
    });

    const requestedRecipients = recipientUserIds?.length
      ? new Set(recipientUserIds.filter(Boolean))
      : null;
    const userIds = Array.from(findingIdsByUser.keys()).filter(
      (userId) => !requestedRecipients || requestedRecipients.has(userId),
    );
    if (userIds.length === 0) return;

    const users = await this.users.find({ where: { id: In(userIds), isActive: true } });
    const companyIds = new Set<string>();
    users.forEach((user) => {
      if (user.companyId) companyIds.add(user.companyId);
      const assignedFindingIds = findingIdsByUser.get(user.id) ?? new Set<string>();
      assignedFindingIds.forEach((findingId) => {
        const companyId = findingById.get(findingId)?.responsibleCompanyId;
        if (companyId) companyIds.add(companyId);
      });
    });
    if (inspection.companyId) companyIds.add(inspection.companyId);

    const companies = companyIds.size
      ? await this.companies.find({ where: { id: In(Array.from(companyIds)) } })
      : [];
    const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
    const inspectionReference = this.resolveInspectionReference(inspection);

    for (const user of users) {
      const assignedFindingIds = findingIdsByUser.get(user.id) ?? new Set<string>();
      if (assignedFindingIds.size === 0) continue;
      const responsibleCompanyId = Array.from(assignedFindingIds)
        .map((findingId) => findingById.get(findingId)?.responsibleCompanyId ?? null)
        .find((companyId): companyId is string => Boolean(companyId));
      const companyId = user.companyId ?? responsibleCompanyId ?? inspection.companyId;
      const companyName = companyId
        ? companyNameById.get(companyId) ?? 'Empresa asignada'
        : 'Empresa asignada';
      const trackedLink = await this.createTrackedAssignmentLink({
        inspection,
        inspectionReference,
        user,
        findingIds: Array.from(assignedFindingIds),
      });
      if (trackedLink.skipEmail) {
        this.logger.log(`Inspection assignment email skipped as duplicate inspection=${inspection.id} user=${user.id}`);
        continue;
      }

      try {
        const delivery = await this.messaging.sendInspectionFindingAssigned({
          to: [{ email: user.email, name: this.userFullName(user) }],
          params: {
            recipientName: this.userFullName(user),
            companyName,
            inspectionNumber: inspectionReference,
            observationCount: assignedFindingIds.size,
            platformUrl: trackedLink.platformUrl,
          },
        });
        if (trackedLink.deliveryId) {
          await this.notificationDeliveries.markSent(trackedLink.deliveryId, {
            messageId: delivery.messageId ?? null,
            inspectionId: inspection.id,
            recipientUserId: user.id,
          }).catch((error) => this.logDeliveryTrackingFailure(trackedLink.deliveryId, error));
        }
        this.logger.log(
          `Inspection assignment email sent inspection=${inspection.id} user=${user.id} messageId=${delivery.messageId ?? 'n/a'}`,
        );
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        if (trackedLink.deliveryId) {
          await this.notificationDeliveries.markFailed(trackedLink.deliveryId, detail, false, {
            inspectionId: inspection.id,
            recipientUserId: user.id,
          }).catch((trackingError) => this.logDeliveryTrackingFailure(trackedLink.deliveryId, trackingError));
        }
        this.logger.error(
          `Inspection assignment email failed inspection=${inspection.id} user=${user.id}: ${detail}`,
        );
      }
    }
  }

  private async createTrackedAssignmentLink(input: {
    inspection: InspectionEntity;
    inspectionReference: string;
    user: UserEntity;
    findingIds: string[];
  }): Promise<TrackedAssignmentLink> {
    const fallbackUrl = this.buildInspectionUrl(input.inspection.id, input.inspectionReference);
    const eventKey = `inspection.assigned:${input.inspection.id}:${input.user.id}`;
    try {
      const existingNotifications = await this.notifications.findForUser(input.user.id);
      const existing = existingNotifications.find((notification) => notification.metadata?.eventKey === eventKey);
      const notification = existing ?? await this.notifications.create({
        title: `Inspección asignada · ${input.inspectionReference}`,
        body: `Tienes ${input.findingIds.length} observación${input.findingIds.length === 1 ? '' : 'es'} pendiente${input.findingIds.length === 1 ? '' : 's'} de gestión.`,
        category: 'inspection.assigned',
        entityType: 'inspection',
        entityId: input.inspection.id,
        triggeredByUserId: input.inspection.inspectorId ?? undefined,
        recipientUserIds: [input.user.id],
        metadata: {
          event: 'inspection.assigned',
          eventKey,
          inspectionId: input.inspection.id,
          inspectionNumber: input.inspectionReference,
          findingIds: input.findingIds,
          group: 'open',
          occurredAt: new Date().toISOString(),
        },
      });
      const existingDeliveries = await this.notificationDeliveries.findByNotification(notification.id);
      const duplicateDelivery = existingDeliveries.find((delivery) =>
        delivery.channel === 'email'
        && delivery.destination?.toLowerCase() === input.user.email.toLowerCase()
        && delivery.status !== NotificationDeliveryStatus.FAILED
        && delivery.status !== NotificationDeliveryStatus.BOUNCED,
      );
      if (duplicateDelivery) {
        return {
          platformUrl: fallbackUrl,
          deliveryId: duplicateDelivery.id,
          skipEmail: true,
        };
      }

      const deepLink = await this.notificationDeliveries.createDeepLink(notification.id, input.user.id, {});
      if (!deepLink.token) throw new Error('Notification deep link token was not generated');
      const delivery = await this.notificationDeliveries.registerEmailAttempt({
        notificationId: notification.id,
        destination: input.user.email,
        metadata: {
          inspectionId: input.inspection.id,
          recipientUserId: input.user.id,
          findingIds: input.findingIds,
        },
      });
      return {
        platformUrl: this.buildNotificationDeepLinkUrl(deepLink.token),
        deliveryId: delivery.id,
        skipEmail: false,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Unable to create tracked assignment link inspection=${input.inspection.id} user=${input.user.id}: ${detail}`,
      );
      return { platformUrl: fallbackUrl, deliveryId: null, skipEmail: false };
    }
  }

  private addAssignment(assignments: Map<string, Set<string>>, userId: string, findingId: string): void {
    const current = assignments.get(userId) ?? new Set<string>();
    current.add(findingId);
    assignments.set(userId, current);
  }

  private isNotifiableStatus(status: InspectionStatus): boolean {
    return status !== InspectionStatus.DRAFT
      && status !== InspectionStatus.CLOSED
      && status !== InspectionStatus.CANCELLED;
  }

  private resolveInspectionReference(inspection: InspectionEntity): string {
    const explicit = inspection.title.match(/\bINS-\d{4}-[A-Z0-9-]+\b/i)?.[0];
    if (explicit) return explicit.toUpperCase();
    const year = (inspection.scheduledAt ?? inspection.createdAt).getFullYear();
    const explicitNumber = inspection.title.match(/#(\d+)/)?.[1];
    const fallbackNumber = inspection.id.slice(0, 8).toUpperCase();
    return `INS-${year}-${explicitNumber ?? fallbackNumber}`;
  }

  private buildInspectionUrl(inspectionId: string, inspectionNumber: string): string {
    const baseUrl = this.resolveWebAppUrl();
    const url = new URL('/inspections', `${baseUrl}/`);
    url.searchParams.set('notification', '1');
    url.searchParams.set('inspectionId', inspectionId);
    url.searchParams.set('inspectionNumber', inspectionNumber);
    url.searchParams.set('group', 'open');
    return url.toString();
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

  private logDeliveryTrackingFailure(deliveryId: string | null, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Unable to update notification delivery=${deliveryId ?? 'n/a'}: ${detail}`);
  }

  private userFullName(user: UserEntity): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }
}
