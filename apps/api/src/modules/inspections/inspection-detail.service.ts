import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionAnswerValue,
  InspectionEvidenceRelationType,
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionType,
  type EvidenceResponse,
  type ID,
  type InspectionDetailChecklistAnswerResponse,
  type InspectionDetailChecklistResultResponse,
  type InspectionDetailChecklistSummaryResponse,
  type InspectionDetailEvidenceResponse,
  type InspectionDetailFindingGroupKey,
  type InspectionDetailFindingItemResponse,
  type InspectionDetailFollowupResponse,
  type InspectionDetailGeneralResponse,
  type InspectionDetailResponse,
  type InspectionDetailResponsibleResponse,
} from '@aurelia/contracts';
import { In, Repository } from 'typeorm';
import { EvidencesService } from '../evidences/evidences.service';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionFindingResponsibleEntity } from './entities/inspection-finding-responsible.entity';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionFollowupEntity } from './entities/inspection-followup.entity';
import { InspectionFormItemEntity } from './entities/inspection-form-item.entity';
import { InspectionFormSectionEntity } from './entities/inspection-form-section.entity';
import { InspectionFormTemplateEntity } from './entities/inspection-form-template.entity';
import { InspectionItemResponseEntity } from './entities/inspection-item-response.entity';
import { InspectionTypeEntity } from './entities/inspection-type.entity';
import { InspectionEntity } from './entities/inspection.entity';

type EntityNameMaps = {
  areas: Map<string, string>;
  companies: Map<string, string>;
  sectors: Map<string, string>;
  users: Map<string, UserEntity>;
};

@Injectable()
export class InspectionDetailService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionTypeEntity)
    private readonly inspectionTypes: Repository<InspectionTypeEntity>,
    @InjectRepository(InspectionFormTemplateEntity)
    private readonly templates: Repository<InspectionFormTemplateEntity>,
    @InjectRepository(InspectionFormSectionEntity)
    private readonly checklistSections: Repository<InspectionFormSectionEntity>,
    @InjectRepository(InspectionFormItemEntity)
    private readonly checklistItems: Repository<InspectionFormItemEntity>,
    @InjectRepository(InspectionItemResponseEntity)
    private readonly checklistAnswers: Repository<InspectionItemResponseEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFindingResponsibleEntity)
    private readonly findingResponsibles: Repository<InspectionFindingResponsibleEntity>,
    @InjectRepository(InspectionFollowupEntity)
    private readonly followups: Repository<InspectionFollowupEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectors: Repository<SectorEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly evidencesService: EvidencesService,
  ) {}

  async getDetail(inspectionId: string, currentUserId: string | null): Promise<InspectionDetailResponse> {
    const inspection = await this.getInspectionOrThrow(inspectionId);
    const [inspectionType, template, findings, maps, generalEvidence] = await Promise.all([
      this.inspectionTypes.findOneBy({ id: inspection.inspectionTypeId }),
      inspection.templateId ? this.templates.findOneBy({ id: inspection.templateId }) : Promise.resolve(null),
      this.findings.find({ where: { inspectionId }, order: { createdAt: 'ASC' } }),
      this.loadNameMaps(),
      this.evidencesService.findAll('inspection', inspection.id),
    ]);

    const activeFindings = findings.filter((finding) => finding.status !== InspectionFindingStatus.CANCELLED);
    const findingIds = activeFindings.map((finding) => finding.id);
    const [responsibles, followups, evidenceByFinding] = await Promise.all([
      findingIds.length
        ? this.findingResponsibles.find({ where: { findingId: In(findingIds) } })
        : Promise.resolve([]),
      findingIds.length
        ? this.followups.find({ where: { findingId: In(findingIds) }, order: { sequenceNumber: 'ASC' } })
        : Promise.resolve([]),
      this.loadEvidenceByFinding(findingIds),
    ]);

    const responsibleIdsByFinding = this.groupResponsibleIds(responsibles);
    const findingItems = activeFindings.map((finding, index) => this.toFindingItem(
      finding,
      index,
      responsibleIdsByFinding.get(finding.id) ?? [],
      maps,
      evidenceByFinding.get(finding.id) ?? [],
      currentUserId,
    ));
    const groups = this.groupFindings(findingItems);
    const counts = this.countFindingGroups(findingItems);
    const progressPercent = findingItems.length === 0
      ? 100
      : Math.round((counts.closed / findingItems.length) * 100);
    const kind = this.resolveKind(inspectionType, template);
    const checklistResult = kind === 'checklist'
      ? await this.loadChecklistResult(inspection.id, inspection.templateId, maps)
      : null;
    const scheduledDate = this.formatDate(inspection.scheduledAt);
    const metadataLine1 = kind === 'checklist'
      ? `Checklist · ${template?.name ?? inspectionType?.name ?? 'Checklist normativo'}${template?.code ? ` - ${template.code}` : ''}`
      : `${inspectionType?.name ?? 'Hallazgo'} · ${scheduledDate ?? 'Sin fecha'} · ${this.resolveLocationLabel(inspection, maps)}`;
    const metadataLine2 = kind === 'checklist'
      ? `${scheduledDate ?? 'Sin fecha'} · ${this.resolveLocationLabel(inspection, maps)}`
      : inspection.description ?? 'Tipo de hallazgo: sin clasificación';

    return {
      header: {
        inspectionId: inspection.id,
        inspectionNumber: this.resolveInspectionNumber(inspection),
        title: inspection.title,
        kind,
        inspectionType: inspectionType?.code ?? kind,
        metadataLine1,
        metadataLine2,
        progressPercent,
        counts,
      },
      findings: groups,
      followups: followups.map((followup) => this.toFollowupResponse(followup, maps)),
      general: this.toGeneralResponse(inspection, template, maps, generalEvidence, findingItems),
      checklistResult,
    };
  }

  private async getInspectionOrThrow(id: string): Promise<InspectionEntity> {
    const inspection = await this.inspections.findOneBy({ id });
    if (!inspection) throw new NotFoundException(`Inspection ${id} not found`);
    return inspection;
  }

  private async loadChecklistResult(
    inspectionId: string,
    templateId: string | null,
    maps: EntityNameMaps,
  ): Promise<InspectionDetailChecklistResultResponse> {
    const answers = await this.checklistAnswers.find({
      where: { inspectionId },
      order: { createdAt: 'ASC' },
    });
    const answerByItem = new Map(answers.map((answer) => [answer.checklistItemId, answer]));

    let sections: InspectionFormSectionEntity[] = [];
    let items: InspectionFormItemEntity[] = [];
    if (templateId) {
      sections = await this.checklistSections.find({
        where: { templateId },
        order: { sortOrder: 'ASC' },
      });
      const sectionIds = sections.map((section) => section.id);
      items = sectionIds.length
        ? await this.checklistItems.find({
            where: { sectionId: In(sectionIds) },
            order: { sortOrder: 'ASC' },
          })
        : [];
    } else if (answers.length) {
      const itemIds = answers.map((answer) => answer.checklistItemId);
      items = await this.checklistItems.find({ where: { id: In(itemIds) }, order: { sortOrder: 'ASC' } });
      const sectionIds = Array.from(new Set(items.map((item) => item.sectionId)));
      sections = sectionIds.length
        ? await this.checklistSections.find({ where: { id: In(sectionIds) }, order: { sortOrder: 'ASC' } })
        : [];
    }

    const sectionPayload = sections.map((section) => ({
      sectionId: section.id,
      code: section.code,
      title: section.title,
      description: section.description,
      sortOrder: section.sortOrder,
      items: items
        .filter((item) => item.sectionId === section.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => {
          const answer = answerByItem.get(item.id);
          return {
            checklistItemId: item.id,
            code: item.code,
            question: item.question,
            guidance: item.guidance,
            responseType: item.responseType,
            isRequired: item.isRequired,
            sortOrder: item.sortOrder,
            weight: item.weight,
            answer: answer ? this.toChecklistAnswer(answer, maps) : null,
          };
        }),
    }));

    const summary = sectionPayload
      .flatMap((section) => section.items)
      .reduce<InspectionDetailChecklistSummaryResponse>((result, item) => {
        result.total += 1;
        const value = item.answer?.value ?? null;
        if (value === null) {
          result.unanswered += 1;
          return result;
        }
        result.answered += 1;
        if (value === InspectionAnswerValue.COMPLIANT) result.compliant += 1;
        else if (value === InspectionAnswerValue.NOT_COMPLIANT) result.notCompliant += 1;
        else if (value === InspectionAnswerValue.NOT_APPLICABLE) result.notApplicable += 1;
        else if (value === InspectionAnswerValue.PARTIAL) result.partial += 1;
        else if (value === InspectionAnswerValue.NOT_OBSERVED) result.notObserved += 1;
        return result;
      }, {
        total: 0,
        answered: 0,
        compliant: 0,
        notCompliant: 0,
        notApplicable: 0,
        partial: 0,
        notObserved: 0,
        unanswered: 0,
      });

    return { summary, sections: sectionPayload };
  }

  private toChecklistAnswer(
    answer: InspectionItemResponseEntity,
    maps: EntityNameMaps,
  ): InspectionDetailChecklistAnswerResponse {
    const answeredBy = answer.answeredByUserId ? maps.users.get(answer.answeredByUserId) : null;
    return {
      value: answer.answerValue,
      text: answer.answerText,
      numericValue: answer.numericValue,
      notes: answer.notes,
      answeredAt: this.toNullableIsoString(answer.answeredAt),
      answeredByUserId: answer.answeredByUserId,
      answeredByName: answeredBy ? this.userFullName(answeredBy) : null,
    };
  }

  private async loadNameMaps(): Promise<EntityNameMaps> {
    const [areas, companies, sectors, users] = await Promise.all([
      this.areas.find(),
      this.companies.find(),
      this.sectors.find(),
      this.users.find(),
    ]);
    return {
      areas: new Map(areas.map((area) => [area.id, area.name])),
      companies: new Map(companies.map((company) => [company.id, company.name])),
      sectors: new Map(sectors.map((sector) => [sector.id, sector.name])),
      users: new Map(users.map((user) => [user.id, user])),
    };
  }

  private async loadEvidenceByFinding(findingIds: string[]): Promise<Map<string, EvidenceResponse[]>> {
    const entries = await Promise.all(
      findingIds.map(async (findingId) => [
        findingId,
        await this.evidencesService.findAll('inspection_finding', findingId),
      ] as const),
    );
    return new Map(entries);
  }

  private groupResponsibleIds(rows: InspectionFindingResponsibleEntity[]): Map<string, string[]> {
    const byFinding = new Map<string, string[]>();
    rows.forEach((row) => {
      const current = byFinding.get(row.findingId) ?? [];
      current.push(row.userId);
      byFinding.set(row.findingId, current);
    });
    return byFinding;
  }

  private toFindingItem(
    finding: InspectionFindingEntity,
    index: number,
    responsibleIds: string[],
    maps: EntityNameMaps,
    evidences: EvidenceResponse[],
    currentUserId: string | null,
  ): InspectionDetailFindingItemResponse {
    const statusGroup = this.resolveStatusGroup(finding.status);
    return {
      findingId: finding.id,
      checklistItemId: finding.checklistItemId,
      title: finding.title || `Obs. ${index + 1}`,
      condition: finding.detectedCondition ?? finding.description,
      proposedCorrectiveAction: finding.proposedCorrectiveAction,
      executedActionDescription: finding.executedActionDescription,
      rejectionReason: finding.rejectionReason,
      severity: finding.severity,
      severityLabel: this.severityLabel(finding.severity),
      status: finding.status,
      statusGroup,
      responsibleCompanyId: finding.responsibleCompanyId,
      responsibleCompanyName: finding.responsibleCompanyId
        ? maps.companies.get(finding.responsibleCompanyId) ?? null
        : null,
      responsibleUsers: responsibleIds
        .map((userId) => this.toResponsibleResponse(userId, maps, currentUserId))
        .filter((user): user is InspectionDetailResponsibleResponse => Boolean(user)),
      dueAt: this.toNullableIsoString(finding.dueAt),
      executedAt: this.toNullableIsoString(finding.executedAt),
      closedAt: this.toNullableIsoString(finding.closedAt),
      rejectedAt: this.toNullableIsoString(finding.rejectedAt),
      beforeEvidence: this.filterEvidence(evidences, InspectionEvidenceRelationType.BEFORE_PHOTO),
      afterEvidence: this.filterEvidence(evidences, InspectionEvidenceRelationType.AFTER_PHOTO),
    };
  }

  private toFollowupResponse(
    followup: InspectionFollowupEntity,
    maps: EntityNameMaps,
  ): InspectionDetailFollowupResponse {
    const user = followup.performedByUserId ? maps.users.get(followup.performedByUserId) : null;
    return {
      followupId: followup.id,
      findingId: followup.findingId,
      sequenceNumber: followup.sequenceNumber,
      title: `Seguimiento ${followup.sequenceNumber}`,
      description: followup.description,
      performedAt: this.toNullableIsoString(followup.performedAt),
      performedByUserId: followup.performedByUserId,
      performedByName: user ? this.userFullName(user) : null,
      completed: Boolean(followup.performedAt),
    };
  }

  private toGeneralResponse(
    inspection: InspectionEntity,
    template: InspectionFormTemplateEntity | null,
    maps: EntityNameMaps,
    generalEvidence: EvidenceResponse[],
    findings: InspectionDetailFindingItemResponse[],
  ): InspectionDetailGeneralResponse {
    const inspector = inspection.inspectorId ? maps.users.get(inspection.inspectorId) : null;
    const inspectorCompanyName = inspector?.companyId
      ? maps.companies.get(inspector.companyId) ?? null
      : null;
    const responsibles = new Map<ID, InspectionDetailResponsibleResponse>();
    findings.forEach((finding) => finding.responsibleUsers.forEach((responsible) => {
      responsibles.set(responsible.userId, responsible);
    }));
    return {
      inspectorName: inspector ? this.userFullName(inspector) : null,
      inspectorCompanyName,
      areaName: inspection.areaId ? maps.areas.get(inspection.areaId) ?? null : null,
      sectorName: inspection.sectorId ? maps.sectors.get(inspection.sectorId) ?? null : null,
      companyName: inspection.companyId ? maps.companies.get(inspection.companyId) ?? null : null,
      templateName: template?.name ?? null,
      templateCode: template?.code ?? null,
      scheduledAt: this.toNullableIsoString(inspection.scheduledAt),
      locationLabel: this.resolveLocationLabel(inspection, maps),
      latitude: inspection.latitude,
      longitude: inspection.longitude,
      generalEvidence: generalEvidence.map((evidence) => this.toDetailEvidence(evidence)),
      responsibles: Array.from(responsibles.values()),
    };
  }

  private groupFindings(
    items: InspectionDetailFindingItemResponse[],
  ): Record<InspectionDetailFindingGroupKey, InspectionDetailFindingItemResponse[]> {
    return items.reduce<Record<InspectionDetailFindingGroupKey, InspectionDetailFindingItemResponse[]>>(
      (groups, item) => {
        groups[item.statusGroup].push(item);
        return groups;
      },
      { executed: [], open: [], closed: [], rejected: [] },
    );
  }

  private countFindingGroups(
    items: InspectionDetailFindingItemResponse[],
  ): Record<InspectionDetailFindingGroupKey, number> {
    return items.reduce<Record<InspectionDetailFindingGroupKey, number>>(
      (counts, item) => {
        counts[item.statusGroup] += 1;
        return counts;
      },
      { executed: 0, open: 0, closed: 0, rejected: 0 },
    );
  }

  private resolveStatusGroup(status: InspectionFindingStatus): InspectionDetailFindingGroupKey {
    if (status === InspectionFindingStatus.IN_PROGRESS) return 'executed';
    if (status === InspectionFindingStatus.CLOSED) return 'closed';
    if (status === InspectionFindingStatus.REJECTED) return 'rejected';
    return 'open';
  }

  private resolveKind(
    type: InspectionTypeEntity | null,
    template: InspectionFormTemplateEntity | null,
  ): 'finding' | 'checklist' {
    if (template) return 'checklist';
    if (type?.code === InspectionType.REGULATORY) return 'checklist';
    return 'finding';
  }

  private resolveInspectionNumber(inspection: InspectionEntity): string {
    const match = inspection.title.match(/#?(\d+)/);
    return match?.[1] ?? inspection.id.slice(0, 8).toUpperCase();
  }

  private resolveLocationLabel(inspection: InspectionEntity, maps: EntityNameMaps): string {
    const area = inspection.areaId ? maps.areas.get(inspection.areaId) : null;
    const sector = inspection.sectorId ? maps.sectors.get(inspection.sectorId) : null;
    if (area && sector) return `${area} · ${sector}`;
    return area ?? sector ?? 'Sin ubicación';
  }

  private toResponsibleResponse(
    userId: string,
    maps: EntityNameMaps,
    currentUserId: string | null,
  ): InspectionDetailResponsibleResponse | null {
    const user = maps.users.get(userId);
    if (!user) return null;
    return {
      userId: user.id,
      fullName: this.userFullName(user),
      position: user.position,
      companyId: user.companyId,
      companyName: user.companyId ? maps.companies.get(user.companyId) ?? null : null,
      currentUser: user.id === currentUserId,
    };
  }

  private filterEvidence(
    evidences: EvidenceResponse[],
    relationType: InspectionEvidenceRelationType,
  ): InspectionDetailEvidenceResponse[] {
    return evidences
      .filter((evidence) => evidence.links.some((link) => link.relationType === relationType))
      .map((evidence) => this.toDetailEvidence(evidence, relationType));
  }

  private toDetailEvidence(
    evidence: EvidenceResponse,
    relationType?: InspectionEvidenceRelationType,
  ): InspectionDetailEvidenceResponse {
    const link = relationType
      ? evidence.links.find((item) => item.relationType === relationType)
      : evidence.links[0];
    return {
      evidenceId: evidence.id,
      fileId: evidence.fileId,
      title: evidence.title,
      description: evidence.description,
      relationType: link?.relationType ?? null,
      capturedAt: evidence.capturedAt,
      url: evidence.fileId ? `/api/files/${evidence.fileId}/content` : null,
    };
  }

  private severityLabel(severity: InspectionFindingSeverity): string {
    if (severity === InspectionFindingSeverity.CRITICAL) return 'Crítico';
    if (severity === InspectionFindingSeverity.HIGH) return 'Alto';
    if (severity === InspectionFindingSeverity.MEDIUM) return 'Moderado';
    return 'Menor';
  }

  private formatDate(value: Date | null): string | null {
    if (!value) return null;
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${value.getFullYear()}`;
  }

  private userFullName(user: UserEntity): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  private toNullableIsoString(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }
}
