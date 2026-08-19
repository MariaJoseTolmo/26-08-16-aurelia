import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionAnswerValue,
  InspectionChecklistAnswerResponse,
  InspectionChecklistSectionResponse,
  InspectionChecklistTemplateResponse,
  InspectionDashboardSummaryResponse,
  InspectionFindingResponse,
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionFollowupResponse,
  InspectionFollowupStatus,
  InspectionResponse,
  InspectionStatus,
  InspectionType,
  InspectionTypeResponse,
} from '@aurelia/contracts';
import { In, QueryFailedError, Repository } from 'typeorm';
import { CreateInspectionFindingDto } from './dto/create-inspection-finding.dto';
import { CreateInspectionFollowupDto } from './dto/create-inspection-followup.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionFindingDto } from './dto/update-inspection-finding.dto';
import { UpdateInspectionFollowupDto } from './dto/update-inspection-followup.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { UpdateInspectionStatusDto } from './dto/update-inspection-status.dto';
import { UpsertInspectionAnswerDto } from './dto/upsert-inspection-answer.dto';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionFindingResponsibleEntity } from './entities/inspection-finding-responsible.entity';
import { InspectionFollowupEntity } from './entities/inspection-followup.entity';
import { InspectionFormItemEntity } from './entities/inspection-form-item.entity';
import { InspectionFormSectionEntity } from './entities/inspection-form-section.entity';
import { InspectionFormTemplateEntity } from './entities/inspection-form-template.entity';
import { InspectionItemResponseEntity } from './entities/inspection-item-response.entity';
import { InspectionStateEntity } from './entities/inspection-state.entity';
import { InspectionTypeEntity } from './entities/inspection-type.entity';
import { InspectionEntity } from './entities/inspection.entity';

interface InspectionListFilters {
  status?: string;
  inspectionTypeId?: string;
}

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionTypeEntity)
    private readonly inspectionTypes: Repository<InspectionTypeEntity>,
    @InjectRepository(InspectionFormTemplateEntity)
    private readonly templates: Repository<InspectionFormTemplateEntity>,
    @InjectRepository(InspectionFormSectionEntity)
    private readonly sections: Repository<InspectionFormSectionEntity>,
    @InjectRepository(InspectionFormItemEntity)
    private readonly items: Repository<InspectionFormItemEntity>,
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionItemResponseEntity)
    private readonly answers: Repository<InspectionItemResponseEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFindingResponsibleEntity)
    private readonly findingResponsibles: Repository<InspectionFindingResponsibleEntity>,
    @InjectRepository(InspectionFollowupEntity)
    private readonly followups: Repository<InspectionFollowupEntity>,
    @InjectRepository(InspectionStateEntity)
    private readonly statusHistory: Repository<InspectionStateEntity>,
  ) {}

  async findTypes(): Promise<InspectionTypeResponse[]> {
    const rows = await this.inspectionTypes.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.toTypeResponse(row));
  }

  async findTemplates(): Promise<InspectionChecklistTemplateResponse[]> {
    const templates = await this.templates.find({ where: { isActive: true }, order: { code: 'ASC' } });
    const templateIds = templates.map((template) => template.id);

    if (templateIds.length === 0) return [];

    const sections = await this.sections.find({
      where: { templateId: In(templateIds), isActive: true },
      order: { sortOrder: 'ASC' },
    });
    const sectionIds = sections.map((section) => section.id);
    const items = sectionIds.length
      ? await this.items.find({ where: { sectionId: In(sectionIds), isActive: true }, order: { sortOrder: 'ASC' } })
      : [];

    const itemsBySection = new Map<string, InspectionFormItemEntity[]>();
    for (const item of items) {
      const existing = itemsBySection.get(item.sectionId) ?? [];
      existing.push(item);
      itemsBySection.set(item.sectionId, existing);
    }

    const sectionsByTemplate = new Map<string, InspectionChecklistSectionResponse[]>();
    for (const section of sections) {
      const existing = sectionsByTemplate.get(section.templateId) ?? [];
      existing.push({
        id: section.id,
        templateId: section.templateId,
        code: section.code,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        isActive: section.isActive,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString(),
        items: (itemsBySection.get(section.id) ?? []).map((item) => ({
          id: item.id,
          sectionId: item.sectionId,
          code: item.code,
          question: item.question,
          guidance: item.guidance,
          responseType: item.responseType,
          isRequired: item.isRequired,
          requiresEvidenceOnNotCompliant: item.requiresEvidenceOnNotCompliant,
          sortOrder: item.sortOrder,
          weight: item.weight,
          isActive: item.isActive,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      });
      sectionsByTemplate.set(section.templateId, existing);
    }

    return templates.map((template) => ({
      id: template.id,
      inspectionTypeId: template.inspectionTypeId,
      code: template.code,
      name: template.name,
      description: template.description,
      version: template.version,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      sections: sectionsByTemplate.get(template.id) ?? [],
    }));
  }

  async getDashboardSummary(): Promise<InspectionDashboardSummaryResponse> {
    const inspections = await this.inspections.find();
    const findings = await this.findings.find();
    const byStatus = this.createInspectionStatusCounter();
    const findingsByStatus = this.createFindingStatusCounter();
    const findingsBySeverity = this.createFindingSeverityCounter();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const inspection of inspections) byStatus[inspection.status] += 1;
    for (const finding of findings) {
      findingsByStatus[finding.status] += 1;
      findingsBySeverity[finding.severity] += 1;
    }

    const openFindings = findings.filter((finding) => [InspectionFindingStatus.OPEN, InspectionFindingStatus.IN_PROGRESS].includes(finding.status));
    const overdue = openFindings.filter((finding) => finding.dueAt && finding.dueAt < now).length;
    const dueSoonNext7Days = openFindings.filter((finding) => finding.dueAt && finding.dueAt >= now && finding.dueAt <= sevenDaysFromNow).length;
    const withOpenFindings = inspections.filter((inspection) => inspection.openFindingsCount > 0).length;
    const closedRate = inspections.length === 0 ? 0 : Number(((byStatus[InspectionStatus.CLOSED] / inspections.length) * 100).toFixed(2));

    return {
      inspections: { total: inspections.length, byStatus, withOpenFindings, closedRate },
      findings: {
        total: findings.length,
        byStatus: findingsByStatus,
        bySeverity: findingsBySeverity,
        open: openFindings.length,
        overdue,
        dueSoonNext7Days,
      },
    };
  }

  async findAll(filters: InspectionListFilters = {}): Promise<InspectionResponse[]> {
    const query = this.inspections.createQueryBuilder('inspection');

    if (filters.status) {
      if (!Object.values(InspectionStatus).includes(filters.status as InspectionStatus)) {
        throw new BadRequestException(`Invalid inspection status '${filters.status}'`);
      }
      query.andWhere('inspection.status = :status', { status: filters.status });
    }

    if (filters.inspectionTypeId) {
      query.andWhere('inspection.inspection_type_id = :inspectionTypeId', { inspectionTypeId: filters.inspectionTypeId });
    }

    return (await query.orderBy('inspection.created_at', 'DESC').getMany()).map((row) => this.toInspectionResponse(row));
  }

  async findOne(id: string): Promise<InspectionResponse> {
    return this.toInspectionResponse(await this.getInspectionOrThrow(id));
  }

  async create(dto: CreateInspectionDto, inspectorId: string | null): Promise<InspectionResponse> {
    await this.assertTypeAndTemplate(dto.inspectionTypeId, dto.templateId ?? null);
    const entity = this.inspections.create({
      inspectionTypeId: dto.inspectionTypeId,
      templateId: dto.templateId ?? null,
      companyId: dto.companyId ?? null,
      areaId: dto.areaId ?? null,
      sectorId: dto.sectorId ?? null,
      locationId: dto.locationId ?? null,
      inspectorId,
      title: dto.title,
      description: dto.description ?? null,
      status: InspectionStatus.DRAFT,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      latitude: this.toNullableNumericString(dto.latitude),
      longitude: this.toNullableNumericString(dto.longitude),
      findingsCount: 0,
      openFindingsCount: 0,
      notes: dto.notes ?? null,
    });

    try {
      const saved = await this.inspections.save(entity);
      await this.createStatusHistory(saved.id, null, saved.status, inspectorId, 'created');
      return this.toInspectionResponse(saved);
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  async update(id: string, dto: UpdateInspectionDto, actorId: string | null): Promise<InspectionResponse> {
    const entity = await this.getInspectionOrThrow(id);
    const previousStatus = entity.status;
    const nextTypeId = dto.inspectionTypeId ?? entity.inspectionTypeId;
    const nextTemplateId = dto.templateId === undefined ? entity.templateId : dto.templateId;

    if (dto.inspectionTypeId !== undefined || dto.templateId !== undefined) await this.assertTypeAndTemplate(nextTypeId, nextTemplateId ?? null);
    if (dto.inspectionTypeId !== undefined) entity.inspectionTypeId = dto.inspectionTypeId;
    if (dto.templateId !== undefined) entity.templateId = dto.templateId;
    if (dto.companyId !== undefined) entity.companyId = dto.companyId;
    if (dto.areaId !== undefined) entity.areaId = dto.areaId;
    if (dto.sectorId !== undefined) entity.sectorId = dto.sectorId;
    if (dto.locationId !== undefined) entity.locationId = dto.locationId;
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.scheduledAt !== undefined) entity.scheduledAt = this.toNullableDate(dto.scheduledAt);
    if (dto.startedAt !== undefined) entity.startedAt = this.toNullableDate(dto.startedAt);
    if (dto.completedAt !== undefined) entity.completedAt = this.toNullableDate(dto.completedAt);
    if (dto.closedAt !== undefined) entity.closedAt = this.toNullableDate(dto.closedAt);
    if (dto.latitude !== undefined) entity.latitude = this.toNullableNumericString(dto.latitude);
    if (dto.longitude !== undefined) entity.longitude = this.toNullableNumericString(dto.longitude);
    if (dto.score !== undefined) entity.score = this.toNullableNumericString(dto.score);
    if (dto.notes !== undefined) entity.notes = dto.notes;

    try {
      const saved = await this.inspections.save(entity);
      if (saved.status !== previousStatus) await this.createStatusHistory(saved.id, previousStatus, saved.status, actorId, dto.reason ?? null);
      return this.toInspectionResponse(saved);
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  async updateStatus(id: string, dto: UpdateInspectionStatusDto, actorId: string | null): Promise<InspectionResponse> {
    return this.update(id, { status: dto.status, reason: dto.comment ?? null }, actorId);
  }

  async upsertAnswer(inspectionId: string, dto: UpsertInspectionAnswerDto, actorId: string | null): Promise<InspectionChecklistAnswerResponse> {
    const inspection = await this.getInspectionOrThrow(inspectionId);
    const item = await this.items.findOneBy({ id: dto.checklistItemId });
    if (!item) throw new NotFoundException(`Checklist item ${dto.checklistItemId} not found`);
    if (inspection.templateId) {
      const section = await this.sections.findOneBy({ id: item.sectionId });
      if (!section || section.templateId !== inspection.templateId) throw new BadRequestException('Checklist item does not belong to the inspection template');
    }

    const existing = await this.answers.findOneBy({ inspectionId, checklistItemId: dto.checklistItemId });
    const answer = existing ?? this.answers.create({ inspectionId, checklistItemId: dto.checklistItemId });
    answer.answerValue = dto.answerValue ?? null;
    answer.answerText = dto.answerText ?? null;
    answer.numericValue = this.toNullableNumericString(dto.numericValue);
    answer.answeredByUserId = actorId;
    answer.answeredAt = dto.answeredAt ? new Date(dto.answeredAt) : new Date();
    answer.notes = dto.notes ?? null;

    try {
      return this.toAnswerResponse(await this.answers.save(answer));
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  async findFindings(inspectionId: string): Promise<InspectionFindingResponse[]> {
    await this.getInspectionOrThrow(inspectionId);
    const rows = await this.findings.find({ where: { inspectionId }, order: { createdAt: 'DESC' } });
    return Promise.all(rows.map((row) => this.toFindingResponse(row)));
  }

  async createFinding(inspectionId: string, dto: CreateInspectionFindingDto, actorId: string | null): Promise<InspectionFindingResponse> {
    const inspection = await this.getInspectionOrThrow(inspectionId);
    await this.assertChecklistItemBelongsToInspection(inspection, dto.checklistItemId ?? null);

    const entity = this.findings.create({
      inspectionId,
      checklistItemId: dto.checklistItemId ?? null,
      findingTypeId: dto.findingTypeId ?? null,
      severityId: dto.severityId ?? null,
      responsibleCompanyId: dto.responsibleCompanyId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      detectedCondition: dto.detectedCondition ?? null,
      proposedCorrectiveAction: dto.proposedCorrectiveAction ?? null,
      executedActionDescription: null,
      rejectionReason: null,
      severity: dto.severity,
      status: InspectionFindingStatus.OPEN,
      ownerUserId: dto.ownerUserId ?? null,
      createdByUserId: actorId,
      dueAt: this.toNullableDate(dto.dueAt ?? null),
      executedAt: null,
      executedByUserId: null,
      closedAt: null,
      closedByUserId: null,
      rejectedAt: null,
      rejectedByUserId: null,
    });

    try {
      const saved = await this.findings.save(entity);
      if (dto.responsibleUserIds?.length) {
        await this.findingResponsibles.save(dto.responsibleUserIds.map((userId) => this.findingResponsibles.create({ findingId: saved.id, userId })));
      }
      await this.refreshFindingCounters(inspectionId);
      return this.toFindingResponse(saved);
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  async updateFinding(findingId: string, dto: UpdateInspectionFindingDto, actorId: string | null): Promise<InspectionFindingResponse> {
    const entity = await this.getFindingOrThrow(findingId);
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.detectedCondition !== undefined) entity.detectedCondition = dto.detectedCondition;
    if (dto.proposedCorrectiveAction !== undefined) entity.proposedCorrectiveAction = dto.proposedCorrectiveAction;
    if (dto.executedActionDescription !== undefined) entity.executedActionDescription = dto.executedActionDescription;
    if (dto.rejectionReason !== undefined) entity.rejectionReason = dto.rejectionReason;
    if (dto.severity !== undefined) entity.severity = dto.severity;
    if (dto.ownerUserId !== undefined) entity.ownerUserId = dto.ownerUserId;
    if (dto.dueAt !== undefined) entity.dueAt = this.toNullableDate(dto.dueAt);
    if (dto.executedAt !== undefined) entity.executedAt = this.toNullableDate(dto.executedAt);
    if (dto.closedAt !== undefined) entity.closedAt = this.toNullableDate(dto.closedAt);
    if (dto.rejectedAt !== undefined) entity.rejectedAt = this.toNullableDate(dto.rejectedAt);
    if (dto.status !== undefined) {
      entity.status = dto.status;
      if (dto.status === InspectionFindingStatus.IN_PROGRESS) {
        entity.executedAt = entity.executedAt ?? new Date();
        entity.executedByUserId = entity.executedByUserId ?? actorId;
        entity.closedAt = null;
        entity.closedByUserId = null;
        entity.rejectedAt = null;
        entity.rejectedByUserId = null;
      } else if (dto.status === InspectionFindingStatus.CLOSED) {
        entity.closedAt = entity.closedAt ?? new Date();
        entity.closedByUserId = actorId;
        entity.rejectedAt = null;
        entity.rejectedByUserId = null;
      } else if (dto.status === InspectionFindingStatus.REJECTED) {
        entity.rejectedAt = entity.rejectedAt ?? new Date();
        entity.rejectedByUserId = actorId;
        entity.closedAt = null;
        entity.closedByUserId = null;
      } else {
        entity.closedAt = null;
        entity.closedByUserId = null;
        entity.rejectedAt = null;
        entity.rejectedByUserId = null;
      }
    }

    try {
      const saved = await this.findings.save(entity);
      if (dto.responsibleUserIds !== undefined) await this.replaceFindingResponsibles(saved.id, dto.responsibleUserIds);
      await this.refreshFindingCounters(saved.inspectionId);
      return this.toFindingResponse(saved);
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  async createFollowup(findingId: string, dto: CreateInspectionFollowupDto, actorId: string | null): Promise<InspectionFollowupResponse> {
    await this.getFindingOrThrow(findingId);
    const existingCount = await this.followups.count({ where: { findingId } });
    if (existingCount >= 3) throw new BadRequestException('A finding can have a maximum of 3 followups');
    const status = dto.status ?? InspectionFollowupStatus.PENDING;
    const entity = this.followups.create({
      findingId,
      sequenceNumber: existingCount + 1,
      status,
      description: dto.description,
      performedByUserId: dto.performedByUserId ?? actorId,
      performedAt: dto.performedAt ? new Date(dto.performedAt) : status === InspectionFollowupStatus.COMPLETED ? new Date() : null,
      nextDueAt: this.toNullableDate(dto.nextDueAt ?? null),
    });

    try {
      return this.toFollowupResponse(await this.followups.save(entity));
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  async updateFollowup(followupId: string, dto: UpdateInspectionFollowupDto): Promise<InspectionFollowupResponse> {
    const entity = await this.getFollowupOrThrow(followupId);
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.performedByUserId !== undefined) entity.performedByUserId = dto.performedByUserId;
    if (dto.performedAt !== undefined) entity.performedAt = this.toNullableDate(dto.performedAt);
    if (dto.nextDueAt !== undefined) entity.nextDueAt = this.toNullableDate(dto.nextDueAt);
    if (entity.status === InspectionFollowupStatus.COMPLETED && !entity.performedAt) entity.performedAt = new Date();

    try {
      return this.toFollowupResponse(await this.followups.save(entity));
    } catch (err) {
      this.rethrowDatabaseReferenceError(err);
    }
  }

  private async getInspectionOrThrow(id: string): Promise<InspectionEntity> {
    const inspection = await this.inspections.findOneBy({ id });
    if (!inspection) throw new NotFoundException(`Inspection ${id} not found`);
    return inspection;
  }

  private async getFindingOrThrow(id: string): Promise<InspectionFindingEntity> {
    const finding = await this.findings.findOneBy({ id });
    if (!finding) throw new NotFoundException(`Inspection finding ${id} not found`);
    return finding;
  }

  private async getFollowupOrThrow(id: string): Promise<InspectionFollowupEntity> {
    const followup = await this.followups.findOneBy({ id });
    if (!followup) throw new NotFoundException(`Inspection followup ${id} not found`);
    return followup;
  }

  private async assertTypeAndTemplate(inspectionTypeId: string, templateId: string | null): Promise<void> {
    const type = await this.inspectionTypes.findOneBy({ id: inspectionTypeId });
    if (!type) throw new NotFoundException(`Inspection type ${inspectionTypeId} not found`);
    if (!templateId) return;
    const template = await this.templates.findOneBy({ id: templateId });
    if (!template) throw new NotFoundException(`Inspection template ${templateId} not found`);
    if (template.inspectionTypeId !== inspectionTypeId) throw new BadRequestException('Inspection template does not belong to the selected inspection type');
  }

  private async assertChecklistItemBelongsToInspection(inspection: InspectionEntity, checklistItemId: string | null): Promise<void> {
    if (!checklistItemId) return;
    const item = await this.items.findOneBy({ id: checklistItemId });
    if (!item) throw new NotFoundException(`Checklist item ${checklistItemId} not found`);
    if (!inspection.templateId) return;
    const section = await this.sections.findOneBy({ id: item.sectionId });
    if (!section || section.templateId !== inspection.templateId) throw new BadRequestException('Checklist item does not belong to the inspection template');
  }

  private async createStatusHistory(inspectionId: string, fromStatus: InspectionStatus | null, toStatus: InspectionStatus, actorId: string | null, reason: string | null): Promise<void> {
    await this.statusHistory.save(this.statusHistory.create({ inspectionId, previousStatus: fromStatus, nextStatus: toStatus, changedByUserId: actorId, reason, metadata: null }));
  }

  private async refreshFindingCounters(inspectionId: string): Promise<void> {
    const findingsCount = await this.findings.count({ where: { inspectionId } });
    const openFindingsCount = await this.findings.count({ where: { inspectionId, status: In([InspectionFindingStatus.OPEN, InspectionFindingStatus.IN_PROGRESS]) } });
    await this.inspections.update({ id: inspectionId }, { findingsCount, openFindingsCount });
  }

  private async replaceFindingResponsibles(findingId: string, responsibleUserIds: string[]): Promise<void> {
    await this.findingResponsibles.delete({ findingId });
    if (responsibleUserIds.length === 0) return;
    await this.findingResponsibles.save(responsibleUserIds.map((userId) => this.findingResponsibles.create({ findingId, userId })));
  }

  private toTypeResponse(entity: InspectionTypeEntity): InspectionTypeResponse {
    return { id: entity.id, code: entity.code as InspectionType, name: entity.name, description: entity.description, status: entity.status, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }

  private toInspectionResponse(entity: InspectionEntity): InspectionResponse {
    return { id: entity.id, inspectionTypeId: entity.inspectionTypeId, templateId: entity.templateId, companyId: entity.companyId, areaId: entity.areaId, sectorId: entity.sectorId, locationId: entity.locationId, inspectorId: entity.inspectorId, title: entity.title, description: entity.description, status: entity.status, scheduledAt: this.toNullableIsoString(entity.scheduledAt), startedAt: this.toNullableIsoString(entity.startedAt), completedAt: this.toNullableIsoString(entity.completedAt), closedAt: this.toNullableIsoString(entity.closedAt), latitude: entity.latitude, longitude: entity.longitude, score: entity.score, findingsCount: entity.findingsCount, openFindingsCount: entity.openFindingsCount, notes: entity.notes, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }

  private toAnswerResponse(entity: InspectionItemResponseEntity): InspectionChecklistAnswerResponse {
    return { id: entity.id, inspectionId: entity.inspectionId, checklistItemId: entity.checklistItemId, answerValue: entity.answerValue as InspectionAnswerValue | null, answerText: entity.answerText, numericValue: entity.numericValue, answeredByUserId: entity.answeredByUserId, answeredAt: this.toNullableIsoString(entity.answeredAt), notes: entity.notes, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }

  private async toFindingResponse(entity: InspectionFindingEntity): Promise<InspectionFindingResponse> {
    const responsibleUserIds = (await this.findingResponsibles.find({ where: { findingId: entity.id } })).map((row) => row.userId);
    return { id: entity.id, inspectionId: entity.inspectionId, checklistItemId: entity.checklistItemId, findingTypeId: entity.findingTypeId, severityId: entity.severityId, responsibleCompanyId: entity.responsibleCompanyId, responsibleUserIds, title: entity.title, description: entity.description, detectedCondition: entity.detectedCondition, proposedCorrectiveAction: entity.proposedCorrectiveAction, executedActionDescription: entity.executedActionDescription, rejectionReason: entity.rejectionReason, severity: entity.severity, status: entity.status, ownerUserId: entity.ownerUserId, createdByUserId: entity.createdByUserId, dueAt: this.toNullableIsoString(entity.dueAt), executedAt: this.toNullableIsoString(entity.executedAt), executedByUserId: entity.executedByUserId, closedAt: this.toNullableIsoString(entity.closedAt), closedByUserId: entity.closedByUserId, rejectedAt: this.toNullableIsoString(entity.rejectedAt), rejectedByUserId: entity.rejectedByUserId, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }

  private toFollowupResponse(entity: InspectionFollowupEntity): InspectionFollowupResponse {
    return { id: entity.id, findingId: entity.findingId, sequenceNumber: entity.sequenceNumber, status: entity.status, description: entity.description, performedByUserId: entity.performedByUserId, performedAt: this.toNullableIsoString(entity.performedAt), nextDueAt: this.toNullableIsoString(entity.nextDueAt), createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }

  private createInspectionStatusCounter(): Record<InspectionStatus, number> {
    return { [InspectionStatus.DRAFT]: 0, [InspectionStatus.SCHEDULED]: 0, [InspectionStatus.IN_PROGRESS]: 0, [InspectionStatus.SUBMITTED]: 0, [InspectionStatus.UNDER_REVIEW]: 0, [InspectionStatus.RETURNED]: 0, [InspectionStatus.CLOSED]: 0, [InspectionStatus.CANCELLED]: 0 };
  }

  private createFindingStatusCounter(): Record<InspectionFindingStatus, number> {
    return Object.values(InspectionFindingStatus).reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<InspectionFindingStatus, number>);
  }

  private createFindingSeverityCounter(): Record<InspectionFindingSeverity, number> {
    return { [InspectionFindingSeverity.LOW]: 0, [InspectionFindingSeverity.MEDIUM]: 0, [InspectionFindingSeverity.HIGH]: 0, [InspectionFindingSeverity.CRITICAL]: 0 };
  }

  private toNullableIsoString(value: Date | null): string | null { return value ? value.toISOString() : null; }

  private toNullableDate(value: string | null): Date | null { return value ? new Date(value) : null; }

  private toNullableNumericString(value: number | null | undefined): string | null { return value === null || value === undefined ? null : String(value); }

  private rethrowDatabaseReferenceError(err: unknown): never {
    if (err instanceof QueryFailedError) {
      const code = (err as QueryFailedError & { code?: string }).code;
      if (code === '23503') throw new BadRequestException('Referenced entity does not exist');
    }
    throw err as Error;
  }
}
