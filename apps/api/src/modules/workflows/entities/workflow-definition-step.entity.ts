import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { RoleEntity } from '../../roles/entities/role.entity';
import { WorkflowDefinitionEntity } from './workflow-definition.entity';

@Entity('workflow_definition_steps')
@Unique('uq_wds_definition_order', ['workflowDefinitionId', 'stepOrder'])
@Unique('uq_wds_definition_code', ['workflowDefinitionId', 'code'])
export class WorkflowDefinitionStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_definition_id', type: 'uuid' })
  workflowDefinitionId: string;

  @ManyToOne(() => WorkflowDefinitionEntity, (def) => def.steps, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_definition_id', foreignKeyConstraintName: 'fk_wds_definition' })
  workflowDefinition: WorkflowDefinitionEntity;

  @Column({ name: 'step_order', type: 'integer' })
  stepOrder: number;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'required_role_id', type: 'uuid', nullable: true })
  requiredRoleId: string | null;

  @ManyToOne(() => RoleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'required_role_id', foreignKeyConstraintName: 'fk_wds_role' })
  requiredRole: RoleEntity | null;

  @Column({ name: 'sla_hours', type: 'integer', nullable: true })
  slaHours: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
