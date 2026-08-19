import { InspectionFindingSeverity, InspectionFindingStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { InspectionFormItemEntity } from './inspection-form-item.entity';
import { InspectionFindingSeverityEntity } from './inspection-finding-severity.entity';
import { InspectionFindingTypeEntity } from './inspection-finding-type.entity';
import { InspectionEntity } from './inspection.entity';

@Entity('inspection_findings')
export class InspectionFindingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_id', type: 'uuid' })
  inspectionId: string;

  @ManyToOne(() => InspectionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspection_id', foreignKeyConstraintName: 'fk_if_inspection' })
  inspection: InspectionEntity;

  @Column({ name: 'checklist_item_id', type: 'uuid', nullable: true })
  checklistItemId: string | null;

  @ManyToOne(() => InspectionFormItemEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'checklist_item_id', foreignKeyConstraintName: 'fk_if_item' })
  checklistItem: InspectionFormItemEntity | null;

  @Index('idx_inspection_findings_type')
  @Column({ name: 'finding_type_id', type: 'uuid', nullable: true })
  findingTypeId: string | null;

  @ManyToOne(() => InspectionFindingTypeEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'finding_type_id', foreignKeyConstraintName: 'fk_inspection_findings_type' })
  findingType: InspectionFindingTypeEntity | null;

  @Index('idx_inspection_findings_severity_catalog')
  @Column({ name: 'severity_id', type: 'uuid', nullable: true })
  severityId: string | null;

  @ManyToOne(() => InspectionFindingSeverityEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'severity_id', foreignKeyConstraintName: 'fk_inspection_findings_severity_catalog' })
  severityCatalog: InspectionFindingSeverityEntity | null;

  @Index('idx_inspection_findings_responsible_company')
  @Column({ name: 'responsible_company_id', type: 'uuid', nullable: true })
  responsibleCompanyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsible_company_id', foreignKeyConstraintName: 'fk_inspection_findings_responsible_company' })
  responsibleCompany: CompanyEntity | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'detected_condition', type: 'text', nullable: true })
  detectedCondition: string | null;

  @Column({ name: 'proposed_corrective_action', type: 'text', nullable: true })
  proposedCorrectiveAction: string | null;

  @Column({ name: 'executed_action_description', type: 'text', nullable: true })
  executedActionDescription: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'enum', enum: InspectionFindingSeverity, enumName: 'inspection_finding_severity' })
  severity: InspectionFindingSeverity;

  @Column({ type: 'enum', enum: InspectionFindingStatus, enumName: 'inspection_finding_status', default: InspectionFindingStatus.OPEN })
  status: InspectionFindingStatus;

  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_user_id', foreignKeyConstraintName: 'fk_if_owner' })
  ownerUser: UserEntity | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id', foreignKeyConstraintName: 'fk_if_created_by' })
  createdByUser: UserEntity | null;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'executed_at', type: 'timestamptz', nullable: true })
  executedAt: Date | null;

  @Column({ name: 'executed_by_user_id', type: 'uuid', nullable: true })
  executedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'executed_by_user_id', foreignKeyConstraintName: 'fk_if_executed_by' })
  executedByUser: UserEntity | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by_user_id', type: 'uuid', nullable: true })
  closedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by_user_id', foreignKeyConstraintName: 'fk_if_closed_by' })
  closedByUser: UserEntity | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'rejected_by_user_id', type: 'uuid', nullable: true })
  rejectedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rejected_by_user_id', foreignKeyConstraintName: 'fk_if_rejected_by' })
  rejectedByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
