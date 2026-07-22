import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CommentResponse,
  EvidenceLinkResponse,
  EvidenceResponse,
  SprApprovalStatus,
  SprMeasureGroupResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
  SprRecordApprovalResponse,
  SprRecordStatus,
  SprUnitResponse,
} from '@aurelia/contracts';
import { AuditService } from '../audit/audit.service';
import { CommentsService } from '../comments/comments.service';
import { EvidencesService } from '../evidences/evidences.service';
import { CreateSprMonthlyRecordDto } from './dto/create-spr-monthly-record.dto';
import { CreateSprRecordCommentDto } from './dto/create-spr-record-comment.dto';
import { LinkSprRecordEvidenceDto } from './dto/link-spr-record-evidence.dto';
import { SprRecordActionDto } from './dto/spr-record-action.dto';
import { UpdateSprMonthlyRecordStatusDto } from './dto/update-spr-monthly-record-status.dto';
import { UpdateSprMonthlyRecordDto } from './dto/update-spr-monthly-record.dto';
import { SprMeasureGroupEntity } from './entities/spr-measure-group.entity';
import { SprMonthlyRecordEntity } from './entities/spr-monthly-record.entity';
import { SprParameterAreaAssignmentEntity } from './entities/spr-parameter-area-assignment.entity';
import { SprParameterEntity } from './entities/spr-parameter.entity';
import { SprRecordApprovalEntity } from './entities/spr-record-approval.entity';
import { SprUnitEntity } from './entities/spr-unit.entity';

const SPR_RECORD_ENTITY_TYPE = 'spr_record';

@Injectable()
export class SprService {
  constructor(
    @InjectRepository(SprMeasureGroupEntity)
    private readonly measureGroupsRepository: Repository<SprMeasureGroupEntity>,
    @InjectRepository(SprUnitEntity)
    private readonly unitsRepository: Repository<SprUnitEntity>,
    @InjectRepository(SprParameterEntity)
    private readonly parametersRepository: Repository<SprParameterEntity>,
    @InjectRepository(SprParameterAreaAssignmentEntity)
    private readonly assignmentsRepository: Repository<SprParameterAreaAssignmentEntity>,
    @InjectRepository(SprMonthlyRecordEntity)
    private readonly monthlyRecordsRepository: Repository<SprMonthlyRecordEntity>,
    @InjectRepository(SprRecordApprovalEntity)
    private readonly approvalsRepository: Repository<SprRecordApprovalEntity>,
    private readonly evidencesService: EvidencesService,
    private readonly commentsService: CommentsService,
    private readonly auditService: AuditService,
  ) {}

  async findGroups(): Promise<SprMeasureGroupResponse[]> {
    const groups = await this.measureGroupsRepository.find({ order: { sortOrder: 'ASC', code: 'ASC' } });
    return groups.map((group) => this.toMeasureGroupResponse(group));
  }

  async findUnits(): Promise<SprUnitResponse[]> {
    const units = await this.unitsRepository.find({ order: { code: 'ASC' } });
    return units.map((unit) => this.toUnitResponse(unit));
  }

  async findParameters(): Promise<SprParameterResponse[]> {
    const parameters = await this.parametersRepository.find({ order: { sortOrder: 'ASC', code: 'ASC' } });
    return parameters.map((parameter) => this.toParameterResponse(parameter));
  }

  async findAssignments(): Promise<SprParameterAreaAssignmentResponse[]> {
    const assignments = await this.assignmentsRepository.find({ order: { createdAt: 'DESC' } });
    return assignments.map((assignment) => this.toAssignmentResponse(assignment));
  }

  async createMonthlyRecord(dto: CreateSprMonthlyRecordDto): Promise<SprMonthlyRecordResponse> {
    await this.ensureParameterExists(dto.parameterId);
    const assignment = dto.assignmentId ? await this.ensureAssignmentExists(dto.assignmentId) : null;
    const areaId = dto.areaId ?? assignment?.areaId ?? null;

    if (assignment && assignment.parameterId !== dto.parameterId) {
      throw new ConflictException('Assignment does not belong to the selected SPR parameter');
    }

    const existing = await this.findRecordForPeriod(dto.parameterId, areaId, dto.periodYear, dto.periodMonth);
    if (existing) {
      throw new ConflictException('SPR monthly record already exists for parameter, area and period');
    }

    const record = this.monthlyRecordsRepository.create({
      parameterId: dto.parameterId,
      areaId,
      assignmentId: dto.assignmentId ?? null,
      periodYear: dto.periodYear,
      periodMonth: dto.periodMonth,
      numericValue: dto.numericValue === undefined || dto.numericValue === null ? null : String(dto.numericValue),
      textValue: dto.textValue ?? null,
      booleanValue: dto.booleanValue ?? null,
      notes: dto.notes ?? null,
    });

    const saved = await this.monthlyRecordsRepository.save(record);
    return this.toMonthlyRecordResponse(saved);
  }

  async findMonthlyRecords(query: Record<string, string | undefined>): Promise<SprMonthlyRecordResponse[]> {
    const builder = this.monthlyRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.submittedByUser', 'submittedByUser')
      .orderBy('record.created_at', 'DESC');

    if (query.parameterId) builder.andWhere('record.parameter_id = :parameterId', { parameterId: query.parameterId });
    if (query.areaId) builder.andWhere('record.area_id = :areaId', { areaId: query.areaId });
    if (query.status) builder.andWhere('record.status = :status', { status: query.status });
    if (query.periodYear) builder.andWhere('record.period_year = :periodYear', { periodYear: Number(query.periodYear) });
    if (query.periodMonth) builder.andWhere('record.period_month = :periodMonth', { periodMonth: Number(query.periodMonth) });

    const records = await builder.getMany();
    return records.map((record) => this.toMonthlyRecordResponse(record));
  }

  async findMonthlyRecord(id: string): Promise<SprMonthlyRecordResponse> {
    const record = await this.ensureRecordExists(id);
    return this.toMonthlyRecordResponse(record);
  }

  async updateMonthlyRecord(id: string, dto: UpdateSprMonthlyRecordDto): Promise<SprMonthlyRecordResponse> {
    const record = await this.ensureRecordExists(id);

    if (record.status === SprRecordStatus.APPROVED || record.status === SprRecordStatus.CLOSED) {
      throw new BadRequestException('Approved or closed SPR records cannot be edited');
    }

    if (dto.numericValue !== undefined) record.numericValue = dto.numericValue === null ? null : String(dto.numericValue);
    if (dto.textValue !== undefined) record.textValue = dto.textValue;
    if (dto.booleanValue !== undefined) record.booleanValue = dto.booleanValue;
    if (dto.notes !== undefined) record.notes = dto.notes;

    const saved = await this.monthlyRecordsRepository.save(record);
    return this.toMonthlyRecordResponse(saved);
  }

  async updateMonthlyRecordStatus(id: string, dto: UpdateSprMonthlyRecordStatusDto): Promise<SprMonthlyRecordResponse> {
    if (dto.status === SprRecordStatus.SUBMITTED) {
      return this.submitRecord(id, { submittedByUserId: dto.submittedByUserId, notes: dto.notes });
    }

    if (dto.status === SprRecordStatus.APPROVED) {
      return this.approveRecord(id, { approverUserId: dto.approvedByUserId, comments: dto.notes });
    }

    if (dto.status === SprRecordStatus.REJECTED) {
      return this.rejectRecord(id, { comments: dto.notes });
    }

    const record = await this.ensureRecordExists(id);
    const oldValue = this.toMonthlyRecordResponse(record);
    record.status = dto.status;
    if (dto.notes !== undefined) record.notes = dto.notes;

    const saved = await this.monthlyRecordsRepository.save(record);
    await this.logAudit('spr.record.status.updated', id, null, oldValue, this.toMonthlyRecordResponse(saved));
    return this.toMonthlyRecordResponse(saved);
  }

  async findRecordEvidences(recordId: string): Promise<EvidenceResponse[]> {
    await this.ensureRecordExists(recordId);
    return this.evidencesService.findAll(SPR_RECORD_ENTITY_TYPE, recordId);
  }

  async linkRecordEvidence(recordId: string, evidenceId: string, dto: LinkSprRecordEvidenceDto, actorId: string | null): Promise<EvidenceLinkResponse> {
    await this.ensureRecordExists(recordId);
    const result = await this.evidencesService.link(evidenceId, {
      entityType: SPR_RECORD_ENTITY_TYPE,
      entityId: recordId,
      relationType: dto.relationType ?? 'spr_record_evidence',
    });
    await this.logAudit('spr.record.evidence.linked', recordId, actorId, undefined, { evidenceId, relationType: result.relationType });
    return result;
  }

  async findRecordComments(recordId: string): Promise<CommentResponse[]> {
    await this.ensureRecordExists(recordId);
    return this.commentsService.findAll(SPR_RECORD_ENTITY_TYPE, recordId);
  }

  async createRecordComment(recordId: string, dto: CreateSprRecordCommentDto, actorId: string | null): Promise<CommentResponse> {
    await this.ensureRecordExists(recordId);
    const result = await this.commentsService.create({
      entityType: SPR_RECORD_ENTITY_TYPE,
      entityId: recordId,
      body: dto.body,
      isInternal: dto.isInternal,
      authorUserId: dto.authorUserId ?? actorId ?? undefined,
    });
    await this.logAudit('spr.record.comment.created', recordId, actorId, undefined, { commentId: result.id, isInternal: result.isInternal });
    return result;
  }

  async findRecordApprovals(recordId: string): Promise<SprRecordApprovalResponse[]> {
    await this.ensureRecordExists(recordId);
    const approvals = await this.approvalsRepository.find({ where: { recordId }, order: { createdAt: 'ASC' } });
    return approvals.map((approval) => this.toApprovalResponse(approval));
  }

  async submitRecord(recordId: string, dto: SprRecordActionDto): Promise<SprMonthlyRecordResponse> {
    const record = await this.ensureRecordExists(recordId);
    if (![SprRecordStatus.DRAFT, SprRecordStatus.REJECTED].includes(record.status)) {
      throw new BadRequestException('Only draft or rejected SPR records can be submitted');
    }

    await this.ensureEvidencePolicySatisfied(record);

    const oldValue = this.toMonthlyRecordResponse(record);
    record.status = SprRecordStatus.SUBMITTED;
    record.submittedByUserId = dto.submittedByUserId ?? record.submittedByUserId;
    record.submittedAt = new Date();
    if (dto.notes !== undefined) record.notes = dto.notes;

    const saved = await this.monthlyRecordsRepository.save(record);
    const assignment = saved.assignmentId ? await this.assignmentsRepository.findOne({ where: { id: saved.assignmentId } }) : null;
    await this.upsertApproval(saved, SprApprovalStatus.PENDING, dto.approverUserId ?? assignment?.approverUserId ?? null, dto.comments ?? dto.notes ?? null);
    const withSubmitter = await this.ensureRecordExists(saved.id);
    await this.logAudit('spr.record.submitted', recordId, dto.submittedByUserId ?? null, oldValue, this.toMonthlyRecordResponse(withSubmitter));
    return this.toMonthlyRecordResponse(withSubmitter);
  }

  async approveRecord(recordId: string, dto: SprRecordActionDto): Promise<SprMonthlyRecordResponse> {
    const record = await this.ensureRecordExists(recordId);
    if (![SprRecordStatus.SUBMITTED, SprRecordStatus.UNDER_REVIEW].includes(record.status)) {
      throw new BadRequestException('Only submitted or under-review SPR records can be approved');
    }

    await this.ensureEvidencePolicySatisfied(record);

    const oldValue = this.toMonthlyRecordResponse(record);
    record.status = SprRecordStatus.APPROVED;
    record.approvedByUserId = dto.approverUserId ?? record.approvedByUserId;
    record.approvedAt = new Date();
    if (dto.comments !== undefined) record.notes = dto.comments;
    else if (dto.notes !== undefined) record.notes = dto.notes;

    const saved = await this.monthlyRecordsRepository.save(record);
    await this.upsertApproval(saved, SprApprovalStatus.APPROVED, dto.approverUserId ?? saved.approvedByUserId, dto.comments ?? dto.notes ?? null);
    await this.logAudit('spr.record.approved', recordId, dto.approverUserId ?? null, oldValue, this.toMonthlyRecordResponse(saved));
    return this.toMonthlyRecordResponse(saved);
  }

  async rejectRecord(recordId: string, dto: SprRecordActionDto): Promise<SprMonthlyRecordResponse> {
    const record = await this.ensureRecordExists(recordId);
    if (![SprRecordStatus.SUBMITTED, SprRecordStatus.UNDER_REVIEW].includes(record.status)) {
      throw new BadRequestException('Only submitted or under-review SPR records can be rejected');
    }

    const oldValue = this.toMonthlyRecordResponse(record);
    record.status = SprRecordStatus.REJECTED;
    record.approvedByUserId = null;
    record.approvedAt = null;
    if (dto.comments !== undefined) record.notes = dto.comments;
    else if (dto.notes !== undefined) record.notes = dto.notes;

    const saved = await this.monthlyRecordsRepository.save(record);
    await this.upsertApproval(saved, SprApprovalStatus.REJECTED, dto.approverUserId ?? null, dto.comments ?? dto.notes ?? null);
    await this.logAudit('spr.record.rejected', recordId, dto.approverUserId ?? null, oldValue, this.toMonthlyRecordResponse(saved));
    return this.toMonthlyRecordResponse(saved);
  }

  private async ensureParameterExists(parameterId: string): Promise<SprParameterEntity> {
    const parameter = await this.parametersRepository.findOne({ where: { id: parameterId } });
    if (!parameter) throw new NotFoundException('SPR parameter not found');
    return parameter;
  }

  private async ensureAssignmentExists(assignmentId: string): Promise<SprParameterAreaAssignmentEntity> {
    const assignment = await this.assignmentsRepository.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('SPR assignment not found');
    return assignment;
  }

  private async ensureRecordExists(id: string): Promise<SprMonthlyRecordEntity> {
    const record = await this.monthlyRecordsRepository.findOne({
      where: { id },
      relations: { submittedByUser: true },
    });
    if (!record) throw new NotFoundException('SPR monthly record not found');
    return record;
  }

  private async ensureEvidencePolicySatisfied(record: SprMonthlyRecordEntity): Promise<void> {
    const parameter = await this.ensureParameterExists(record.parameterId);
    if (!parameter.isSox && !parameter.requiresEvidence) return;

    const evidences = await this.evidencesService.findAll(SPR_RECORD_ENTITY_TYPE, record.id);
    if (evidences.length === 0) {
      throw new BadRequestException('SPR record requires at least one linked evidence before submission or approval');
    }
  }

  private async findRecordForPeriod(
    parameterId: string,
    areaId: string | null,
    periodYear: number,
    periodMonth: number,
  ): Promise<SprMonthlyRecordEntity | null> {
    const builder = this.monthlyRecordsRepository
      .createQueryBuilder('record')
      .where('record.parameter_id = :parameterId', { parameterId })
      .andWhere('record.period_year = :periodYear', { periodYear })
      .andWhere('record.period_month = :periodMonth', { periodMonth });

    if (areaId) builder.andWhere('record.area_id = :areaId', { areaId });
    else builder.andWhere('record.area_id IS NULL');

    return builder.getOne();
  }

  private async upsertApproval(
    record: SprMonthlyRecordEntity,
    status: SprApprovalStatus,
    approverUserId: string | null | undefined,
    comments: string | null,
  ): Promise<SprRecordApprovalEntity> {
    const pending = await this.approvalsRepository.findOne({
      where: { recordId: record.id, status: SprApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
    const approval = pending ?? this.approvalsRepository.create({ recordId: record.id, approverUserId: approverUserId ?? null });

    if (approverUserId !== undefined) approval.approverUserId = approverUserId;
    approval.status = status;
    approval.comments = comments ?? approval.comments ?? null;
    approval.decidedAt = status === SprApprovalStatus.PENDING ? null : new Date();

    return this.approvalsRepository.save(approval);
  }

  private toMeasureGroupResponse(group: SprMeasureGroupEntity): SprMeasureGroupResponse {
    return {
      ...group,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  private toUnitResponse(unit: SprUnitEntity): SprUnitResponse {
    return {
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  }

  private toParameterResponse(parameter: SprParameterEntity): SprParameterResponse {
    return {
      ...parameter,
      createdAt: parameter.createdAt.toISOString(),
      updatedAt: parameter.updatedAt.toISOString(),
    };
  }

  private toAssignmentResponse(assignment: SprParameterAreaAssignmentEntity): SprParameterAreaAssignmentResponse {
    return {
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    };
  }

  private toMonthlyRecordResponse(record: SprMonthlyRecordEntity): SprMonthlyRecordResponse {
    const submittedByFullName = record.submittedByUser
      ? `${record.submittedByUser.firstName} ${record.submittedByUser.lastName}`.trim() || null
      : null;

    return {
      id: record.id,
      parameterId: record.parameterId,
      areaId: record.areaId,
      assignmentId: record.assignmentId,
      periodYear: record.periodYear,
      periodMonth: record.periodMonth,
      numericValue: record.numericValue === null ? null : Number(record.numericValue),
      textValue: record.textValue,
      booleanValue: record.booleanValue,
      status: record.status,
      submittedByUserId: record.submittedByUserId,
      submittedByFullName,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      approvedByUserId: record.approvedByUserId,
      approvedAt: record.approvedAt?.toISOString() ?? null,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private toApprovalResponse(approval: SprRecordApprovalEntity): SprRecordApprovalResponse {
    return {
      ...approval,
      createdAt: approval.createdAt.toISOString(),
      updatedAt: approval.updatedAt.toISOString(),
      decidedAt: approval.decidedAt?.toISOString() ?? null,
    };
  }

  private async logAudit(
    action: string,
    recordId: string,
    actorId: string | null,
    oldValue?: object,
    newValue?: object,
  ): Promise<void> {
    await this.auditService.log({
      action,
      entityType: SPR_RECORD_ENTITY_TYPE,
      entityId: recordId,
      actorUserId: actorId ?? undefined,
      oldValue: oldValue as Record<string, unknown> | undefined,
      newValue: newValue as Record<string, unknown> | undefined,
    });
  }
}
