import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  IncidentActionPlanResponse,
  IncidentActionPlanStatus,
  IncidentDashboardSummaryResponse,
  IncidentFiveWhyAnalysisResponse,
  IncidentFlashReportResponse,
  IncidentImmediateActionResponse,
  IncidentInvestigationResponse,
  IncidentLevelResponse,
  IncidentPeepoAnalysisResponse,
  IncidentResponse,
  IncidentStatus,
  IncidentTypeResponse,
} from '@aurelia/contracts';
import { IncidentActionPlanEntity } from './entities/incident-action-plan.entity';
import { IncidentFiveWhyAnalysisEntity } from './entities/incident-five-why-analysis.entity';
import { IncidentFlashReportEntity } from './entities/incident-flash-report.entity';
import { IncidentImmediateActionEntity } from './entities/incident-immediate-action.entity';
import { IncidentInvestigationEntity } from './entities/incident-investigation.entity';
import { IncidentLevelEntity } from './entities/incident-level.entity';
import { IncidentPeepoAnalysisEntity } from './entities/incident-peepo-analysis.entity';
import { IncidentStatusHistoryEntity } from './entities/incident-status-history.entity';
import { IncidentTypeEntity } from './entities/incident-type.entity';
import { IncidentEntity } from './entities/incident.entity';
import { CreateIncidentFlashReportDto } from './dto/create-incident-flash-report.dto';
import { CreateIncidentImmediateActionDto, UpdateIncidentImmediateActionDto } from './dto/create-incident-immediate-action.dto';
import {
  CloseIncidentDto,
  CreateIncidentActionPlanDto,
  CreateIncidentInvestigationDto,
  UpdateIncidentActionPlanDto,
  UpdateIncidentInvestigationDto,
  UpsertIncidentFiveWhyAnalysisDto,
  UpsertIncidentPeepoAnalysisDto,
} from './dto/create-incident-investigation.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidents: Repository<IncidentEntity>,
    @InjectRepository(IncidentTypeEntity)
    private readonly incidentTypes: Repository<IncidentTypeEntity>,
    @InjectRepository(IncidentLevelEntity)
    private readonly incidentLevels: Repository<IncidentLevelEntity>,
    @InjectRepository(IncidentFlashReportEntity)
    private readonly flashReports: Repository<IncidentFlashReportEntity>,
    @InjectRepository(IncidentImmediateActionEntity)
    private readonly immediateActions: Repository<IncidentImmediateActionEntity>,
    @InjectRepository(IncidentInvestigationEntity)
    private readonly investigations: Repository<IncidentInvestigationEntity>,
    @InjectRepository(IncidentFiveWhyAnalysisEntity)
    private readonly fiveWhyAnalyses: Repository<IncidentFiveWhyAnalysisEntity>,
    @InjectRepository(IncidentPeepoAnalysisEntity)
    private readonly peepoAnalyses: Repository<IncidentPeepoAnalysisEntity>,
    @InjectRepository(IncidentActionPlanEntity)
    private readonly actionPlans: Repository<IncidentActionPlanEntity>,
    @InjectRepository(IncidentStatusHistoryEntity)
    private readonly statusHistory: Repository<IncidentStatusHistoryEntity>,
  ) {}

  async findTypes(): Promise<IncidentTypeResponse[]> {
    const rows = await this.incidentTypes.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.toTypeResponse(row));
  }

  async findLevels(): Promise<IncidentLevelResponse[]> {
    const rows = await this.incidentLevels.find({ order: { levelNumber: 'ASC' } });
    return rows.map((row) => this.toLevelResponse(row));
  }

  async findAll(filters: {
    status?: string;
    incidentTypeId?: string;
    incidentLevelId?: string;
  } = {}): Promise<IncidentResponse[]> {
    const where: FindOptionsWhere<IncidentEntity> = {};
    if (filters.status) where.status = filters.status as IncidentStatus;
    if (filters.incidentTypeId) where.incidentTypeId = filters.incidentTypeId;
    if (filters.incidentLevelId) where.incidentLevelId = filters.incidentLevelId;

    const rows = await this.incidents.find({ where, order: { reportedAt: 'DESC' } });
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(id: string): Promise<IncidentResponse> {
    const entity = await this.getIncidentOrFail(id);
    return this.toResponse(entity);
  }

  async create(dto: CreateIncidentDto): Promise<IncidentResponse> {
    await this.getTypeOrFail(dto.incidentTypeId);
    const level = await this.getLevelOrFail(dto.incidentLevelId);
    const reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : new Date();
    const occurredAt = new Date(dto.occurredAt);
    const entity = this.incidents.create({
      incidentTypeId: dto.incidentTypeId,
      incidentLevelId: dto.incidentLevelId,
      companyId: dto.companyId ?? null,
      areaId: dto.areaId ?? null,
      sectorId: dto.sectorId ?? null,
      locationId: dto.locationId ?? null,
      reportedByUserId: dto.reportedByUserId ?? null,
      title: dto.title,
      description: dto.description,
      status: IncidentStatus.REPORTED,
      occurredAt,
      reportedAt,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      immediateResponseSummary: dto.immediateResponseSummary ?? null,
      environmentalImpactSummary: dto.environmentalImpactSummary ?? null,
      slaDueAt: this.calculateSlaDueAt(occurredAt, level.slaHours),
      closedAt: null,
      closedByUserId: null,
    });
    const saved = await this.incidents.save(entity);
    await this.appendStatusHistory(saved.id, null, saved.status, saved.reportedByUserId, 'Incident reported', {
      source: 'incident.create',
    });
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<IncidentResponse> {
    const entity = await this.getIncidentOrFail(id);
    const shouldRecalculateSla = dto.incidentLevelId !== undefined || dto.occurredAt !== undefined;

    if (dto.incidentTypeId !== undefined) {
      await this.getTypeOrFail(dto.incidentTypeId);
      entity.incidentTypeId = dto.incidentTypeId;
    }
    if (dto.incidentLevelId !== undefined) {
      await this.getLevelOrFail(dto.incidentLevelId);
      entity.incidentLevelId = dto.incidentLevelId;
    }
    if (dto.companyId !== undefined) entity.companyId = dto.companyId;
    if (dto.areaId !== undefined) entity.areaId = dto.areaId;
    if (dto.sectorId !== undefined) entity.sectorId = dto.sectorId;
    if (dto.locationId !== undefined) entity.locationId = dto.locationId;
    if (dto.reportedByUserId !== undefined) entity.reportedByUserId = dto.reportedByUserId;
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.occurredAt !== undefined) entity.occurredAt = new Date(dto.occurredAt);
    if (dto.reportedAt !== undefined) entity.reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : new Date();
    if (dto.latitude !== undefined) entity.latitude = dto.latitude;
    if (dto.longitude !== undefined) entity.longitude = dto.longitude;
    if (dto.immediateResponseSummary !== undefined) entity.immediateResponseSummary = dto.immediateResponseSummary;
    if (dto.environmentalImpactSummary !== undefined) entity.environmentalImpactSummary = dto.environmentalImpactSummary;
    if (shouldRecalculateSla) {
      const level = await this.getLevelOrFail(entity.incidentLevelId);
      entity.slaDueAt = this.calculateSlaDueAt(entity.occurredAt, level.slaHours);
    }

    const saved = await this.incidents.save(entity);
    return this.toResponse(saved);
  }

  async updateStatus(id: string, dto: UpdateIncidentStatusDto): Promise<IncidentResponse> {
    const entity = await this.getIncidentOrFail(id);
    const previousStatus = entity.status;
    entity.status = dto.status;

    if (dto.status === IncidentStatus.CLOSED) {
      entity.closedAt = new Date();
      entity.closedByUserId = dto.changedByUserId ?? null;
    }

    const saved = await this.incidents.save(entity);
    if (previousStatus !== saved.status) {
      await this.appendStatusHistory(saved.id, previousStatus, saved.status, dto.changedByUserId ?? null, dto.comment ?? null, {
        source: 'incident.status.update',
      });
    }
    return this.toResponse(saved);
  }

  async close(id: string, dto: CloseIncidentDto): Promise<IncidentResponse> {
    const blockingActions = await this.actionPlans.count({
      where: { incidentId: id, status: In([IncidentActionPlanStatus.OPEN, IncidentActionPlanStatus.IN_PROGRESS]) },
    });
    if (blockingActions > 0) throw new BadRequestException('Incident has open or in-progress action plans');
    return this.updateStatus(id, {
      status: IncidentStatus.CLOSED,
      changedByUserId: dto.closedByUserId ?? undefined,
      comment: dto.comment ?? undefined,
    });
  }

  async upsertFlashReport(id: string, dto: CreateIncidentFlashReportDto): Promise<IncidentFlashReportResponse> {
    await this.getIncidentOrFail(id);
    const existing = await this.flashReports.findOne({ where: { incidentId: id } });
    const entity = existing ?? this.flashReports.create({ incidentId: id });

    entity.summary = dto.summary;
    entity.immediateCauses = dto.immediateCauses ?? null;
    entity.affectedComponents = dto.affectedComponents ?? null;
    entity.potentialImpact = dto.potentialImpact ?? null;
    entity.reporterName = dto.reporterName ?? null;
    entity.generatedAt = new Date();

    const saved = await this.flashReports.save(entity);
    return this.toFlashReportResponse(saved);
  }

  async findFlashReport(id: string): Promise<IncidentFlashReportResponse> {
    await this.getIncidentOrFail(id);
    const entity = await this.flashReports.findOne({ where: { incidentId: id } });
    if (!entity) throw new NotFoundException('Incident flash report not found');
    return this.toFlashReportResponse(entity);
  }

  async findImmediateActions(id: string): Promise<IncidentImmediateActionResponse[]> {
    await this.getIncidentOrFail(id);
    const rows = await this.immediateActions.find({ where: { incidentId: id }, order: { createdAt: 'ASC' } });
    return rows.map((row) => this.toImmediateActionResponse(row));
  }

  async createImmediateAction(id: string, dto: CreateIncidentImmediateActionDto): Promise<IncidentImmediateActionResponse> {
    await this.getIncidentOrFail(id);
    const saved = await this.immediateActions.save(
      this.immediateActions.create({
        incidentId: id,
        description: dto.description,
        status: dto.status ?? IncidentActionPlanStatus.OPEN,
        performedByUserId: dto.performedByUserId ?? null,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : null,
      }),
    );
    return this.toImmediateActionResponse(saved);
  }

  async updateImmediateAction(actionId: string, dto: UpdateIncidentImmediateActionDto): Promise<IncidentImmediateActionResponse> {
    const entity = await this.getImmediateActionOrFail(actionId);
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.performedByUserId !== undefined) entity.performedByUserId = dto.performedByUserId;
    if (dto.performedAt !== undefined) entity.performedAt = dto.performedAt ? new Date(dto.performedAt) : null;
    const saved = await this.immediateActions.save(entity);
    return this.toImmediateActionResponse(saved);
  }

  async findInvestigations(id: string): Promise<IncidentInvestigationResponse[]> {
    await this.getIncidentOrFail(id);
    const rows = await this.investigations.find({ where: { incidentId: id }, order: { createdAt: 'ASC' } });
    return rows.map((row) => this.toInvestigationResponse(row));
  }

  async createInvestigation(id: string, dto: CreateIncidentInvestigationDto): Promise<IncidentInvestigationResponse> {
    await this.getIncidentOrFail(id);
    const saved = await this.investigations.save(
      this.investigations.create({
        incidentId: id,
        method: dto.method,
        title: dto.title,
        summary: dto.summary ?? null,
        status: 'open',
        leadUserId: dto.leadUserId ?? null,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        completedAt: null,
      }),
    );
    return this.toInvestigationResponse(saved);
  }

  async updateInvestigation(investigationId: string, dto: UpdateIncidentInvestigationDto): Promise<IncidentInvestigationResponse> {
    const entity = await this.getInvestigationOrFail(investigationId);
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.summary !== undefined) entity.summary = dto.summary;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.leadUserId !== undefined) entity.leadUserId = dto.leadUserId;
    if (dto.startedAt !== undefined) entity.startedAt = dto.startedAt ? new Date(dto.startedAt) : null;
    if (dto.completedAt !== undefined) entity.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    const saved = await this.investigations.save(entity);
    return this.toInvestigationResponse(saved);
  }

  async upsertFiveWhy(investigationId: string, dto: UpsertIncidentFiveWhyAnalysisDto): Promise<IncidentFiveWhyAnalysisResponse> {
    await this.getInvestigationOrFail(investigationId);
    const entity = (await this.fiveWhyAnalyses.findOne({ where: { investigationId } })) ?? this.fiveWhyAnalyses.create({ investigationId });
    entity.problemStatement = dto.problemStatement;
    entity.why1 = dto.why1 ?? null;
    entity.why2 = dto.why2 ?? null;
    entity.why3 = dto.why3 ?? null;
    entity.why4 = dto.why4 ?? null;
    entity.why5 = dto.why5 ?? null;
    entity.rootCause = dto.rootCause ?? null;
    const saved = await this.fiveWhyAnalyses.save(entity);
    return this.toFiveWhyResponse(saved);
  }

  async upsertPeepo(investigationId: string, dto: UpsertIncidentPeepoAnalysisDto): Promise<IncidentPeepoAnalysisResponse> {
    await this.getInvestigationOrFail(investigationId);
    const entity = (await this.peepoAnalyses.findOne({ where: { investigationId } })) ?? this.peepoAnalyses.create({ investigationId });
    entity.people = dto.people ?? null;
    entity.environment = dto.environment ?? null;
    entity.equipment = dto.equipment ?? null;
    entity.procedures = dto.procedures ?? null;
    entity.organization = dto.organization ?? null;
    const saved = await this.peepoAnalyses.save(entity);
    return this.toPeepoResponse(saved);
  }

  async findActionPlans(id: string): Promise<IncidentActionPlanResponse[]> {
    await this.getIncidentOrFail(id);
    const rows = await this.actionPlans.find({ where: { incidentId: id }, order: { createdAt: 'ASC' } });
    return rows.map((row) => this.toActionPlanResponse(row));
  }

  async createActionPlan(id: string, dto: CreateIncidentActionPlanDto): Promise<IncidentActionPlanResponse> {
    await this.getIncidentOrFail(id);
    if (dto.investigationId) {
      const investigation = await this.getInvestigationOrFail(dto.investigationId);
      if (investigation.incidentId !== id) throw new BadRequestException('Investigation does not belong to incident');
    }
    const saved = await this.actionPlans.save(
      this.actionPlans.create({
        incidentId: id,
        investigationId: dto.investigationId ?? null,
        title: dto.title,
        description: dto.description,
        ownerUserId: dto.ownerUserId ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        status: dto.status ?? IncidentActionPlanStatus.OPEN,
        completedAt: null,
        closedByUserId: null,
      }),
    );
    return this.toActionPlanResponse(saved);
  }

  async updateActionPlan(actionPlanId: string, dto: UpdateIncidentActionPlanDto): Promise<IncidentActionPlanResponse> {
    const entity = await this.getActionPlanOrFail(actionPlanId);
    if (dto.investigationId !== undefined) entity.investigationId = dto.investigationId;
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.ownerUserId !== undefined) entity.ownerUserId = dto.ownerUserId;
    if (dto.dueAt !== undefined) entity.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.completedAt !== undefined) entity.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    if (dto.closedByUserId !== undefined) entity.closedByUserId = dto.closedByUserId;
    if (entity.status === IncidentActionPlanStatus.COMPLETED && !entity.completedAt) entity.completedAt = new Date();
    const saved = await this.actionPlans.save(entity);
    return this.toActionPlanResponse(saved);
  }

  async dashboardSummary(): Promise<IncidentDashboardSummaryResponse> {
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const incidents = await this.incidents.find();
    const actionPlans = await this.actionPlans.find();
    const investigations = await this.investigations.find();
    const byStatus = this.countBy(incidents.map((incident) => incident.status));
    const actionByStatus = this.countBy(actionPlans.map((action) => action.status));
    const closed = byStatus[IncidentStatus.CLOSED] ?? 0;

    return {
      incidents: {
        total: incidents.length,
        byStatus,
        overdueSla: incidents.filter((incident) => incident.slaDueAt && incident.slaDueAt < now && incident.status !== IncidentStatus.CLOSED).length,
        dueSoonNext24Hours: incidents.filter(
          (incident) => incident.slaDueAt && incident.slaDueAt >= now && incident.slaDueAt <= next24 && incident.status !== IncidentStatus.CLOSED,
        ).length,
        closedRate: incidents.length === 0 ? 0 : Number(((closed / incidents.length) * 100).toFixed(2)),
      },
      actions: {
        total: actionPlans.length,
        byStatus: actionByStatus,
        overdue: actionPlans.filter(
          (action) => action.dueAt && action.dueAt < now && ![IncidentActionPlanStatus.COMPLETED, IncidentActionPlanStatus.CANCELLED].includes(action.status),
        ).length,
      },
      investigations: {
        total: investigations.length,
        open: investigations.filter((investigation) => investigation.status !== 'completed').length,
        completed: investigations.filter((investigation) => investigation.status === 'completed').length,
      },
    };
  }

  private async getIncidentOrFail(id: string): Promise<IncidentEntity> {
    const entity = await this.incidents.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Incident not found');
    return entity;
  }

  private async getTypeOrFail(id: string): Promise<IncidentTypeEntity> {
    const type = await this.incidentTypes.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Incident type not found');
    return type;
  }

  private async getLevelOrFail(id: string): Promise<IncidentLevelEntity> {
    const level = await this.incidentLevels.findOne({ where: { id } });
    if (!level) throw new NotFoundException('Incident level not found');
    return level;
  }

  private async getImmediateActionOrFail(id: string): Promise<IncidentImmediateActionEntity> {
    const entity = await this.immediateActions.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Incident immediate action not found');
    return entity;
  }

  private async getInvestigationOrFail(id: string): Promise<IncidentInvestigationEntity> {
    const entity = await this.investigations.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Incident investigation not found');
    return entity;
  }

  private async getActionPlanOrFail(id: string): Promise<IncidentActionPlanEntity> {
    const entity = await this.actionPlans.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Incident action plan not found');
    return entity;
  }

  private calculateSlaDueAt(baseDate: Date, slaHours: number): Date {
    return new Date(baseDate.getTime() + slaHours * 60 * 60 * 1000);
  }

  private countBy(values: string[]): Record<string, number> {
    return values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});
  }

  private async appendStatusHistory(
    incidentId: string,
    fromStatus: IncidentStatus | null,
    toStatus: IncidentStatus,
    changedByUserId: string | null,
    reason: string | null,
    metadata: Record<string, unknown> | null,
  ): Promise<void> {
    await this.statusHistory.save(
      this.statusHistory.create({
        incidentId,
        fromStatus,
        toStatus,
        changedByUserId,
        reason,
        metadata,
      }),
    );
  }

  private toTypeResponse(entity: IncidentTypeEntity): IncidentTypeResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toLevelResponse(entity: IncidentLevelEntity): IncidentLevelResponse {
    return {
      id: entity.id,
      code: entity.code,
      levelNumber: entity.levelNumber,
      name: entity.name,
      slaHours: entity.slaHours,
      requiresInvestigation: entity.requiresInvestigation,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toResponse(entity: IncidentEntity): IncidentResponse {
    return {
      id: entity.id,
      incidentTypeId: entity.incidentTypeId,
      incidentLevelId: entity.incidentLevelId,
      companyId: entity.companyId,
      areaId: entity.areaId,
      sectorId: entity.sectorId,
      locationId: entity.locationId,
      reportedByUserId: entity.reportedByUserId,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      occurredAt: entity.occurredAt.toISOString(),
      reportedAt: entity.reportedAt.toISOString(),
      latitude: entity.latitude,
      longitude: entity.longitude,
      immediateResponseSummary: entity.immediateResponseSummary,
      environmentalImpactSummary: entity.environmentalImpactSummary,
      slaDueAt: entity.slaDueAt?.toISOString() ?? null,
      closedAt: entity.closedAt?.toISOString() ?? null,
      closedByUserId: entity.closedByUserId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toFlashReportResponse(entity: IncidentFlashReportEntity): IncidentFlashReportResponse {
    return {
      id: entity.id,
      incidentId: entity.incidentId,
      summary: entity.summary,
      immediateCauses: entity.immediateCauses,
      affectedComponents: entity.affectedComponents,
      potentialImpact: entity.potentialImpact,
      reporterName: entity.reporterName,
      generatedAt: entity.generatedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toImmediateActionResponse(entity: IncidentImmediateActionEntity): IncidentImmediateActionResponse {
    return {
      id: entity.id,
      incidentId: entity.incidentId,
      description: entity.description,
      status: entity.status,
      performedByUserId: entity.performedByUserId,
      performedAt: entity.performedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toInvestigationResponse(entity: IncidentInvestigationEntity): IncidentInvestigationResponse {
    return {
      id: entity.id,
      incidentId: entity.incidentId,
      method: entity.method,
      title: entity.title,
      summary: entity.summary,
      status: entity.status,
      leadUserId: entity.leadUserId,
      startedAt: entity.startedAt?.toISOString() ?? null,
      completedAt: entity.completedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toFiveWhyResponse(entity: IncidentFiveWhyAnalysisEntity): IncidentFiveWhyAnalysisResponse {
    return {
      id: entity.id,
      investigationId: entity.investigationId,
      problemStatement: entity.problemStatement,
      why1: entity.why1,
      why2: entity.why2,
      why3: entity.why3,
      why4: entity.why4,
      why5: entity.why5,
      rootCause: entity.rootCause,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toPeepoResponse(entity: IncidentPeepoAnalysisEntity): IncidentPeepoAnalysisResponse {
    return {
      id: entity.id,
      investigationId: entity.investigationId,
      people: entity.people,
      environment: entity.environment,
      equipment: entity.equipment,
      procedures: entity.procedures,
      organization: entity.organization,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toActionPlanResponse(entity: IncidentActionPlanEntity): IncidentActionPlanResponse {
    return {
      id: entity.id,
      incidentId: entity.incidentId,
      investigationId: entity.investigationId,
      title: entity.title,
      description: entity.description,
      ownerUserId: entity.ownerUserId,
      dueAt: entity.dueAt?.toISOString() ?? null,
      status: entity.status,
      completedAt: entity.completedAt?.toISOString() ?? null,
      closedByUserId: entity.closedByUserId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
