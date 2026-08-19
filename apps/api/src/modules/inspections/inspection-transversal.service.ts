import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentResponse, EvidenceLinkResponse, EvidenceResponse, InspectionFindingStatus } from '@aurelia/contracts';
import { In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CommentsService } from '../comments/comments.service';
import { EvidencesService } from '../evidences/evidences.service';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { InspectionDetailReportPdfService } from '../reports/inspection-detail-report-pdf.service';
import { UserEntity } from '../users/entities/user.entity';
import { CreateInspectionCommentDto } from './dto/create-inspection-comment.dto';
import { LinkInspectionEvidenceDto } from './dto/link-inspection-evidence.dto';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionFollowupEntity } from './entities/inspection-followup.entity';
import { InspectionFormItemEntity } from './entities/inspection-form-item.entity';
import { InspectionFormSectionEntity } from './entities/inspection-form-section.entity';
import { InspectionFormTemplateEntity } from './entities/inspection-form-template.entity';
import { InspectionItemResponseEntity } from './entities/inspection-item-response.entity';
import { InspectionTypeEntity } from './entities/inspection-type.entity';
import { InspectionEntity } from './entities/inspection.entity';

interface RelatedEvidenceGroup {
  entityId: string;
  evidences: EvidenceResponse[];
}

interface RelatedInspectionEvidences {
  inspection: EvidenceResponse[];
  findings: RelatedEvidenceGroup[];
  followups: RelatedEvidenceGroup[];
  all: EvidenceResponse[];
}

export interface InspectionExportPdfResult {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class InspectionTransversalService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFormTemplateEntity)
    private readonly templates: Repository<InspectionFormTemplateEntity>,
    @InjectRepository(InspectionFormSectionEntity)
    private readonly sections: Repository<InspectionFormSectionEntity>,
    @InjectRepository(InspectionFormItemEntity)
    private readonly items: Repository<InspectionFormItemEntity>,
    @InjectRepository(InspectionItemResponseEntity)
    private readonly answers: Repository<InspectionItemResponseEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFollowupEntity)
    private readonly followups: Repository<InspectionFollowupEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectors: Repository<SectorEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InspectionTypeEntity)
    private readonly inspectionTypes: Repository<InspectionTypeEntity>,
    private readonly evidencesService: EvidencesService,
    private readonly commentsService: CommentsService,
    private readonly auditService: AuditService,
    private readonly inspectionDetailReportPdf: InspectionDetailReportPdfService,
  ) {}

  async findEvidences(inspectionId: string): Promise<EvidenceResponse[]> {
    await this.getInspectionOrThrow(inspectionId);
    const findings = await this.findings.find({ where: { inspectionId }, select: { id: true } });
    const findingIds = findings.map((finding) => finding.id);
    const followups = findingIds.length
      ? await this.followups.find({ where: { findingId: In(findingIds) }, select: { id: true } })
      : [];
    const relatedEvidences = await this.collectRelatedEvidences(
      inspectionId,
      findingIds,
      followups.map((followup) => followup.id),
    );
    return relatedEvidences.all;
  }

  async linkEvidence(inspectionId: string, evidenceId: string, dto: LinkInspectionEvidenceDto, actorId: string | null): Promise<EvidenceLinkResponse> {
    await this.getInspectionOrThrow(inspectionId);
    const result = await this.evidencesService.link(evidenceId, {
      entityType: 'inspection',
      entityId: inspectionId,
      relationType: dto.relationType ?? 'inspection_evidence',
    });
    await this.logAudit('inspection.evidence.linked', 'inspection', inspectionId, actorId, undefined, { evidenceId, relationType: result.relationType });
    return result;
  }

  async findComments(inspectionId: string): Promise<CommentResponse[]> {
    await this.getInspectionOrThrow(inspectionId);
    return this.commentsService.findAll('inspection', inspectionId);
  }

  async createComment(inspectionId: string, dto: CreateInspectionCommentDto, actorId: string | null): Promise<CommentResponse> {
    await this.getInspectionOrThrow(inspectionId);
    const result = await this.commentsService.create({
      entityType: 'inspection',
      entityId: inspectionId,
      body: dto.body,
      isInternal: dto.isInternal,
      authorUserId: dto.authorUserId ?? actorId ?? undefined,
    });
    await this.logAudit('inspection.comment.created', 'inspection', inspectionId, actorId, undefined, { commentId: result.id, isInternal: result.isInternal });
    return result;
  }

  async getExportPayload(inspectionId: string): Promise<Record<string, unknown>> {
    const inspection = await this.getInspectionOrThrow(inspectionId);
    const template = inspection.templateId ? await this.templates.findOneBy({ id: inspection.templateId }) : null;
    const sections = template
      ? await this.sections.find({ where: { templateId: template.id }, order: { sortOrder: 'ASC' } })
      : [];
    const sectionIds = sections.map((section) => section.id);
    const items = sectionIds.length
      ? await this.items.find({ where: { sectionId: In(sectionIds) }, order: { sortOrder: 'ASC' } })
      : [];
    const answers = await this.answers.find({ where: { inspectionId }, order: { createdAt: 'ASC' } });
    const findings = await this.findings.find({ where: { inspectionId }, order: { createdAt: 'ASC' } });
    const findingIds = findings.map((finding) => finding.id);
    const followups = findingIds.length
      ? await this.followups.find({ where: { findingId: In(findingIds) }, order: { sequenceNumber: 'ASC' } })
      : [];
    const [relatedEvidences, comments, companies, areas, sectors, users, inspectionTypes] = await Promise.all([
      this.collectRelatedEvidences(
        inspectionId,
        findingIds,
        followups.map((followup) => followup.id),
      ),
      this.commentsService.findAll('inspection', inspectionId),
      this.companies.find(),
      this.areas.find(),
      this.sectors.find(),
      this.users.find(),
      this.inspectionTypes.find(),
    ]);
    const evidencesByFinding = new Map(relatedEvidences.findings.map((group) => [group.entityId, group.evidences]));
    const evidencesByFollowup = new Map(relatedEvidences.followups.map((group) => [group.entityId, group.evidences]));
    const companyById = new Map(companies.map((company) => [company.id, company]));
    const areaById = new Map(areas.map((area) => [area.id, area]));
    const sectorById = new Map(sectors.map((sector) => [sector.id, sector]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const inspectionTypeById = new Map(inspectionTypes.map((type) => [type.id, type]));
    const closedFindingsCount = findings.filter((finding) => finding.status === InspectionFindingStatus.CLOSED).length;
    const openFindingsCount = findings.filter((finding) => finding.status === InspectionFindingStatus.OPEN).length;
    const executedFindingsCount = findings.filter((finding) => finding.status === InspectionFindingStatus.IN_PROGRESS).length;
    const rejectedFindingsCount = findings.filter((finding) => finding.status === InspectionFindingStatus.REJECTED).length;

    return {
      generatedAt: new Date().toISOString(),
      inspection: this.toInspectionExport(
        inspection,
        companyById,
        areaById,
        sectorById,
        userById,
        inspectionTypeById,
      ),
      checklist: {
        template,
        sections: sections.map((section) => ({
          ...section,
          items: items.filter((item) => item.sectionId === section.id),
        })),
      },
      answers,
      findings: findings.map((finding, index) => ({
        ...finding,
        observationNumber: index + 1,
        responsibleCompanyName: this.companyName(finding.responsibleCompanyId, companyById),
        ownerUserName: this.userName(finding.ownerUserId, userById),
        createdByUserName: this.userName(finding.createdByUserId, userById),
        executedByUserName: this.userName(finding.executedByUserId, userById),
        closedByUserName: this.userName(finding.closedByUserId, userById),
        rejectedByUserName: this.userName(finding.rejectedByUserId, userById),
        evidences: evidencesByFinding.get(finding.id) ?? [],
        followups: followups
          .filter((followup) => followup.findingId === finding.id)
          .map((followup) => ({
            ...followup,
            performedByUserName: this.userName(followup.performedByUserId, userById),
            evidences: evidencesByFollowup.get(followup.id) ?? [],
          })),
      })),
      evidences: relatedEvidences.all,
      evidenceGroups: {
        inspection: relatedEvidences.inspection,
        findings: relatedEvidences.findings,
        followups: relatedEvidences.followups,
      },
      comments,
      summary: {
        answersCount: answers.length,
        findingsCount: findings.length,
        openFindingsCount,
        executedFindingsCount,
        closedFindingsCount,
        rejectedFindingsCount,
        closureRate: findings.length > 0 ? Number(((closedFindingsCount / findings.length) * 100).toFixed(2)) : 0,
        evidencesCount: relatedEvidences.all.length,
        commentsCount: comments.length,
      },
    };
  }

  async getExportPdf(inspectionId: string): Promise<InspectionExportPdfResult> {
    const payload = await this.getExportPayload(inspectionId);
    const inspection = payload.inspection as Record<string, unknown>;
    const inspectionNumber = typeof inspection.inspectionNumber === 'string' ? inspection.inspectionNumber : inspectionId;
    return {
      buffer: await this.inspectionDetailReportPdf.render(payload),
      filename: `inspection-${this.sanitizeFilename(inspectionNumber)}.pdf`,
    };
  }

  private async collectRelatedEvidences(
    inspectionId: string,
    findingIds: string[],
    followupIds: string[],
  ): Promise<RelatedInspectionEvidences> {
    const inspectionEvidences = await this.evidencesService.findAll('inspection', inspectionId);
    const findingGroups = await Promise.all(
      findingIds.map(async (findingId) => ({
        entityId: findingId,
        evidences: await this.evidencesService.findAll('inspection_finding', findingId),
      })),
    );
    const followupGroups = await Promise.all(
      followupIds.map(async (followupId) => ({
        entityId: followupId,
        evidences: await this.evidencesService.findAll('inspection_followup', followupId),
      })),
    );

    return {
      inspection: inspectionEvidences,
      findings: findingGroups,
      followups: followupGroups,
      all: [
        ...inspectionEvidences,
        ...findingGroups.flatMap((group) => group.evidences),
        ...followupGroups.flatMap((group) => group.evidences),
      ],
    };
  }

  private async getInspectionOrThrow(id: string): Promise<InspectionEntity> {
    const inspection = await this.inspections.findOneBy({ id });
    if (!inspection) throw new NotFoundException(`Inspection ${id} not found`);
    return inspection;
  }

  private toInspectionExport(
    entity: InspectionEntity,
    companies: Map<string, CompanyEntity>,
    areas: Map<string, AreaEntity>,
    sectors: Map<string, SectorEntity>,
    users: Map<string, UserEntity>,
    inspectionTypes: Map<string, InspectionTypeEntity>,
  ): Record<string, unknown> {
    const inspector = entity.inspectorId ? users.get(entity.inspectorId) : null;
    const company = entity.companyId ? companies.get(entity.companyId) : null;
    const area = entity.areaId ? areas.get(entity.areaId) : null;
    const sector = entity.sectorId ? sectors.get(entity.sectorId) : null;
    const inspectionType = inspectionTypes.get(entity.inspectionTypeId);
    return {
      id: entity.id,
      inspectionNumber: this.resolveInspectionNumber(entity),
      inspectionTypeId: entity.inspectionTypeId,
      inspectionTypeName: inspectionType?.name ?? null,
      templateId: entity.templateId,
      companyId: entity.companyId,
      companyName: company?.name ?? null,
      areaId: entity.areaId,
      areaName: area?.name ?? null,
      sectorId: entity.sectorId,
      sectorName: sector?.name ?? null,
      locationId: entity.locationId,
      locationLabel: [area?.name, sector?.name].filter(Boolean).join(' · ') || null,
      inspectorId: entity.inspectorId,
      inspectorName: inspector ? this.formatUserName(inspector) : null,
      inspectorCompanyName: inspector?.companyId ? companies.get(inspector.companyId)?.name ?? null : null,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      scheduledAt: this.toNullableIsoString(entity.scheduledAt),
      startedAt: this.toNullableIsoString(entity.startedAt),
      completedAt: this.toNullableIsoString(entity.completedAt),
      closedAt: this.toNullableIsoString(entity.closedAt),
      latitude: entity.latitude,
      longitude: entity.longitude,
      score: entity.score,
      findingsCount: entity.findingsCount,
      openFindingsCount: entity.openFindingsCount,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private companyName(id: string | null, companies: Map<string, CompanyEntity>): string | null {
    return id ? companies.get(id)?.name ?? null : null;
  }

  private userName(id: string | null, users: Map<string, UserEntity>): string | null {
    const user = id ? users.get(id) : null;
    return user ? this.formatUserName(user) : null;
  }

  private formatUserName(user: UserEntity): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  private resolveInspectionNumber(entity: InspectionEntity): string {
    return entity.title.match(/#?(\d+)/)?.[1] ?? entity.id.slice(0, 8);
  }

  private sanitizeFilename(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  private async logAudit(
    action: string,
    entityType: string,
    entityId: string,
    actorId: string | null,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      action,
      entityType,
      entityId,
      actorUserId: actorId ?? undefined,
      oldValue,
      newValue,
    });
  }

  private toNullableIsoString(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }
}
