import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CommentResponse,
  EvidenceLinkResponse,
  EvidenceResponse,
  RecordStatus,
  Role,
  SprApprovalStatus,
  SprCycleResponse,
  SprCycleSacSubmissionResponse,
  SprCycleSacSubmissionStatus,
  SprCycleSignatureLevel,
  SprCycleSignatureResponse,
  SprCycleSignatureStatus,
  SprCycleStatus,
  SprCycleValidationDecision,
  SprCycleValidationResponse,
  SprCycleValidationStatus,
  SprMeasureGroupResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
  SprRecordApprovalResponse,
  SprRecordStatus,
  SprSignerPersonResponse,
  SprSignersResponse,
  SprUnitResponse,
} from '@aurelia/contracts';
import { AuditService } from '../audit/audit.service';
import { CommentsService } from '../comments/comments.service';
import { EvidencesService } from '../evidences/evidences.service';
import { AreaEntity } from '../organization/entities/area.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateSprCycleSignatureDto } from './dto/create-spr-cycle-signature.dto';
import { CreateSprCycleValidationDto } from './dto/create-spr-cycle-validation.dto';
import { CreateSprMonthlyRecordDto } from './dto/create-spr-monthly-record.dto';
import { CreateSprRecordCommentDto } from './dto/create-spr-record-comment.dto';
import { LinkSprRecordEvidenceDto } from './dto/link-spr-record-evidence.dto';
import { SprRecordActionDto } from './dto/spr-record-action.dto';
import { UpdateSprMonthlyRecordStatusDto } from './dto/update-spr-monthly-record-status.dto';
import { UpdateSprMonthlyRecordDto } from './dto/update-spr-monthly-record.dto';
import { SprCycleSacSubmissionEntity } from './entities/spr-cycle-sac-submission.entity';
import { SprCycleSignatureEntity } from './entities/spr-cycle-signature.entity';
import { SprCycleValidationEntity } from './entities/spr-cycle-validation.entity';
import { SprCycleEntity } from './entities/spr-cycle.entity';
import { SprMeasureGroupEntity } from './entities/spr-measure-group.entity';
import { SprMonthlyRecordEntity } from './entities/spr-monthly-record.entity';
import { SprParameterAreaAssignmentEntity } from './entities/spr-parameter-area-assignment.entity';
import { SprParameterEntity } from './entities/spr-parameter.entity';
import { SprRecordApprovalEntity } from './entities/spr-record-approval.entity';
import { SprUnitEntity } from './entities/spr-unit.entity';

/** Áreas SOX del paso 5 — únicas que pueden validar el reporte. */
export const SPR_SOX_AREA_CODES = ['AREA-STECNICOS', 'AREA-OPTACTIVOS'] as const;

/**
 * Universo Dashboard / cierre de ciclo (mismo orden que FE SPR_REPORT_AREA_CATALOG).
 * Cierre formal (`closed`) exige que las 8 tengan todos sus assignments con record approved.
 * Fase 4 (estimados) aún no existe: “sin estimaciones” se aproxima con 8/8 datos reales approved.
 */
export const SPR_REPORT_AREA_CODES = [
  'AREA-STECNICOS',
  'AREA-OPTACTIVOS',
  'AREA-MINA',
  'AREA-FINANZAS',
  'AREA-PLANTA',
  'AREA-MAMBIENTE',
  'AREA-SUSTENTABILIDAD',
  'AREA-SOPERACIONALES',
] as const;

const SPR_RECORD_ENTITY_TYPE = 'spr_record';

const SPR_AREA_AUTO_SCOPE_ROLES = new Set<string>([Role.SPR_RESPONSIBLE, Role.SPR_AREA_MANAGER]);
const SPR_CATALOG_UNSCOPED_ROLES = new Set<string>([
  Role.ADMIN,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_ENVIRONMENT_MANAGER,
]);

type SprCatalogScopeInput = {
  areaId?: string;
  roles: string[];
  userId: string;
};

type SprCyclesQuery = {
  periodYear?: string;
  periodMonth?: string;
  status?: string;
};

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
    @InjectRepository(SprCycleEntity)
    private readonly cyclesRepository: Repository<SprCycleEntity>,
    @InjectRepository(SprCycleSacSubmissionEntity)
    private readonly sacSubmissionsRepository: Repository<SprCycleSacSubmissionEntity>,
    @InjectRepository(SprCycleSignatureEntity)
    private readonly signaturesRepository: Repository<SprCycleSignatureEntity>,
    @InjectRepository(SprCycleValidationEntity)
    private readonly validationsRepository: Repository<SprCycleValidationEntity>,
    @InjectRepository(AreaEntity)
    private readonly areasRepository: Repository<AreaEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly evidencesService: EvidencesService,
    private readonly commentsService: CommentsService,
    private readonly auditService: AuditService,
  ) {}

  async findCycles(query: SprCyclesQuery = {}): Promise<SprCycleResponse[]> {
    const where: { periodYear?: number; periodMonth?: number; status?: SprCycleStatus } = {};

    if (query.periodYear !== undefined && query.periodYear !== '') {
      const periodYear = Number(query.periodYear);
      if (!Number.isInteger(periodYear) || periodYear < 2000 || periodYear > 2100) {
        throw new BadRequestException('periodYear must be an integer between 2000 and 2100');
      }
      where.periodYear = periodYear;
    }

    if (query.periodMonth !== undefined && query.periodMonth !== '') {
      const periodMonth = Number(query.periodMonth);
      if (!Number.isInteger(periodMonth) || periodMonth < 1 || periodMonth > 12) {
        throw new BadRequestException('periodMonth must be an integer between 1 and 12');
      }
      where.periodMonth = periodMonth;
    }

    if (query.status !== undefined && query.status !== '') {
      if (!Object.values(SprCycleStatus).includes(query.status as SprCycleStatus)) {
        throw new BadRequestException(`status must be one of: ${Object.values(SprCycleStatus).join(', ')}`);
      }
      where.status = query.status as SprCycleStatus;
    }

    const cycles = await this.cyclesRepository.find({
      where,
      order: { periodYear: 'DESC', periodMonth: 'DESC' },
    });
    return cycles.map((cycle) => this.toCycleResponse(cycle));
  }

  async findCycle(id: string): Promise<SprCycleResponse> {
    const cycle = await this.cyclesRepository.findOne({ where: { id } });
    if (!cycle) throw new NotFoundException('SPR cycle not found');
    return this.toCycleResponse(cycle);
  }

  /** Fase 2: submission SAC del ciclo. Sin fila → 404 (Mayo/Junio demo). */
  async findCycleSacSubmission(cycleId: string): Promise<SprCycleSacSubmissionResponse> {
    await this.requireCycle(cycleId);
    const submission = await this.sacSubmissionsRepository.findOne({ where: { cycleId } });
    if (!submission) throw new NotFoundException('SPR cycle SAC submission not found');
    return this.toSacSubmissionResponse(submission);
  }

  /**
   * Stub demo: pending → preparing (crea fila si no existe).
   * Actualiza ciclo a sac_preparing. No integra SAC externo.
   *
   * Producción (futuro): el disparo es automático el día 9 — sin botón “preparar”
   * en la UI. Este endpoint puede seguir existiendo solo para demos/smoke.
   *
   * Fase 4 (pendiente, no implementado): durante este mismo paso `preparing`
   * debe calcularse el promedio histórico de 6 meses para áreas sin dato real
   * (estimados). Ese cálculo debería vivir aquí o en el job de día 9 que deja
   * el ciclo/submission en preparing — no en un paso posterior.
   */
  async prepareCycleSacSubmission(cycleId: string): Promise<SprCycleSacSubmissionResponse> {
    const cycle = await this.requireCycle(cycleId);
    let submission = await this.sacSubmissionsRepository.findOne({ where: { cycleId } });

    if (submission?.status === SprCycleSacSubmissionStatus.REPORT_READY) {
      throw new ConflictException('SAC report is already ready for this cycle');
    }
    if (submission?.status === SprCycleSacSubmissionStatus.FAILED) {
      throw new ConflictException('SAC submission is failed; reset is not implemented in Fase 2');
    }

    if (!submission) {
      submission = this.sacSubmissionsRepository.create({
        cycleId,
        status: SprCycleSacSubmissionStatus.PREPARING,
        sentAt: null,
        reportReadyAt: null,
        externalRef: null,
        payloadSnapshot: null,
      });
    } else if (
      submission.status === SprCycleSacSubmissionStatus.PENDING ||
      submission.status === SprCycleSacSubmissionStatus.PREPARING
    ) {
      submission.status = SprCycleSacSubmissionStatus.PREPARING;
    } else if (submission.status === SprCycleSacSubmissionStatus.SENT) {
      throw new ConflictException('SAC submission already sent; use mark-ready to expose report');
    }

    const saved = await this.sacSubmissionsRepository.save(submission);
    if (cycle.status !== SprCycleStatus.SAC_PREPARING && cycle.status !== SprCycleStatus.SAC_AVAILABLE) {
      cycle.status = SprCycleStatus.SAC_PREPARING;
      await this.cyclesRepository.save(cycle);
    }
    return this.toSacSubmissionResponse(saved);
  }

  /**
   * Stub demo: marca report_ready y ciclo → sac_available.
   * Crea fila si no existe. No integra SAC externo.
   */
  async markCycleSacReportReady(cycleId: string): Promise<SprCycleSacSubmissionResponse> {
    const cycle = await this.requireCycle(cycleId);
    let submission = await this.sacSubmissionsRepository.findOne({ where: { cycleId } });
    const now = new Date();

    if (!submission) {
      submission = this.sacSubmissionsRepository.create({
        cycleId,
        status: SprCycleSacSubmissionStatus.REPORT_READY,
        sentAt: now,
        reportReadyAt: now,
        externalRef: null,
        payloadSnapshot: null,
      });
    } else if (submission.status === SprCycleSacSubmissionStatus.FAILED) {
      throw new ConflictException('SAC submission is failed; reset is not implemented in Fase 2');
    } else {
      submission.status = SprCycleSacSubmissionStatus.REPORT_READY;
      submission.sentAt = submission.sentAt ?? now;
      submission.reportReadyAt = now;
    }

    const saved = await this.sacSubmissionsRepository.save(submission);
    cycle.status = SprCycleStatus.SAC_AVAILABLE;
    await this.cyclesRepository.save(cycle);
    return this.toSacSubmissionResponse(saved);
  }

  /** Fase 3: firmas del ciclo. Sin filas → []. */
  async findCycleSignatures(cycleId: string): Promise<SprCycleSignatureResponse[]> {
    await this.requireCycle(cycleId);
    const signatures = await this.signaturesRepository.find({
      where: { cycleId },
      relations: { signer: true },
      order: { signedAt: 'ASC', createdAt: 'ASC' },
    });
    return signatures.map((signature) => this.toSignatureResponse(signature));
  }

  /**
   * Fase 3: firma specialist | environment_manager.
   * Prerrequisitos: SAC sent|report_ready; gerente solo tras especialista.
   * Ciclo: specialist → signing; ambos → validating.
   */
  async createCycleSignature(
    cycleId: string,
    dto: CreateSprCycleSignatureDto,
    actor: { userId: string; roles: string[] },
  ): Promise<SprCycleSignatureResponse> {
    const cycle = await this.requireCycle(cycleId);
    if (cycle.status === SprCycleStatus.CLOSED) {
      throw new ConflictException('Closed cycles cannot accept new signatures');
    }
    this.assertSignerRoleForLevel(dto.level, actor.roles);

    const existing = await this.signaturesRepository.findOne({
      where: { cycleId, level: dto.level },
    });
    if (existing?.status === SprCycleSignatureStatus.SIGNED) {
      throw new ConflictException(`Cycle already has a signed ${dto.level} signature`);
    }

    const sac = await this.sacSubmissionsRepository.findOne({ where: { cycleId } });
    const sacReady =
      sac?.status === SprCycleSacSubmissionStatus.SENT ||
      sac?.status === SprCycleSacSubmissionStatus.REPORT_READY;
    if (!sacReady) {
      throw new ConflictException(
        'Cycle SAC submission must be sent or report_ready before signing the report',
      );
    }

    const reopenedValidations = await this.validationsRepository.find({
      where: { cycleId, status: SprCycleValidationStatus.REOPENED },
    });
    for (const reopened of reopenedValidations) {
      const areaRecords = await this.monthlyRecordsRepository.find({
        where: {
          areaId: reopened.areaId,
          periodYear: cycle.periodYear,
          periodMonth: cycle.periodMonth,
        },
      });
      const correctionPending =
        areaRecords.length === 0 ||
        areaRecords.some((record) => record.status !== SprRecordStatus.APPROVED);
      if (correctionPending) {
        throw new ConflictException(
          'Cannot sign while a SOX area is reopened and its monthly records are not all approved again',
        );
      }
    }

    if (dto.level === SprCycleSignatureLevel.ENVIRONMENT_MANAGER) {
      const specialist = await this.signaturesRepository.findOne({
        where: {
          cycleId,
          level: SprCycleSignatureLevel.SPECIALIST,
          status: SprCycleSignatureStatus.SIGNED,
        },
      });
      if (!specialist) {
        throw new ConflictException(
          'Environment manager can only sign after the sustainability specialist has signed',
        );
      }
    }

    const now = new Date();
    let saved: SprCycleSignatureEntity;
    if (existing?.status === SprCycleSignatureStatus.REVOKED) {
      existing.status = SprCycleSignatureStatus.SIGNED;
      existing.signerUserId = actor.userId;
      existing.signedAt = now;
      saved = await this.signaturesRepository.save(existing);
    } else if (existing) {
      throw new ConflictException(`Signature row already exists for level ${dto.level}`);
    } else {
      saved = await this.signaturesRepository.save(
        this.signaturesRepository.create({
          cycleId,
          level: dto.level,
          status: SprCycleSignatureStatus.SIGNED,
          signerUserId: actor.userId,
          signedAt: now,
        }),
      );
    }

    // CLOSED already rejected above; TS narrows status without CLOSED here.
    if (dto.level === SprCycleSignatureLevel.SPECIALIST) {
      if (
        cycle.status !== SprCycleStatus.VALIDATING &&
        cycle.status !== SprCycleStatus.VALIDATION_APPROVED
      ) {
        cycle.status = SprCycleStatus.SIGNING;
        await this.cyclesRepository.save(cycle);
      }
    } else if (dto.level === SprCycleSignatureLevel.ENVIRONMENT_MANAGER) {
      if (cycle.status !== SprCycleStatus.VALIDATION_APPROVED) {
        cycle.status = SprCycleStatus.VALIDATING;
        await this.cyclesRepository.save(cycle);
      }
    }

    const withSigner = await this.signaturesRepository.findOne({
      where: { id: saved.id },
      relations: { signer: true },
    });
    return this.toSignatureResponse(withSigner ?? saved);
  }

  /** Fase 5: validaciones SOX. Sin filas → []. */
  async findCycleValidations(cycleId: string): Promise<SprCycleValidationResponse[]> {
    await this.requireCycle(cycleId);
    const validations = await this.validationsRepository.find({
      where: { cycleId },
      relations: { area: true, actor: true },
      order: { decidedAt: 'ASC', createdAt: 'ASC' },
    });
    return validations.map((validation) => this.toValidationResponse(validation));
  }

  /**
   * Fase 5: Responsable SOX aprueba o reporta discrepancia (una fila por área).
   * Si la fila está reopened → UPDATE con la nueva decisión.
   * Ambas SOX approved → validation_approved; si además 8/8 áreas fully approved → closed.
   */
  async createCycleValidation(
    cycleId: string,
    dto: CreateSprCycleValidationDto,
    actor: { userId: string; roles: string[] },
  ): Promise<SprCycleValidationResponse> {
    const cycle = await this.requireCycle(cycleId);
    if (
      cycle.status !== SprCycleStatus.VALIDATING &&
      cycle.status !== SprCycleStatus.VALIDATION_APPROVED
    ) {
      throw new ConflictException(
        'Cycle must be validating (or validation_approved) before SOX area validation',
      );
    }

    const area = await this.areasRepository.findOne({ where: { id: dto.areaId } });
    if (!area) throw new NotFoundException('Area not found');
    if (!(SPR_SOX_AREA_CODES as readonly string[]).includes(area.code)) {
      throw new BadRequestException(
        `Only SOX areas can validate the report: ${SPR_SOX_AREA_CODES.join(', ')}`,
      );
    }

    await this.assertSoxValidatorForArea(actor, area.id);

    const specialist = await this.signaturesRepository.findOne({
      where: {
        cycleId,
        level: SprCycleSignatureLevel.SPECIALIST,
        status: SprCycleSignatureStatus.SIGNED,
      },
    });
    const manager = await this.signaturesRepository.findOne({
      where: {
        cycleId,
        level: SprCycleSignatureLevel.ENVIRONMENT_MANAGER,
        status: SprCycleSignatureStatus.SIGNED,
      },
    });
    if (!specialist || !manager) {
      throw new ConflictException(
        'Both specialist and environment_manager signatures are required before SOX validation',
      );
    }

    const existing = await this.validationsRepository.findOne({
      where: { cycleId, areaId: dto.areaId },
    });
    if (existing && existing.status !== SprCycleValidationStatus.REOPENED) {
      throw new ConflictException(`Validation already exists for area ${area.code} on this cycle`);
    }

    if (dto.decision === SprCycleValidationDecision.DISCREPANCY_REPORTED) {
      const comments = dto.comments?.trim() ?? '';
      if (!comments) {
        throw new BadRequestException('comments are required when reporting a discrepancy');
      }
    }

    const now = new Date();
    const status =
      dto.decision === SprCycleValidationDecision.APPROVED
        ? SprCycleValidationStatus.APPROVED
        : SprCycleValidationStatus.DISCREPANCY_REPORTED;
    const comments =
      dto.decision === SprCycleValidationDecision.DISCREPANCY_REPORTED
        ? (dto.comments?.trim() ?? null)
        : dto.comments?.trim() || null;

    let saved: SprCycleValidationEntity;
    if (existing?.status === SprCycleValidationStatus.REOPENED) {
      existing.status = status;
      existing.actorUserId = actor.userId;
      existing.comments = comments;
      existing.decidedAt = now;
      existing.reopenedAt = null;
      saved = await this.validationsRepository.save(existing);
    } else {
      saved = await this.validationsRepository.save(
        this.validationsRepository.create({
          cycleId,
          areaId: dto.areaId,
          status,
          actorUserId: actor.userId,
          comments,
          decidedAt: now,
        }),
      );
    }

    if (status === SprCycleValidationStatus.APPROVED) {
      await this.maybeMarkValidationApproved(cycle);
    }

    const withRelations = await this.validationsRepository.findOne({
      where: { id: saved.id },
      relations: { area: true, actor: true },
    });
    return this.toValidationResponse(withRelations ?? saved);
  }

  /**
   * Fase 5.1: Especialista reabre un área SOX con discrepancy_reported.
   * - validation → reopened
   * - monthly records del área+período → rejected (+ approval)
   * - firmas del ciclo → revoked
   * - ciclo → signing
   * Otras áreas SOX no se tocan.
   */
  async reopenCycleValidation(
    cycleId: string,
    areaId: string,
    actor: { userId: string; roles: string[] },
    dto?: { comments?: string | null },
  ): Promise<SprCycleValidationResponse> {
    if (!actor.roles.includes(Role.ADMIN) && !actor.roles.includes(Role.SPR_SUSTAINABILITY_SPECIALIST)) {
      throw new ForbiddenException('Only sustainability specialists can reopen SOX validations');
    }

    const cycle = await this.requireCycle(cycleId);
    if (cycle.status === SprCycleStatus.CLOSED) {
      throw new ConflictException('Closed cycles cannot be reopened');
    }
    if (cycle.status !== SprCycleStatus.VALIDATING && cycle.status !== SprCycleStatus.VALIDATION_APPROVED) {
      throw new ConflictException('Cycle must be validating (or validation_approved) to reopen an area');
    }

    const area = await this.areasRepository.findOne({ where: { id: areaId } });
    if (!area) throw new NotFoundException('Area not found');
    if (!(SPR_SOX_AREA_CODES as readonly string[]).includes(area.code)) {
      throw new BadRequestException(
        `Only SOX areas can be reopened: ${SPR_SOX_AREA_CODES.join(', ')}`,
      );
    }

    const validation = await this.validationsRepository.findOne({
      where: { cycleId, areaId },
    });
    if (!validation) {
      throw new NotFoundException(`No SOX validation found for area ${area.code} on this cycle`);
    }
    if (validation.status === SprCycleValidationStatus.REOPENED) {
      throw new ConflictException(`Validation for area ${area.code} is already reopened`);
    }
    if (validation.status !== SprCycleValidationStatus.DISCREPANCY_REPORTED) {
      throw new ConflictException(
        `Only discrepancy_reported validations can be reopened (current: ${validation.status})`,
      );
    }

    const specialistNote = dto?.comments?.trim() ?? '';
    const reopenComment = specialistNote
      ? `Reapertura SOX por Especialista de Sustentabilidad.\n${specialistNote}`
      : 'Reapertura SOX por Especialista de Sustentabilidad.';

    if (validation.comments?.trim()) {
      validation.comments = `${validation.comments.trim()}\n\n[${reopenComment}]`;
    } else {
      validation.comments = `[${reopenComment}]`;
    }
    validation.status = SprCycleValidationStatus.REOPENED;
    validation.reopenedAt = new Date();
    await this.validationsRepository.save(validation);

    const records = await this.monthlyRecordsRepository.find({
      where: {
        areaId,
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
      },
    });
    for (const record of records) {
      if (record.status === SprRecordStatus.REJECTED || record.status === SprRecordStatus.DRAFT) {
        continue;
      }
      record.status = SprRecordStatus.REJECTED;
      record.approvedByUserId = null;
      record.approvedAt = null;
      const savedRecord = await this.monthlyRecordsRepository.save(record);
      await this.approvalsRepository.save(
        this.approvalsRepository.create({
          recordId: savedRecord.id,
          approverUserId: actor.userId,
          status: SprApprovalStatus.REJECTED,
          comments: reopenComment,
          decidedAt: new Date(),
        }),
      );
    }

    const signatures = await this.signaturesRepository.find({ where: { cycleId } });
    for (const signature of signatures) {
      if (signature.status !== SprCycleSignatureStatus.SIGNED) continue;
      signature.status = SprCycleSignatureStatus.REVOKED;
      signature.signerUserId = null;
      signature.signedAt = null;
      await this.signaturesRepository.save(signature);
    }

    cycle.status = SprCycleStatus.SIGNING;
    await this.cyclesRepository.save(cycle);

    await this.logAudit('spr.cycle.validation.reopened', validation.id, actor.userId, undefined, {
      cycleId,
      areaId,
      areaCode: area.code,
    });

    const withRelations = await this.validationsRepository.findOne({
      where: { id: validation.id },
      relations: { area: true, actor: true },
    });
    return this.toValidationResponse(withRelations ?? validation);
  }

  async findGroups(): Promise<SprMeasureGroupResponse[]> {
    const groups = await this.measureGroupsRepository.find({ order: { sortOrder: 'ASC', code: 'ASC' } });
    return groups.map((group) => this.toMeasureGroupResponse(group));
  }

  async findUnits(): Promise<SprUnitResponse[]> {
    const units = await this.unitsRepository.find({ order: { code: 'ASC' } });
    return units.map((unit) => this.toUnitResponse(unit));
  }

  /**
   * Roster de firmantes del reporte oficial (usuarios activos por rol).
   * specialists → SPR_SUSTAINABILITY_SPECIALIST
   * managers → SPR_ENVIRONMENT_MANAGER
   */
  async findSigners(): Promise<SprSignersResponse> {
    const [specialists, managers] = await Promise.all([
      this.findActiveUsersByRole(Role.SPR_SUSTAINABILITY_SPECIALIST),
      this.findActiveUsersByRole(Role.SPR_ENVIRONMENT_MANAGER),
    ]);
    return { specialists, managers };
  }

  async findParameters(scope: SprCatalogScopeInput): Promise<SprParameterResponse[]> {
    const resolved = await this.resolveCatalogAreaScope(scope);
    if (resolved.mode === 'empty') return [];

    if (resolved.mode === 'all') {
      const parameters = await this.parametersRepository.find({ order: { sortOrder: 'ASC', code: 'ASC' } });
      return parameters.map((parameter) => this.toParameterResponse(parameter));
    }

    const assignments = await this.assignmentsRepository.find({
      where: { areaId: resolved.areaId, status: RecordStatus.ACTIVE },
    });
    const parameterIds = [...new Set(assignments.map((assignment) => assignment.parameterId))];
    if (parameterIds.length === 0) return [];

    const parameters = await this.parametersRepository.find({
      where: { id: In(parameterIds) },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
    return parameters.map((parameter) => this.toParameterResponse(parameter));
  }

  async findAssignments(scope: SprCatalogScopeInput): Promise<SprParameterAreaAssignmentResponse[]> {
    const resolved = await this.resolveCatalogAreaScope(scope);
    if (resolved.mode === 'empty') return [];

    const assignments = await this.assignmentsRepository.find({
      where: resolved.mode === 'area' ? { areaId: resolved.areaId } : {},
      order: { createdAt: 'DESC' },
    });
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
      .leftJoinAndSelect('record.approvedByUser', 'approvedByUser')
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

    // Si el ciclo ya está validation_approved y esta era la última área → closed.
    const cycle = await this.cyclesRepository.findOne({
      where: { periodYear: saved.periodYear, periodMonth: saved.periodMonth },
    });
    if (cycle) {
      await this.maybeMarkValidationApproved(cycle);
    }

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

  private async resolveCatalogAreaScope(
    scope: SprCatalogScopeInput,
  ): Promise<{ mode: 'all' } | { mode: 'area'; areaId: string } | { mode: 'empty' }> {
    if (scope.areaId) {
      return { mode: 'area', areaId: scope.areaId };
    }

    const roles = scope.roles ?? [];
    const isUnscopedRole = roles.some((role) => SPR_CATALOG_UNSCOPED_ROLES.has(role));
    if (isUnscopedRole) {
      return { mode: 'all' };
    }

    const shouldAutoScope = roles.some((role) => SPR_AREA_AUTO_SCOPE_ROLES.has(role));
    if (!shouldAutoScope) {
      return { mode: 'all' };
    }

    const user = await this.usersRepository.findOne({
      where: { id: scope.userId },
      select: { id: true, areaId: true },
    });
    if (!user?.areaId) {
      return { mode: 'empty' };
    }
    return { mode: 'area', areaId: user.areaId };
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
      relations: { submittedByUser: true, approvedByUser: true },
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
    const approvedByFullName = record.approvedByUser
      ? `${record.approvedByUser.firstName} ${record.approvedByUser.lastName}`.trim() || null
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
      approvedByFullName,
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

  private toCycleResponse(cycle: SprCycleEntity): SprCycleResponse {
    return {
      id: cycle.id,
      periodYear: cycle.periodYear,
      periodMonth: cycle.periodMonth,
      label: cycle.label,
      status: cycle.status,
      day9At: this.toDateOnlyIso(cycle.day9At),
      closedAt: cycle.closedAt?.toISOString() ?? null,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
    };
  }

  private toSacSubmissionResponse(submission: SprCycleSacSubmissionEntity): SprCycleSacSubmissionResponse {
    return {
      id: submission.id,
      cycleId: submission.cycleId,
      status: submission.status,
      sentAt: submission.sentAt?.toISOString() ?? null,
      reportReadyAt: submission.reportReadyAt?.toISOString() ?? null,
      externalRef: submission.externalRef,
      payloadSnapshot: submission.payloadSnapshot,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
    };
  }

  private toSignatureResponse(signature: SprCycleSignatureEntity): SprCycleSignatureResponse {
    const signerFullName = signature.signer
      ? `${signature.signer.firstName} ${signature.signer.lastName}`.trim()
      : null;
    return {
      id: signature.id,
      cycleId: signature.cycleId,
      level: signature.level,
      status: signature.status,
      signerUserId: signature.signerUserId,
      signerFullName,
      signedAt: signature.signedAt?.toISOString() ?? null,
      createdAt: signature.createdAt.toISOString(),
      updatedAt: signature.updatedAt.toISOString(),
    };
  }

  private toValidationResponse(validation: SprCycleValidationEntity): SprCycleValidationResponse {
    const actorFullName = validation.actor
      ? `${validation.actor.firstName} ${validation.actor.lastName}`.trim()
      : null;
    return {
      id: validation.id,
      cycleId: validation.cycleId,
      areaId: validation.areaId,
      areaCode: validation.area?.code ?? '',
      areaName: validation.area?.name ?? '',
      status: validation.status,
      actorUserId: validation.actorUserId,
      actorFullName,
      comments: validation.comments,
      decidedAt: validation.decidedAt?.toISOString() ?? null,
      reopenedAt: validation.reopenedAt?.toISOString() ?? null,
      createdAt: validation.createdAt.toISOString(),
      updatedAt: validation.updatedAt.toISOString(),
    };
  }

  private async findActiveUsersByRole(roleCode: Role): Promise<SprSignerPersonResponse[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.userRoles', 'userRole')
      .innerJoin('userRole.role', 'role')
      .where('user.isActive = true')
      .andWhere('role.isActive = true')
      .andWhere('role.code = :roleCode', { roleCode })
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();

    return users.map((user) => this.toSignerPersonResponse(user));
  }

  private toSignerPersonResponse(user: UserEntity): SprSignerPersonResponse {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      position: user.position,
    };
  }

  private async assertSoxValidatorForArea(
    actor: { userId: string; roles: string[] },
    areaId: string,
  ): Promise<void> {
    if (actor.roles.includes(Role.ADMIN)) return;
    if (!actor.roles.includes(Role.SPR_RESPONSIBLE)) {
      throw new ForbiddenException('Only area responsibles can submit SOX validations');
    }
    const user = await this.usersRepository.findOne({ where: { id: actor.userId } });
    if (!user?.areaId || user.areaId !== areaId) {
      throw new ForbiddenException('You can only validate the SOX report for your own area');
    }
  }

  /**
   * Tras última SOX approved (o último record approved del período):
   * - 2/2 SOX approved + 8/8 áreas fully approved → `closed` (+ closedAt)
   * - 2/2 SOX approved sin 8/8 → `validation_approved`
   * Sin Fase 4: “sin estimaciones” = todas las áreas del catálogo SPR con 100% records approved.
   */
  private async maybeMarkValidationApproved(cycle: SprCycleEntity): Promise<void> {
    if (cycle.status === SprCycleStatus.CLOSED) return;

    const soxOk = await this.areAllSoxValidationsApproved(cycle.id);
    if (!soxOk) return;

    const areasOk = await this.areAllSprAreasFullyApproved(cycle);
    if (areasOk) {
      cycle.status = SprCycleStatus.CLOSED;
      cycle.closedAt = new Date();
      await this.cyclesRepository.save(cycle);
      return;
    }

    if (cycle.status !== SprCycleStatus.VALIDATION_APPROVED) {
      cycle.status = SprCycleStatus.VALIDATION_APPROVED;
      await this.cyclesRepository.save(cycle);
    }
  }

  private async areAllSoxValidationsApproved(cycleId: string): Promise<boolean> {
    const soxAreas = await this.areasRepository.find({
      where: { code: In([...SPR_SOX_AREA_CODES]) },
    });
    if (soxAreas.length < SPR_SOX_AREA_CODES.length) return false;

    const approved = await this.validationsRepository.find({
      where: {
        cycleId,
        status: SprCycleValidationStatus.APPROVED,
        areaId: In(soxAreas.map((area) => area.id)),
      },
    });
    const approvedAreaIds = new Set(approved.map((row) => row.areaId));
    return soxAreas.every((area) => approvedAreaIds.has(area.id));
  }

  /** Cada área SPR tiene ≥1 assignment activo y todos esos params tienen record approved del ciclo. */
  private async areAllSprAreasFullyApproved(cycle: SprCycleEntity): Promise<boolean> {
    const areas = await this.areasRepository.find({
      where: { code: In([...SPR_REPORT_AREA_CODES]) },
    });
    if (areas.length < SPR_REPORT_AREA_CODES.length) return false;

    const areaIds = areas.map((area) => area.id);
    const assignments = await this.assignmentsRepository.find({
      where: { areaId: In(areaIds), status: RecordStatus.ACTIVE },
    });

    const assignmentsByAreaId = new Map<string, SprParameterAreaAssignmentEntity[]>();
    for (const assignment of assignments) {
      if (!assignment.areaId) continue;
      const list = assignmentsByAreaId.get(assignment.areaId) ?? [];
      list.push(assignment);
      assignmentsByAreaId.set(assignment.areaId, list);
    }

    for (const area of areas) {
      if ((assignmentsByAreaId.get(area.id) ?? []).length === 0) return false;
    }

    const approvedRecords = await this.monthlyRecordsRepository.find({
      where: {
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
        areaId: In(areaIds),
        status: SprRecordStatus.APPROVED,
      },
    });
    const approvedKeys = new Set(
      approvedRecords.map((record) => `${record.areaId}:${record.parameterId}`),
    );

    for (const area of areas) {
      for (const assignment of assignmentsByAreaId.get(area.id) ?? []) {
        if (!approvedKeys.has(`${area.id}:${assignment.parameterId}`)) return false;
      }
    }
    return true;
  }

  private assertSignerRoleForLevel(level: SprCycleSignatureLevel, roles: string[]): void {
    const isAdmin = roles.includes(Role.ADMIN);
    if (isAdmin) return;

    if (level === SprCycleSignatureLevel.SPECIALIST) {
      if (!roles.includes(Role.SPR_SUSTAINABILITY_SPECIALIST)) {
        throw new ForbiddenException('Only sustainability specialists can sign at specialist level');
      }
      return;
    }

    if (level === SprCycleSignatureLevel.ENVIRONMENT_MANAGER) {
      if (!roles.includes(Role.SPR_ENVIRONMENT_MANAGER)) {
        throw new ForbiddenException('Only environment managers can sign at environment_manager level');
      }
    }
  }

  private async requireCycle(cycleId: string): Promise<SprCycleEntity> {
    const cycle = await this.cyclesRepository.findOne({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('SPR cycle not found');
    return cycle;
  }

  /** Normaliza DATE de PG (string o Date) a YYYY-MM-DD. */
  private toDateOnlyIso(value: string | Date): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
