import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ControlEvidenceEntity } from './control-evidence.entity';
import { ControlSelfAssessmentEntity } from './control-self-assessment.entity';
import { ControlVerificationItemEntity } from './control-verification-item.entity';

@Entity('control_self_assessment_answers')
@Unique('uq_control_self_assessment_answers_item', ['assessmentId', 'verificationItemId'])
export class ControlSelfAssessmentAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_control_self_assessment_answers_assessment')
  @Column({ name: 'assessment_id', type: 'uuid' })
  assessmentId: string;

  @ManyToOne(() => ControlSelfAssessmentEntity, (assessment) => assessment.answers, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id', foreignKeyConstraintName: 'fk_control_self_assessment_answers_assessment' })
  assessment: ControlSelfAssessmentEntity;

  @Column({ name: 'verification_item_id', type: 'uuid' })
  verificationItemId: string;

  @ManyToOne(() => ControlVerificationItemEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_item_id', foreignKeyConstraintName: 'fk_control_self_assessment_answers_item' })
  verificationItem: ControlVerificationItemEntity;

  @Column({ type: 'varchar', length: 40 })
  answer: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'risk_level', type: 'varchar', length: 40, nullable: true })
  riskLevel: string | null;

  @Column({ name: 'action_required', type: 'boolean', default: false })
  actionRequired: boolean;

  @OneToMany(() => ControlEvidenceEntity, (evidence) => evidence.answer)
  evidences: ControlEvidenceEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
