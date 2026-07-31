import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionAiAssessmentKind,
  InspectionAiAssessmentResponse,
  InspectionAiDecision,
  InspectionAiPreValidationRequest,
  InspectionEvidenceRelationType,
  InspectionFindingStatus,
  InspectionProcessRequestResponse,
  InspectionProcessRequestStatus,
  InspectionProcessRequestType,
  RecordInspectionAiDecisionRequest,
  ResubmitInspectionEvidenceRequest,
} from '@aurelia/contracts';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { EntityReferenceTypeEntity } from '../evidences/entities/entity-reference-type.entity';
import { EvidenceLinkEntity } from '../evidences/entities/evidence-link.entity';
import { EvidenceEntity } from '../evidences/entities/evidence.entity';
import { InspectionAiAssessmentEntity } from './entities/inspection-ai-assessment.entity';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionProcessRequestEntity } from './entities/inspection-process-request.entity';
import { InspectionEntity } from './entities/inspection.entity';

@Injectable()
export class InspectionProcessService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionProcessRequestEntity)
    private readonly processRequests: Repository<InspectionProcessRequestEntity>,
    @InjectRepository(InspectionAiAssessmentEntity)
    private readonly aiAssessments: Repository<InspectionAiAssessmentEntity>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async resubmitEvidence(
    findingId: string,
    dto: ResubmitInspectionEvidenceRequest,
    actorUserId: string,
  ): Promise<InspectionProcessRequestResponse> {
    if (dto.evidenceIds.length === 0) {
      throw new BadRequestException('At least one evidence is required');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const findingRepository = manager.getRepository(InspectionFindingEntity);
      const requestRepository = manager.getRepository(InspectionProcessRequestEntity);
      const evidenceRepository = manager.getRepository(EvidenceEntity);
      const evidenceLinkRepository = manager.getRepository(EvidenceLinkEntity);
      const referenceTypeRepository = manager.getRepository(EntityReferenceTypeEntity);
      const finding = await findingRepository.findOne({
        where: { id: findingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!finding) throw new NotFoundException(`Inspection finding ${findingId} not found`);
      if (finding.status !== InspectionFindingStatus.REJECTED) {
        throw new BadRequestException('Only rejected findings can resubmit evidence');
      }

      const referenceType = await referenceTypeRepository.findOneBy({ code: 'inspection_finding' });
      if (!referenceType) {
        throw new NotFoundException("Entity type 'inspection_finding' not registered");
      }

      for (const evidenceId of dto.evidenceIds) {
        const evidence = await evidenceRepository.findOneBy({ id: evidenceId });
        if (!evidence) throw new NotFoundException(`Evidence ${evidenceId} not found`);
        const relationType = InspectionEvidenceRelationType.AFTER_PHOTO;
        const existingLink = await evidenceLinkRepository.findOne({
          where: {
            evidenceId,
            entityType: referenceType.code,
            entityId: finding.id,
            relationType,
          },
        });
        if (!existingLink) {
          await evidenceLinkRepository.save(evidenceLinkRepository.create({
            evidenceId,
            entityType: referenceType.code,
            entityId: finding.id,
            relationType,
          }));
        }
      }

      const previousIterations = await requestRepository.count({
        where: {
          findingId,
          type: InspectionProcessRequestType.EVIDENCE_RESUBMISSION,
        },
      });
      const now = new Date();
      const processRequest = requestRepository.create({
        findingId,
        type: InspectionProcessRequestType.EVIDENCE_RESUBMISSION,
        status: InspectionProcessRequestStatus.COMPLETED,
        reason: dto.reason,
        requestedDueAt: null,
        resolvedDueAt: null,
        iteration: previousIterations + 1,
        requestedByUserId: actorUserId,
        resolvedByUserId: actorUserId,
        resolutionReason: 'Evidence resubmitted for human review',
        metadata: {
          evidenceIds: dto.evidenceIds,
          executedActionDescription: dto.executedActionDescription ?? null,
        },
        resolvedAt: now,
      });

      const previousStatus = finding.status;
      finding.status = InspectionFindingStatus.IN_PROGRESS;
      finding.executedActionDescription = dto.executedActionDescription ?? finding.executedActionDescription;
      finding.executedAt = now;
      finding.executedByUserId = actorUserId;
      finding.closedAt = null;
      finding.closedByUserId = null;
      finding.rejectedAt = null;
      finding.rejectedByUserId = null;

      const savedRequest = await requestRepository.save(processRequest);
      await findingRepository.save(finding);
      return { savedRequest, finding, previousStatus };
    });

    await this.audit.logSafe({
      entityType: 'inspection_finding',
      entityId: result.finding.id,
      actorUserId,
      action: 'inspection.finding.evidence_resubmitted',
      oldValue: { status: result.previousStatus },
      newValue: {
        status: result.finding.status,
        iteration: result.savedRequest.iteration,
        evidenceIds: dto.evidenceIds,
      },
      metadata: {
        processRequestId: result.savedRequest.id,
        inspectionId: result.finding.inspectionId,
      },
    });

    return this.toProcessRequestResponse(result.savedRequest);
  }

  async preValidate(
    inspectionId: string,
    dto: InspectionAiPreValidationRequest,
    actorUserId: string,
  ): Promise<InspectionAiAssessmentResponse> {
    const inspection = await this.inspections.findOneBy({ id: inspectionId });
    if (!inspection) throw new NotFoundException(`Inspection ${inspectionId} not found`);

    if (dto.findingId) {
      const finding = await this.getFindingOrThrow(dto.findingId);
      if (finding.inspectionId !== inspectionId) {
        throw new BadRequestException('The finding does not belong to the inspection');
      }
    }

    const existingFindings = await this.findings.find({ where: { inspectionId } });
    const candidateText = this.normalizeText(`${dto.title} ${dto.detectedCondition ?? ''}`);
    const duplicate = existingFindings
      .filter((finding) => finding.id !== dto.findingId)
      .map((finding) => ({
        finding,
        score: this.jaccardSimilarity(
          candidateText,
          this.normalizeText(`${finding.title} ${finding.detectedCondition ?? finding.description ?? ''}`),
        ),
      }))
      .sort((left, right) => right.score - left.score)[0] ?? null;

    const missingFields: string[] = [];
    if (!dto.detectedCondition?.trim()) missingFields.push('detectedCondition');
    if (!dto.proposedCorrectiveAction?.trim()) missingFields.push('proposedCorrectiveAction');
    if (!dto.severity) missingFields.push('severity');
    if (!dto.companyId && !inspection.companyId) missingFields.push('companyId');
    if (!dto.areaId && !inspection.areaId) missingFields.push('areaId');

    const duplicateScore = duplicate?.score ?? 0;
    const isPotentialDuplicate = duplicateScore >= 0.65;
    const completeness = (5 - missingFields.length) / 5;
    const confidence = Number(
      Math.min(0.99, Math.max(0.5, isPotentialDuplicate ? duplicateScore : 0.5 + completeness * 0.45)).toFixed(4),
    );
    const explanation = [
      ...missingFields.map((field) => `Falta completar ${field}`),
      ...(isPotentialDuplicate
        ? [`Coincidencia de ${(duplicateScore * 100).toFixed(0)}% con un hallazgo existente`]
        : []),
      ...(!isPotentialDuplicate && missingFields.length === 0
        ? ['Campos mínimos completos para revisión humana']
        : []),
    ];
    const recommendation = isPotentialDuplicate
      ? 'possible_duplicate'
      : missingFields.length > 0
        ? 'complete_required_fields'
        : 'ready_for_human_review';

    const assessment = this.aiAssessments.create({
      inspectionId,
      findingId: dto.findingId ?? null,
      kind: isPotentialDuplicate
        ? InspectionAiAssessmentKind.DUPLICATE
        : InspectionAiAssessmentKind.PRE_VALIDATION,
      confidence: confidence.toFixed(4),
      recommendation,
      explanation,
      duplicateFindingId: isPotentialDuplicate ? duplicate?.finding.id ?? null : null,
      suggestedData: {
        missingFields,
        duplicateScore: Number(duplicateScore.toFixed(4)),
        companyId: dto.companyId ?? inspection.companyId,
        areaId: dto.areaId ?? inspection.areaId,
        severity: dto.severity ?? null,
      },
      decision: InspectionAiDecision.PENDING,
      decisionReason: null,
      decidedByUserId: null,
      decidedAt: null,
    });
    const saved = await this.aiAssessments.save(assessment);

    await this.audit.logSafe({
      entityType: 'inspection_ai_assessment',
      entityId: saved.id,
      actorUserId,
      action: 'inspection.ai.pre_validation_created',
      newValue: {
        inspectionId,
        findingId: saved.findingId,
        kind: saved.kind,
        confidence,
        recommendation,
      },
    });

    return this.toAiAssessmentResponse(saved);
  }

  async recordAiDecision(
    assessmentId: string,
    dto: RecordInspectionAiDecisionRequest,
    actorUserId: string,
  ): Promise<InspectionAiAssessmentResponse> {
    if (dto.decision === InspectionAiDecision.PENDING) {
      throw new BadRequestException('A human decision cannot be pending');
    }
    const assessment = await this.getAssessmentOrThrow(assessmentId);
    const previousDecision = assessment.decision;
    assessment.decision = dto.decision;
    assessment.decisionReason = dto.reason;
    assessment.decidedByUserId = actorUserId;
    assessment.decidedAt = new Date();
    const saved = await this.aiAssessments.save(assessment);

    await this.audit.logSafe({
      entityType: 'inspection_ai_assessment',
      entityId: saved.id,
      actorUserId,
      action: 'inspection.ai.human_decision_recorded',
      oldValue: { decision: previousDecision },
      newValue: { decision: saved.decision, reason: saved.decisionReason },
      metadata: { inspectionId: saved.inspectionId, findingId: saved.findingId },
    });

    return this.toAiAssessmentResponse(saved);
  }

  async findAiAssessments(inspectionId: string): Promise<InspectionAiAssessmentResponse[]> {
    return (
      await this.aiAssessments.find({
        where: { inspectionId },
        order: { createdAt: 'DESC' },
      })
    ).map((assessment) => this.toAiAssessmentResponse(assessment));
  }

  async getAssessmentInspectionId(assessmentId: string): Promise<string> {
    return (await this.getAssessmentOrThrow(assessmentId)).inspectionId;
  }

  private async getFindingOrThrow(id: string): Promise<InspectionFindingEntity> {
    const finding = await this.findings.findOneBy({ id });
    if (!finding) throw new NotFoundException(`Inspection finding ${id} not found`);
    return finding;
  }

  private async getAssessmentOrThrow(id: string): Promise<InspectionAiAssessmentEntity> {
    const assessment = await this.aiAssessments.findOneBy({ id });
    if (!assessment) throw new NotFoundException(`Inspection AI assessment ${id} not found`);
    return assessment;
  }

  private normalizeText(value: string): Set<string> {
    const tokens = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 3);
    return new Set(tokens);
  }

  private jaccardSimilarity(left: Set<string>, right: Set<string>): number {
    if (left.size === 0 || right.size === 0) return 0;
    let intersection = 0;
    left.forEach((token) => {
      if (right.has(token)) intersection += 1;
    });
    const union = new Set([...left, ...right]).size;
    return union === 0 ? 0 : intersection / union;
  }

  private toProcessRequestResponse(entity: InspectionProcessRequestEntity): InspectionProcessRequestResponse {
    return {
      id: entity.id,
      findingId: entity.findingId,
      type: entity.type,
      status: entity.status,
      reason: entity.reason,
      requestedDueAt: entity.requestedDueAt?.toISOString() ?? null,
      resolvedDueAt: entity.resolvedDueAt?.toISOString() ?? null,
      iteration: entity.iteration,
      requestedByUserId: entity.requestedByUserId,
      resolvedByUserId: entity.resolvedByUserId,
      resolutionReason: entity.resolutionReason,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      resolvedAt: entity.resolvedAt?.toISOString() ?? null,
    };
  }

  private toAiAssessmentResponse(entity: InspectionAiAssessmentEntity): InspectionAiAssessmentResponse {
    return {
      id: entity.id,
      inspectionId: entity.inspectionId,
      findingId: entity.findingId,
      kind: entity.kind,
      confidence: Number(entity.confidence),
      recommendation: entity.recommendation,
      explanation: entity.explanation,
      duplicateFindingId: entity.duplicateFindingId,
      suggestedData: entity.suggestedData,
      decision: entity.decision,
      decisionReason: entity.decisionReason,
      decidedByUserId: entity.decidedByUserId,
      decidedAt: entity.decidedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
