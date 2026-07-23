import { InspectionAiAssessmentKind, InspectionAiDecision } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionFindingEntity } from './inspection-finding.entity';
import { InspectionEntity } from './inspection.entity';

@Entity('inspection_ai_assessments')
@Index('idx_inspection_ai_assessments_inspection', ['inspectionId'])
@Index('idx_inspection_ai_assessments_finding', ['findingId'])
export class InspectionAiAssessmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_id', type: 'uuid' })
  inspectionId: string;

  @ManyToOne(() => InspectionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspection_id', foreignKeyConstraintName: 'fk_iaa_inspection' })
  inspection: InspectionEntity;

  @Column({ name: 'finding_id', type: 'uuid', nullable: true })
  findingId: string | null;

  @ManyToOne(() => InspectionFindingEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'finding_id', foreignKeyConstraintName: 'fk_iaa_finding' })
  finding: InspectionFindingEntity | null;

  @Column({ type: 'enum', enum: InspectionAiAssessmentKind, enumName: 'inspection_ai_assessment_kind' })
  kind: InspectionAiAssessmentKind;

  @Column({ type: 'numeric', precision: 5, scale: 4 })
  confidence: string;

  @Column({ type: 'text' })
  recommendation: string;

  @Column({ type: 'jsonb' })
  explanation: string[];

  @Column({ name: 'duplicate_finding_id', type: 'uuid', nullable: true })
  duplicateFindingId: string | null;

  @Column({ name: 'suggested_data', type: 'jsonb', nullable: true })
  suggestedData: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: InspectionAiDecision, enumName: 'inspection_ai_decision', default: InspectionAiDecision.PENDING })
  decision: InspectionAiDecision;

  @Column({ name: 'decision_reason', type: 'text', nullable: true })
  decisionReason: string | null;

  @Column({ name: 'decided_by_user_id', type: 'uuid', nullable: true })
  decidedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decided_by_user_id', foreignKeyConstraintName: 'fk_iaa_decided_by' })
  decidedByUser: UserEntity | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
