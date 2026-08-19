import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionNotificationEvent,
  InspectionNotificationMetadata,
  InspectionNotificationTone,
  InspectionStatus,
  MarkAllNotificationsReadResponse,
  NotificationRecipientResponse,
  NotificationResponse,
} from '@aurelia/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionFindingResponsibleEntity } from '../inspections/entities/inspection-finding-responsible.entity';
import { InspectionFindingEntity } from '../inspections/entities/inspection-finding.entity';
import { InspectionFormTemplateEntity } from '../inspections/entities/inspection-form-template.entity';
import { InspectionTypeEntity } from '../inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { NotificationEntity } from './entities/notification.entity';

type InspectionSeedInput = {
  title: string;
  body: string | null;
  category: InspectionNotificationEvent;
  entityType: string;
  entityId: string;
  triggeredByUserId: string | null;
  recipientUserIds: string[];
  metadata: InspectionNotificationMetadata & Record<string, unknown>;
};

type NameMaps = {
  areas: Map<string, string>;
  companies: Map<string, string>;
  sectors: Map<string, string>;
  users: Map<string, UserEntity>;
  types: Map<string, InspectionTypeEntity>;
  templates: Map<string, InspectionFormTemplateEntity>;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationRecipientEntity)
    private readonly recipientsRepository: Repository<NotificationRecipientEntity>,
    @InjectRepository(InspectionEntity)
    private readonly inspectionsRepository: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findingsRepository: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFindingResponsibleEntity)
    private readonly findingResponsiblesRepository: Repository<InspectionFindingResponsibleEntity>,
    @InjectRepository(InspectionTypeEntity)
    private readonly inspectionTypesRepository: Repository<InspectionTypeEntity>,
    @InjectRepository(InspectionFormTemplateEntity)
    private readonly templatesRepository: Repository<InspectionFormTemplateEntity>,
    @InjectRepository(AreaEntity)
    private readonly areasRepository: Repository<AreaEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectorsRepository: Repository<SectorEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationResponse> {
    const notification = await this.notificationsRepository.save(
      this.notificationsRepository.create({
        title: dto.title,
        body: dto.body ?? null,
        category: dto.category ?? 'general',
        entityType: dto.entityType ?? null,
        entityId: dto.entityId ?? null,
        triggeredByUserId: dto.triggeredByUserId ?? null,
        metadata: dto.metadata ?? null,
      }),
    );

    const recipientUserIds = this.uniqueIds(dto.recipientUserIds);
    await this.insertRecipientsIgnoringDuplicates(notification.id, recipientUserIds);

    return this.findByIdForUser(notification.id, recipientUserIds[0] ?? null, true);
  }

  async findForUser(userId: string, unreadOnly = false): Promise<NotificationResponse[]> {
    await this.ensureInspectionNotificationsForUser(userId).catch(() => undefined);
    const rows = await this.recipientsRepository.find({
      where: { userId },
      relations: { notification: { recipients: true } },
    });

    const visibleRows = this.mergeRecipientRows(rows)
      .filter((row) => !unreadOnly || row.readAt === null)
      .sort((left, right) => this.sortDateOf(right.notification).getTime() - this.sortDateOf(left.notification).getTime());

    return visibleRows.map((row) => this.toResponse(row.notification, row));
  }

  async markRead(notificationId: string, userId: string): Promise<NotificationResponse> {
    const recipient = await this.recipientsRepository.findOne({
      where: { notificationId, userId },
      relations: { notification: { recipients: true } },
    });
    if (!recipient) throw new NotFoundException('Notification not found for user');

    const now = new Date();
    await this.recipientsRepository.query(
      'UPDATE notification_recipients SET read_at = COALESCE(read_at, $3), updated_at = now() WHERE notification_id = $1 AND user_id = $2',
      [notificationId, userId, now],
    );
    recipient.readAt = recipient.readAt ?? now;

    return this.toResponse(recipient.notification, recipient);
  }

  async dismissInspectionThread(notificationId: string, userId: string): Promise<MarkAllNotificationsReadResponse> {
    const recipient = await this.recipientsRepository.findOne({
      where: { notificationId, userId },
      relations: { notification: true },
    });
    if (!recipient) throw new NotFoundException('Notification not found for user');

    const metadata = this.inspectionMetadataOf(recipient.notification.metadata);
    if (metadata.event !== 'inspection.closed' || !metadata.inspectionId) return { updated: 0 };

    const cutoff = this.occurredAtOf(recipient.notification);
    const rows = await this.recipientsRepository.find({
      where: { userId },
      relations: { notification: true },
    });
    const now = new Date();
    const threadRows = rows.filter((row) => {
      if (row.dismissedAt) return false;
      const rowMetadata = this.inspectionMetadataOf(row.notification.metadata);
      if (rowMetadata.inspectionId !== metadata.inspectionId) return false;
      return this.occurredAtOf(row.notification).getTime() <= cutoff.getTime();
    });

    threadRows.forEach((row) => {
      row.readAt = row.readAt ?? now;
      row.dismissedAt = now;
    });
    if (threadRows.length > 0) await this.recipientsRepository.save(threadRows);
    return { updated: threadRows.length };
  }

  async markAllRead(userId: string): Promise<MarkAllNotificationsReadResponse> {
    const rows = await this.recipientsRepository.find({ where: { userId } });
    const unread = rows.filter((row) => row.readAt === null && row.dismissedAt === null);
    const now = new Date();
    for (const row of unread) row.readAt = now;
    if (unread.length > 0) await this.recipientsRepository.save(unread);
    return { updated: unread.length };
  }

  async notifyWorkflowStarted(input: {
    workflowInstanceId: string;
    entityType: string;
    entityId: string;
    startedByUserId: string | null;
  }): Promise<void> {
    if (!input.startedByUserId) return;
    await this.create({
      title: 'Workflow iniciado',
      body: `Se inició un workflow para ${input.entityType}.`,
      category: 'workflow',
      entityType: input.entityType,
      entityId: input.entityId,
      triggeredByUserId: input.startedByUserId,
      recipientUserIds: [input.startedByUserId],
      metadata: { workflowInstanceId: input.workflowInstanceId, event: 'workflow.started' },
    });
  }

  async notifyWorkflowAdvanced(input: {
    workflowInstanceId: string;
    entityType: string;
    entityId: string;
    action: string;
    completedByUserId: string | null;
    recipientUserIds: string[];
  }): Promise<void> {
    const recipientUserIds = [...new Set(input.recipientUserIds.filter(Boolean))];
    if (recipientUserIds.length === 0) return;
    await this.create({
      title: 'Workflow actualizado',
      body: `Se registró la acción ${input.action} en un workflow de ${input.entityType}.`,
      category: 'workflow',
      entityType: input.entityType,
      entityId: input.entityId,
      triggeredByUserId: input.completedByUserId ?? undefined,
      recipientUserIds,
      metadata: { workflowInstanceId: input.workflowInstanceId, action: input.action, event: 'workflow.advanced' },
    });
  }

  private async ensureInspectionNotificationsForUser(userId: string): Promise<void> {
    const [inspections, findings, responsibles, maps, existingNotifications] = await Promise.all([
      this.inspectionsRepository.find({ order: { updatedAt: 'DESC' }, take: 80 }),
      this.findingsRepository.find({ order: { updatedAt: 'DESC' }, take: 160 }),
      this.findingResponsiblesRepository.find(),
      this.loadNameMaps(),
      this.notificationsRepository.find({ relations: { recipients: true } }),
    ]);
    const existingByKey = new Map<string, NotificationEntity>();
    existingNotifications.forEach((notification) => {
      const key = this.eventKeyOf(notification.metadata);
      if (key) existingByKey.set(key, notification);
    });
    const inspectionsById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const responsiblesByFinding = this.groupResponsiblesByFinding(responsibles);
    const findingsByInspection = this.groupFindingsByInspection(findings);
    await this.seedAssignedNotifications(userId, inspectionsById, findings, responsiblesByFinding, maps, existingByKey);
    for (const finding of findings) {
      const inspection = inspectionsById.get(finding.inspectionId);
      if (!inspection) continue;
      const responsibleIds = responsiblesByFinding.get(finding.id) ?? [];
      await this.seedFindingLifecycleNotifications(userId, inspection, finding, responsibleIds, maps, existingByKey);
    }
    for (const inspection of inspections) {
      await this.seedInspectionClosedNotification(userId, inspection, findingsByInspection.get(inspection.id) ?? [], responsiblesByFinding, maps, existingByKey);
    }
  }

  private async seedAssignedNotifications(
    userId: string,
    inspectionsById: Map<string, InspectionEntity>,
    findings: InspectionFindingEntity[],
    responsiblesByFinding: Map<string, string[]>,
    maps: NameMaps,
    existingByKey: Map<string, NotificationEntity>,
  ): Promise<void> {
    const grouped = new Map<string, InspectionFindingEntity[]>();
    findings.forEach((finding) => {
      if (finding.status !== InspectionFindingStatus.OPEN) return;
      const responsibleIds = responsiblesByFinding.get(finding.id) ?? [];
      if (!responsibleIds.includes(userId) && finding.ownerUserId !== userId) return;
      const current = grouped.get(finding.inspectionId) ?? [];
      current.push(finding);
      grouped.set(finding.inspectionId, current);
    });
    for (const [inspectionId, items] of grouped.entries()) {
      const inspection = inspectionsById.get(inspectionId);
      if (!inspection) continue;
      const inspectionNumber = this.resolveInspectionNumber(inspection);
      const metadata = this.baseMetadata('inspection.assigned', 'blue', inspection, items[0] ?? null, maps, `inspection.assigned:${inspection.id}:${userId}`);
      metadata.tag = 'Inspección asignada';
      metadata.headline = `Te asignaron una nueva inspección con ${items.length} ${items.length === 1 ? 'observación' : 'observaciones'} a ejecutar`;
      metadata.detailLine = `${items.length} ${items.length === 1 ? 'observación' : 'observaciones'}`;
      metadata.severityLabels = this.uniqueSeverityLabels(items);
      metadata.footerLine = `Inspector: ${this.userName(inspection.inspectorId, maps)} · ${this.companyName(inspection.companyId, maps)} · ${this.locationName(inspection, maps)}`;
      metadata.occurredAt = this.toNullableIsoString(inspection.scheduledAt) ?? inspection.createdAt.toISOString();
      await this.upsertInspectionNotification({
        title: metadata.headline,
        body: metadata.footerLine,
        category: 'inspection.assigned',
        entityType: 'inspection',
        entityId: inspection.id,
        triggeredByUserId: inspection.inspectorId,
        recipientUserIds: [userId],
        metadata: { ...metadata, inspectionNumber },
      }, existingByKey);
    }
  }

  private async seedFindingLifecycleNotifications(
    userId: string,
    inspection: InspectionEntity,
    finding: InspectionFindingEntity,
    responsibleIds: string[],
    maps: NameMaps,
    existingByKey: Map<string, NotificationEntity>,
  ): Promise<void> {
    if (finding.status === InspectionFindingStatus.IN_PROGRESS && finding.executedAt) {
      const recipients = this.uniqueIds([finding.executedByUserId, inspection.inspectorId, finding.createdByUserId, finding.ownerUserId, ...responsibleIds]);
      if (recipients.includes(userId)) {
        const metadata = this.baseMetadata('inspection.finding.executed', 'teal', inspection, finding, maps, `inspection.finding.executed:${finding.id}:${this.dateKey(finding.executedAt)}`);
        metadata.tag = 'Observación ejecutada';
        metadata.headline = 'Marcaste como ejecutada una observación · pendiente de aprobación del Admin GF';
        metadata.detailLine = this.findingDetailLine(finding);
        metadata.severityLabels = [this.severityLabel(finding.severity)];
        metadata.footerLine = `Evidencia enviada · ${this.userName(finding.executedByUserId, maps)} revisará y aprobará o rechazará`;
        metadata.occurredAt = finding.executedAt.toISOString();
        await this.upsertInspectionNotification({ title: metadata.headline, body: metadata.footerLine, category: 'inspection.finding.executed', entityType: 'inspection_finding', entityId: finding.id, triggeredByUserId: finding.executedByUserId, recipientUserIds: [userId], metadata }, existingByKey);
      }
    }
    if (finding.status === InspectionFindingStatus.CLOSED && finding.closedAt) {
      const recipients = this.uniqueIds([finding.executedByUserId, finding.closedByUserId, inspection.inspectorId, finding.ownerUserId, ...responsibleIds]);
      if (recipients.includes(userId)) {
        const metadata = this.baseMetadata('inspection.finding.closed', 'green', inspection, finding, maps, `inspection.finding.closed:${finding.id}:${this.dateKey(finding.closedAt)}`);
        metadata.tag = 'Cierre aprobado';
        metadata.headline = 'El Admin GF aprobó el cierre de una observación';
        metadata.detailLine = this.findingDetailLine(finding);
        metadata.severityLabels = [this.severityLabel(finding.severity)];
        metadata.footerLine = `Aprobado por ${this.userName(finding.closedByUserId, maps)} · Admin GF HSE · ${this.formatDate(finding.closedAt)}`;
        metadata.occurredAt = finding.closedAt.toISOString();
        await this.upsertInspectionNotification({ title: metadata.headline, body: metadata.footerLine, category: 'inspection.finding.closed', entityType: 'inspection_finding', entityId: finding.id, triggeredByUserId: finding.closedByUserId, recipientUserIds: [userId], metadata }, existingByKey);
      }
    }
    if (finding.status === InspectionFindingStatus.REJECTED && finding.rejectedAt) {
      const recipients = this.uniqueIds([finding.executedByUserId, finding.ownerUserId, ...responsibleIds]);
      if (recipients.includes(userId)) {
        const metadata = this.baseMetadata('inspection.finding.rejected', 'red', inspection, finding, maps, `inspection.finding.rejected:${finding.id}:${this.dateKey(finding.rejectedAt)}`);
        metadata.tag = 'Evidencia rechazada';
        metadata.headline = 'El Admin GF rechazó tu evidencia · debes corregirla y reenviar';
        metadata.detailLine = this.findingDetailLine(finding);
        metadata.severityLabels = [this.severityLabel(finding.severity)];
        metadata.reason = finding.rejectionReason ? `Motivo: "${finding.rejectionReason}"` : undefined;
        metadata.occurredAt = finding.rejectedAt.toISOString();
        await this.upsertInspectionNotification({ title: metadata.headline, body: metadata.reason ?? null, category: 'inspection.finding.rejected', entityType: 'inspection_finding', entityId: finding.id, triggeredByUserId: finding.rejectedByUserId, recipientUserIds: [userId], metadata }, existingByKey);
      }
    }
  }

  private async seedInspectionClosedNotification(
    userId: string,
    inspection: InspectionEntity,
    findings: InspectionFindingEntity[],
    responsiblesByFinding: Map<string, string[]>,
    maps: NameMaps,
    existingByKey: Map<string, NotificationEntity>,
  ): Promise<void> {
    if (inspection.status !== InspectionStatus.CLOSED && !inspection.closedAt) return;
    const responsibleIds = findings.flatMap((finding) => responsiblesByFinding.get(finding.id) ?? []);
    const recipients = this.uniqueIds([inspection.inspectorId, ...responsibleIds]);
    if (!recipients.includes(userId)) return;
    const occurredAt = inspection.closedAt ?? inspection.updatedAt;
    const metadata = this.baseMetadata('inspection.closed', 'green', inspection, null, maps, `inspection.closed:${inspection.id}:${this.dateKey(occurredAt)}`);
    metadata.tag = 'Inspección cerrada';
    metadata.headline = 'Todas las observaciones fueron aprobadas · inspección cerrada exitosamente';
    metadata.detailLine = `${findings.length} observaciones · todas cerradas`;
    metadata.progressLabel = '100%';
    metadata.footerLine = `Cerrada por ${this.userName(inspection.inspectorId, maps)} · Admin GF HSE · ${this.formatDate(occurredAt)}`;
    metadata.occurredAt = occurredAt.toISOString();
    await this.upsertInspectionNotification({ title: metadata.headline, body: metadata.footerLine, category: 'inspection.closed', entityType: 'inspection', entityId: inspection.id, triggeredByUserId: inspection.inspectorId, recipientUserIds: [userId], metadata }, existingByKey);
  }

  private async upsertInspectionNotification(input: InspectionSeedInput, existingByKey: Map<string, NotificationEntity>): Promise<void> {
    const eventKey = input.metadata.eventKey;
    if (!eventKey) return;
    const existing = existingByKey.get(eventKey);
    const recipientUserIds = this.uniqueIds(input.recipientUserIds);
    if (existing) {
      const existingRecipientIds = new Set((existing.recipients ?? []).map((recipient) => recipient.userId));
      const missingIds = recipientUserIds.filter((userId) => !existingRecipientIds.has(userId));
      if (missingIds.length > 0) {
        await this.insertRecipientsIgnoringDuplicates(existing.id, missingIds);
        const savedRecipients = await this.recipientsRepository.find({ where: { notificationId: existing.id } });
        existing.recipients = savedRecipients;
      }
      return;
    }
    const notification = await this.notificationsRepository.save(this.notificationsRepository.create({
      title: input.title,
      body: input.body,
      category: input.category,
      entityType: input.entityType,
      entityId: input.entityId,
      triggeredByUserId: input.triggeredByUserId,
      metadata: input.metadata,
    }));
    await this.insertRecipientsIgnoringDuplicates(notification.id, recipientUserIds);
    notification.recipients = await this.recipientsRepository.find({ where: { notificationId: notification.id } });
    existingByKey.set(eventKey, notification);
  }

  private async insertRecipientsIgnoringDuplicates(notificationId: string, userIds: string[]): Promise<void> {
    const values = this.uniqueIds(userIds).map((userId) => ({ notificationId, userId }));
    if (values.length === 0) return;
    await this.recipientsRepository
      .createQueryBuilder()
      .insert()
      .into(NotificationRecipientEntity)
      .values(values)
      .orIgnore()
      .execute();
  }

  private mergeRecipientRows(rows: NotificationRecipientEntity[]): NotificationRecipientEntity[] {
    const groups = new Map<string, NotificationRecipientEntity[]>();
    rows.forEach((row) => {
      const current = groups.get(row.notificationId) ?? [];
      current.push(row);
      groups.set(row.notificationId, current);
    });

    return Array.from(groups.values()).flatMap((group) => {
      if (group.some((row) => row.dismissedAt)) return [];
      const representative = group[0];
      const readDates = group
        .map((row) => row.readAt)
        .filter((value): value is Date => value instanceof Date);
      representative.readAt = readDates.length > 0
        ? readDates.sort((left, right) => left.getTime() - right.getTime())[0]
        : null;
      return [representative];
    });
  }

  private async loadNameMaps(): Promise<NameMaps> {
    const [areas, companies, sectors, users, types, templates] = await Promise.all([
      this.areasRepository.find(),
      this.companiesRepository.find(),
      this.sectorsRepository.find(),
      this.usersRepository.find(),
      this.inspectionTypesRepository.find(),
      this.templatesRepository.find(),
    ]);
    return {
      areas: new Map(areas.map((area) => [area.id, area.name])),
      companies: new Map(companies.map((company) => [company.id, company.name])),
      sectors: new Map(sectors.map((sector) => [sector.id, sector.name])),
      users: new Map(users.map((user) => [user.id, user])),
      types: new Map(types.map((type) => [type.id, type])),
      templates: new Map(templates.map((template) => [template.id, template])),
    };
  }

  private baseMetadata(event: InspectionNotificationEvent, tone: InspectionNotificationTone, inspection: InspectionEntity, finding: InspectionFindingEntity | null, maps: NameMaps, eventKey: string): InspectionNotificationMetadata & Record<string, unknown> {
    const inspectionNumber = this.resolveInspectionNumber(inspection);
    return {
      event,
      eventKey,
      tone,
      inspectionId: inspection.id,
      findingId: finding?.id,
      inspectionNumber,
      inspectionLabel: this.inspectionLabel(inspection, maps),
      unreadDot: true,
    };
  }

  private inspectionLabel(inspection: InspectionEntity, maps: NameMaps): string {
    const inspectionNumber = this.resolveInspectionNumber(inspection);
    const template = inspection.templateId ? maps.templates.get(inspection.templateId) : null;
    const type = maps.types.get(inspection.inspectionTypeId);
    const kind = template ? 'Checklist' : type?.name ?? 'Hallazgo';
    return `Insp. #${inspectionNumber} · ${kind} · ${this.locationName(inspection, maps)}`;
  }

  private findingDetailLine(finding: InspectionFindingEntity): string {
    const description = finding.detectedCondition ?? finding.description ?? finding.title;
    return `Obs. 1 · ${description}`;
  }

  private groupResponsiblesByFinding(responsibles: InspectionFindingResponsibleEntity[]): Map<string, string[]> {
    const grouped = new Map<string, string[]>();
    responsibles.forEach((responsible) => {
      const current = grouped.get(responsible.findingId) ?? [];
      current.push(responsible.userId);
      grouped.set(responsible.findingId, current);
    });
    return grouped;
  }

  private groupFindingsByInspection(findings: InspectionFindingEntity[]): Map<string, InspectionFindingEntity[]> {
    const grouped = new Map<string, InspectionFindingEntity[]>();
    findings.forEach((finding) => {
      const current = grouped.get(finding.inspectionId) ?? [];
      current.push(finding);
      grouped.set(finding.inspectionId, current);
    });
    return grouped;
  }

  private uniqueSeverityLabels(findings: InspectionFindingEntity[]): string[] {
    return [...new Set(findings.map((finding) => this.severityLabel(finding.severity)))];
  }

  private severityLabel(severity: InspectionFindingSeverity): string {
    if (severity === InspectionFindingSeverity.LOW) return 'Menor';
    if (severity === InspectionFindingSeverity.MEDIUM) return 'Moderado';
    return 'Grave';
  }

  private resolveInspectionNumber(inspection: InspectionEntity): string {
    const match = inspection.title.match(/#?(\d+)/);
    return match?.[1] ?? inspection.id.slice(0, 8).toUpperCase();
  }

  private userName(userId: string | null | undefined, maps: NameMaps): string {
    if (!userId) return 'Sin usuario';
    const user = maps.users.get(userId);
    if (!user) return 'Sin usuario';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private companyName(companyId: string | null, maps: NameMaps): string {
    if (!companyId) return 'Sin empresa';
    return maps.companies.get(companyId) ?? 'Sin empresa';
  }

  private locationName(inspection: InspectionEntity, maps: NameMaps): string {
    const area = inspection.areaId ? maps.areas.get(inspection.areaId) : null;
    const sector = inspection.sectorId ? maps.sectors.get(inspection.sectorId) : null;
    return [area, sector].filter(Boolean).join(' · ') || this.companyName(inspection.companyId, maps);
  }

  private uniqueIds(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
  }

  private eventKeyOf(metadata: Record<string, unknown> | null): string | null {
    const value = metadata?.eventKey;
    return typeof value === 'string' ? value : null;
  }

  private inspectionMetadataOf(metadata: Record<string, unknown> | null): InspectionNotificationMetadata {
    return (metadata ?? {}) as InspectionNotificationMetadata;
  }

  private occurredAtOf(notification: NotificationEntity): Date {
    const metadata = this.inspectionMetadataOf(notification.metadata);
    const occurredAt = typeof metadata.occurredAt === 'string' ? new Date(metadata.occurredAt) : null;
    return occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : notification.createdAt;
  }

  private sortDateOf(notification: NotificationEntity): Date {
    return this.occurredAtOf(notification);
  }

  private dateKey(value: Date): string {
    return value.toISOString();
  }

  private formatDate(value: Date): string {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${value.getFullYear()}`;
  }

  private toNullableIsoString(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }

  private async findByIdForUser(notificationId: string, userId: string | null, includeRecipients = false): Promise<NotificationResponse> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
      relations: { recipients: true },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    const recipient = userId
      ? notification.recipients?.find((row) => row.userId === userId) ?? null
      : null;

    const response = this.toResponse(notification, recipient);
    if (includeRecipients) response.recipients = notification.recipients?.map((row) => this.toRecipientResponse(row)) ?? [];
    return response;
  }

  private toResponse(notification: NotificationEntity, recipient: NotificationRecipientEntity | null): NotificationResponse {
    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      category: notification.category,
      entityType: notification.entityType,
      entityId: notification.entityId,
      triggeredByUserId: notification.triggeredByUserId,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
      readAt: recipient?.readAt ? recipient.readAt.toISOString() : null,
    };
  }

  private toRecipientResponse(recipient: NotificationRecipientEntity): NotificationRecipientResponse {
    return {
      id: recipient.id,
      userId: recipient.userId,
      readAt: recipient.readAt ? recipient.readAt.toISOString() : null,
      dismissedAt: recipient.dismissedAt ? recipient.dismissedAt.toISOString() : null,
    };
  }
}
