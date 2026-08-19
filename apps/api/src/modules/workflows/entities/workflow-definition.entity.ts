import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityReferenceTypeEntity } from '../../evidences/entities/entity-reference-type.entity';
import { WorkflowDefinitionStepEntity } from './workflow-definition-step.entity';

@Entity('workflow_definitions')
export class WorkflowDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 80 })
  entityType: string;

  @ManyToOne(() => EntityReferenceTypeEntity, { nullable: false })
  @JoinColumn({ name: 'entity_type', referencedColumnName: 'code', foreignKeyConstraintName: 'fk_workflow_definitions_entity_type' })
  entityReferenceType: EntityReferenceTypeEntity;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => WorkflowDefinitionStepEntity, (step) => step.workflowDefinition, {
    cascade: ['insert'],
    eager: false,
  })
  steps: WorkflowDefinitionStepEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
