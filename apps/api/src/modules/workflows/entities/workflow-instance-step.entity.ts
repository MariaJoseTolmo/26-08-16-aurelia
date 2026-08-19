import { WorkflowStepStatus } from '@aurelia/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleEntity } from '../../roles/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkflowDefinitionStepEntity } from './workflow-definition-step.entity';
import { WorkflowInstanceEntity } from './workflow-instance.entity';

@Entity('workflow_instance_steps')
@Index('idx_wis_instance', ['workflowInstanceId'])
export class WorkflowInstanceStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_instance_id', type: 'uuid' })
  workflowInstanceId: string;

  @ManyToOne(() => WorkflowInstanceEntity, (instance) => instance.steps, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_instance_id', foreignKeyConstraintName: 'fk_wis_instance' })
  workflowInstance: WorkflowInstanceEntity;

  @Column({ name: 'workflow_definition_step_id', type: 'uuid', nullable: true })
  workflowDefinitionStepId: string | null;

  @ManyToOne(() => WorkflowDefinitionStepEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'workflow_definition_step_id', foreignKeyConstraintName: 'fk_wis_definition_step' })
  workflowDefinitionStep: WorkflowDefinitionStepEntity | null;

  @Column({ name: 'step_order', type: 'integer' })
  stepOrder: number;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index('idx_wis_status')
  @Column({
    type: 'enum',
    enum: WorkflowStepStatus,
    enumName: 'workflow_step_status',
    default: WorkflowStepStatus.PENDING,
  })
  status: WorkflowStepStatus;

  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_user_id', foreignKeyConstraintName: 'fk_wis_assigned_to' })
  assignedToUser: UserEntity | null;

  @Column({ name: 'assigned_role_id', type: 'uuid', nullable: true })
  assignedRoleId: string | null;

  @ManyToOne(() => RoleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_role_id', foreignKeyConstraintName: 'fk_wis_assigned_role' })
  assignedRole: RoleEntity | null;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'completed_by_user_id', type: 'uuid', nullable: true })
  completedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'completed_by_user_id', foreignKeyConstraintName: 'fk_wis_completed_by' })
  completedByUser: UserEntity | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
