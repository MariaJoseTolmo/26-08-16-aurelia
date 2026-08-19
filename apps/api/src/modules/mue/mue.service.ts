import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ControlAreaAssignmentResponse,
  ControlVerificationItemResponse,
  CriticalControlResponse,
  MueDetailResponse,
  MueResponse,
} from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { ControlAreaAssignmentEntity } from './entities/control-area-assignment.entity';
import { ControlVerificationItemEntity } from './entities/control-verification-item.entity';
import { CriticalControlEntity } from './entities/critical-control.entity';
import { MueEntity } from './entities/mue.entity';

@Injectable()
export class MueService {
  constructor(
    @InjectRepository(MueEntity)
    private readonly mues: Repository<MueEntity>,
    @InjectRepository(CriticalControlEntity)
    private readonly controls: Repository<CriticalControlEntity>,
    @InjectRepository(ControlVerificationItemEntity)
    private readonly verificationItems: Repository<ControlVerificationItemEntity>,
    @InjectRepository(ControlAreaAssignmentEntity)
    private readonly assignments: Repository<ControlAreaAssignmentEntity>,
  ) {}

  async findMues(): Promise<MueResponse[]> {
    const rows = await this.mues.find({ where: { isActive: true }, order: { code: 'ASC' } });
    return rows.map((row) => this.toMueResponse(row));
  }

  async findMue(id: string): Promise<MueDetailResponse> {
    const entity = await this.mues.findOne({ where: { id }, relations: { controls: true } });
    if (!entity) throw new NotFoundException('MUE not found');
    return { ...this.toMueResponse(entity), controls: (entity.controls ?? []).map((control) => this.toCriticalControlResponse(control)) };
  }

  async findControls(mueId?: string): Promise<CriticalControlResponse[]> {
    const rows = await this.controls.find({
      where: mueId ? { mueId, isActive: true } : { isActive: true },
      order: { code: 'ASC' },
    });
    return rows.map((row) => this.toCriticalControlResponse(row));
  }

  async findVerificationItems(criticalControlId?: string): Promise<ControlVerificationItemResponse[]> {
    const rows = await this.verificationItems.find({
      where: criticalControlId ? { criticalControlId, isActive: true } : { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
    return rows.map((row) => this.toVerificationItemResponse(row));
  }

  async findAssignments(mueId?: string): Promise<ControlAreaAssignmentResponse[]> {
    const rows = await this.assignments.find({
      where: mueId ? { mueId } : {},
      order: { areaNameSnapshot: 'ASC', responsibleNameSnapshot: 'ASC' },
    });
    return rows.map((row) => this.toAssignmentResponse(row));
  }

  private toMueResponse(entity: MueEntity): MueResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      predominantControlType: entity.predominantControlType,
      expectedMainEvidence: entity.expectedMainEvidence,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toCriticalControlResponse(entity: CriticalControlEntity): CriticalControlResponse {
    return {
      id: entity.id,
      mueId: entity.mueId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      controlType: entity.controlType,
      objective: entity.objective,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toVerificationItemResponse(entity: ControlVerificationItemEntity): ControlVerificationItemResponse {
    return {
      id: entity.id,
      criticalControlId: entity.criticalControlId,
      code: entity.code,
      question: entity.question,
      requirementText: entity.requirementText,
      evidenceType: entity.evidenceType,
      expectedEvidence: entity.expectedEvidence,
      sortOrder: entity.sortOrder,
      isRequired: entity.isRequired,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toAssignmentResponse(entity: ControlAreaAssignmentEntity): ControlAreaAssignmentResponse {
    return {
      id: entity.id,
      mueId: entity.mueId,
      criticalControlId: entity.criticalControlId,
      areaId: entity.areaId,
      gerenciaId: entity.gerenciaId,
      companyId: entity.companyId,
      responsibleUserId: entity.responsibleUserId,
      areaNameSnapshot: entity.areaNameSnapshot,
      responsibleNameSnapshot: entity.responsibleNameSnapshot,
      responsibleRole: entity.responsibleRole,
      isPrimary: entity.isPrimary,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
