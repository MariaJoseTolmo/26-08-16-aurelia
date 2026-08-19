import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ControlAnswerValue,
  ControlAssessmentStatus,
  ControlSelfAssessment,
  ControlSelfAssessmentAnswer,
} from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { ControlSelfAssessmentAnswerEntity } from '../mue/entities/control-self-assessment-answer.entity';
import { ControlSelfAssessmentEntity } from '../mue/entities/control-self-assessment.entity';
import { ControlVerificationItemEntity } from '../mue/entities/control-verification-item.entity';
import { CreateControlSelfAssessmentDto, UpsertControlSelfAssessmentAnswersDto } from './dto/create-control-self-assessment.dto';

@Injectable()
export class CriticalControlsService {
  constructor(
    @InjectRepository(ControlSelfAssessmentEntity)
    private readonly assessments: Repository<ControlSelfAssessmentEntity>,
    @InjectRepository(ControlSelfAssessmentAnswerEntity)
    private readonly answers: Repository<ControlSelfAssessmentAnswerEntity>,
    @InjectRepository(ControlVerificationItemEntity)
    private readonly verificationItems: Repository<ControlVerificationItemEntity>,
  ) {}

  async createAssessment(dto: CreateControlSelfAssessmentDto, createdByUserId: string | null): Promise<ControlSelfAssessment> {
    const assessment = await this.assessments.save(
      this.assessments.create({
        mueId: dto.mueId,
        criticalControlId: dto.criticalControlId ?? null,
        areaId: dto.areaId ?? null,
        gerenciaId: dto.gerenciaId ?? null,
        companyId: dto.companyId ?? null,
        periodYear: dto.periodYear,
        periodMonth: dto.periodMonth,
        status: ControlAssessmentStatus.DRAFT,
        createdByUserId,
      }),
    );
    return this.findAssessment(assessment.id);
  }

  async findAssessments(mueId?: string, status?: string): Promise<ControlSelfAssessment[]> {
    const rows = await this.assessments.find({
      where: {
        ...(mueId ? { mueId } : {}),
        ...(status ? { status } : {}),
      },
      relations: { answers: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toAssessmentResponse(row));
  }

  async findAssessment(id: string): Promise<ControlSelfAssessment> {
    const assessment = await this.findAssessmentEntity(id);
    return this.toAssessmentResponse(assessment);
  }

  async upsertAnswers(id: string, dto: UpsertControlSelfAssessmentAnswersDto): Promise<ControlSelfAssessment> {
    const assessment = await this.findAssessmentEntity(id);
    if (assessment.status !== ControlAssessmentStatus.DRAFT) throw new BadRequestException('Only draft assessments can be edited');

    for (const input of dto.answers) {
      const item = await this.verificationItems.findOneBy({ id: input.verificationItemId });
      if (!item) throw new NotFoundException(`Verification item ${input.verificationItemId} not found`);

      const current = await this.answers.findOneBy({ assessmentId: id, verificationItemId: input.verificationItemId });
      const answer = current ?? this.answers.create({ assessmentId: id, verificationItemId: input.verificationItemId });
      answer.answer = input.answer;
      answer.comment = input.comment ?? null;
      answer.riskLevel = input.riskLevel ?? null;
      answer.actionRequired = input.actionRequired ?? input.answer === ControlAnswerValue.NO;
      await this.answers.save(answer);
    }

    await this.recalculateScore(id);
    return this.findAssessment(id);
  }

  async submitAssessment(id: string, submittedByUserId: string | null): Promise<ControlSelfAssessment> {
    const assessment = await this.findAssessmentEntity(id);
    if (assessment.status !== ControlAssessmentStatus.DRAFT) throw new BadRequestException('Only draft assessments can be submitted');
    if (!assessment.answers?.length) throw new BadRequestException('Assessment has no answers');

    assessment.status = ControlAssessmentStatus.SUBMITTED;
    assessment.submittedByUserId = submittedByUserId;
    assessment.submittedAt = new Date();
    await this.assessments.save(assessment);
    return this.findAssessment(id);
  }

  private async findAssessmentEntity(id: string): Promise<ControlSelfAssessmentEntity> {
    const assessment = await this.assessments.findOne({
      where: { id },
      relations: { answers: { verificationItem: true } },
      order: { answers: { createdAt: 'ASC' } },
    });
    if (!assessment) throw new NotFoundException('Control self assessment not found');
    return assessment;
  }

  private async recalculateScore(assessmentId: string): Promise<void> {
    const rows = await this.answers.find({ where: { assessmentId } });
    const applicable = rows.filter((row) => row.answer !== ControlAnswerValue.NOT_APPLICABLE && row.answer !== ControlAnswerValue.NOT_OBSERVED);
    if (applicable.length === 0) {
      await this.assessments.update(assessmentId, { complianceScore: null });
      return;
    }

    const points = applicable.reduce((total, row) => {
      if (row.answer === ControlAnswerValue.YES) return total + 100;
      if (row.answer === ControlAnswerValue.PARTIAL) return total + 50;
      return total;
    }, 0);
    const score = (points / applicable.length).toFixed(2);
    await this.assessments.update(assessmentId, { complianceScore: score });
  }

  private toAssessmentResponse(entity: ControlSelfAssessmentEntity): ControlSelfAssessment {
    return {
      id: entity.id,
      mueId: entity.mueId,
      criticalControlId: entity.criticalControlId,
      areaId: entity.areaId,
      gerenciaId: entity.gerenciaId,
      companyId: entity.companyId,
      periodYear: entity.periodYear,
      periodMonth: entity.periodMonth,
      status: entity.status as ControlAssessmentStatus,
      complianceScore: entity.complianceScore === null ? null : Number(entity.complianceScore),
      createdByUserId: entity.createdByUserId,
      submittedByUserId: entity.submittedByUserId,
      validatedByUserId: entity.validatedByUserId,
      submittedAt: entity.submittedAt ? entity.submittedAt.toISOString() : null,
      validatedAt: entity.validatedAt ? entity.validatedAt.toISOString() : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      answers: (entity.answers ?? []).map((answer) => this.toAnswerResponse(answer)),
    };
  }

  private toAnswerResponse(entity: ControlSelfAssessmentAnswerEntity): ControlSelfAssessmentAnswer {
    return {
      id: entity.id,
      assessmentId: entity.assessmentId,
      verificationItemId: entity.verificationItemId,
      answer: entity.answer as ControlAnswerValue,
      comment: entity.comment,
      riskLevel: entity.riskLevel,
      actionRequired: entity.actionRequired,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
