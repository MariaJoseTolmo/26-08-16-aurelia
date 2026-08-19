import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  WorkflowDefinitionResponse,
  WorkflowInstanceResponse,
  WorkflowStepAction,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { EntityReferenceTypeEntity } from '../evidences/entities/entity-reference-type.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AdvanceWorkflowStepDto } from './dto/advance-workflow-step.dto';
import { CreateWorkflowDefinitionDto } from './dto/create-workflow-definition.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { WorkflowDefinitionStepEntity } from './entities/workflow-definition-step.entity';
import { WorkflowDefinitionEntity } from './entities/workflow-definition.entity';
import { WorkflowInstanceStepEntity } from './entities/workflow-instance-step.entity';
import { WorkflowInstanceEntity } from './entities/workflow-instance.entity';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowDefinitionEntity)
    private readonly definitions: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowDefinitionStepEntity)
    private readonly definitionSteps: Repository<WorkflowDefinitionStepEntity>,
    @InjectRepository(WorkflowInstanceEntity)
    private readonly instances: Repository<WorkflowInstanceEntity>,
    @InjectRepository(WorkflowInstanceStepEntity)
    private readonly instanceSteps: Repository<WorkflowInstanceStepEntity>,
    @InjectRepository(EntityReferenceTypeEntity)
    private readonly entityRefTypes: Repository<EntityReferenceTypeEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findDefinitions(): Promise<WorkflowDefinitionResponse[]> {
    const rows = await this.definitions.find({
      where: { isActive: true },
      order: { code: 'ASC' },
      relations: { steps: true },
    });
    return rows.map((r) => this.toDefinitionResponse(r));
  }

  async createDefinition(dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinitionResponse> {
    const refType = await this.entityRefTypes.findOneBy({ code: dto.entityType });
    if (!refType) throw new NotFoundException(`Entity type '${dto.entityType}' not registered`);

    const definition = this.definitions.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      entityType: dto.entityType,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.definitions.save(definition);

    if (dto.steps?.length) {
      const steps = dto.steps.map((s) =>
        this.definitionSteps.create({
          workflowDefinitionId: saved.id,
          stepOrder: s.stepOrder,
          code: s.code,
          name: s.name,
          requiredRoleId: s.requiredRoleId ?? null,
          slaHours: s.slaHours ?? null,
        }),
      );
      await this.definitionSteps.save(steps);
    }

    return this.toDefinitionResponse(await this.findDefinitionEntity(saved.id));
  }

  async start(dto: StartWorkflowDto): Promise<WorkflowInstanceResponse> {
    const definition = await this.findDefinitionEntity(dto.workflowDefinitionId);
    const refType = await this.entityRefTypes.findOneBy({ code: dto.entityType });
    if (!refType) throw new NotFoundException(`Entity type '${dto.entityType}' not registered`);
    if (definition.entityType !== dto.entityType) {
      throw new BadRequestException(
        `Workflow definition '${definition.code}' is for entity type '${definition.entityType}', not '${dto.entityType}'`,
      );
    }

    const instance = this.instances.create({
      workflowDefinitionId: definition.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      status: WorkflowInstanceStatus.RUNNING,
      startedByUserId: dto.startedByUserId ?? null,
    });
    const savedInstance = await this.instances.save(instance);

    const instanceSteps = definition.steps.map((defStep) =>
      this.instanceSteps.create({
        workflowInstanceId: savedInstance.id,
        workflowDefinitionStepId: defStep.id,
        stepOrder: defStep.stepOrder,
        code: defStep.code,
        name: defStep.name,
        status: WorkflowStepStatus.PENDING,
        assignedRoleId: defStep.requiredRoleId ?? null,
        dueAt: defStep.slaHours ? new Date(Date.now() + defStep.slaHours * 3600 * 1000) : null,
      }),
    );
    await this.instanceSteps.save(instanceSteps);

    await this.notificationsService.notifyWorkflowStarted({
      workflowInstanceId: savedInstance.id,
      entityType: savedInstance.entityType,
      entityId: savedInstance.entityId,
      startedByUserId: savedInstance.startedByUserId,
    });

    return this.toInstanceResponse(await this.findInstanceEntity(savedInstance.id));
  }

  async advance(instanceId: string, dto: AdvanceWorkflowStepDto): Promise<WorkflowInstanceResponse> {
    const instance = await this.findInstanceEntity(instanceId);
    if (instance.status !== WorkflowInstanceStatus.RUNNING) {
      throw new BadRequestException(`Workflow instance is already ${instance.status}`);
    }

    const step = instance.steps.find((s) => s.id === dto.stepId);
    if (!step) throw new NotFoundException(`Step ${dto.stepId} not found in instance ${instanceId}`);
    if (step.status !== WorkflowStepStatus.PENDING && step.status !== WorkflowStepStatus.IN_PROGRESS) {
      throw new BadRequestException(`Step is already ${step.status}`);
    }

    const newStatus = {
      [WorkflowStepAction.APPROVE]: WorkflowStepStatus.APPROVED,
      [WorkflowStepAction.RETURN]: WorkflowStepStatus.RETURNED,
      [WorkflowStepAction.REJECT]: WorkflowStepStatus.REJECTED,
    }[dto.action];

    step.status = newStatus;
    step.notes = dto.notes ?? null;
    step.completedByUserId = dto.completedByUserId ?? null;
    step.completedAt = new Date();
    await this.instanceSteps.save(step);

    const allApproved = instance.steps
      .map((s) => (s.id === step.id ? step : s))
      .every((s) => s.status === WorkflowStepStatus.APPROVED || s.status === WorkflowStepStatus.SKIPPED);

    if (allApproved || dto.action === WorkflowStepAction.REJECT) {
      instance.status = dto.action === WorkflowStepAction.REJECT
        ? WorkflowInstanceStatus.CANCELLED
        : WorkflowInstanceStatus.COMPLETED;
      instance.completedAt = new Date();
      await this.instances.save(instance);
    }

    return this.toInstanceResponse(await this.findInstanceEntity(instanceId));
  }

  async findInstances(entityType?: string, entityId?: string, status?: string): Promise<WorkflowInstanceResponse[]> {
    const qb = this.instances
      .createQueryBuilder('wi')
      .leftJoinAndSelect('wi.steps', 'steps')
      .orderBy('wi.started_at', 'DESC');

    if (entityType) qb.andWhere('wi.entity_type = :entityType', { entityType });
    if (entityId) qb.andWhere('wi.entity_id = :entityId', { entityId });
    if (status) qb.andWhere('wi.status = :status', { status });

    return (await qb.getMany()).map((r) => this.toInstanceResponse(r));
  }

  private async findDefinitionEntity(id: string): Promise<WorkflowDefinitionEntity> {
    const entity = await this.definitions.findOne({
      where: { id },
      relations: { steps: true },
      order: { steps: { stepOrder: 'ASC' } },
    });
    if (!entity) throw new NotFoundException(`Workflow definition ${id} not found`);
    return entity;
  }

  private async findInstanceEntity(id: string): Promise<WorkflowInstanceEntity> {
    const entity = await this.instances.findOne({
      where: { id },
      relations: { steps: true },
      order: { steps: { stepOrder: 'ASC' } },
    });
    if (!entity) throw new NotFoundException(`Workflow instance ${id} not found`);
    return entity;
  }

  private toDefinitionResponse(entity: WorkflowDefinitionEntity): WorkflowDefinitionResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      entityType: entity.entityType,
      isActive: entity.isActive,
      steps: (entity.steps ?? []).map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        code: s.code,
        name: s.name,
        requiredRoleId: s.requiredRoleId,
        slaHours: s.slaHours,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toInstanceResponse(entity: WorkflowInstanceEntity): WorkflowInstanceResponse {
    return {
      id: entity.id,
      workflowDefinitionId: entity.workflowDefinitionId ?? '',
      entityType: entity.entityType,
      entityId: entity.entityId,
      status: entity.status,
      startedByUserId: entity.startedByUserId,
      startedAt: entity.startedAt.toISOString(),
      completedAt: entity.completedAt ? entity.completedAt.toISOString() : null,
      steps: (entity.steps ?? []).map((s) => ({
        id: s.id,
        workflowInstanceId: s.workflowInstanceId,
        stepOrder: s.stepOrder,
        code: s.code,
        name: s.name,
        status: s.status,
        assignedToUserId: s.assignedToUserId,
        assignedRoleId: s.assignedRoleId,
        dueAt: s.dueAt ? s.dueAt.toISOString() : null,
        completedByUserId: s.completedByUserId,
        completedAt: s.completedAt ? s.completedAt.toISOString() : null,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
