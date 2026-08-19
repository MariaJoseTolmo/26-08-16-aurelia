import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { CriticalControlEntity } from './critical-control.entity';

@Entity('control_verification_items')
@Unique('uq_control_verification_items_control_code', ['criticalControlId', 'code'])
export class ControlVerificationItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_control_verification_items_control')
  @Column({ name: 'critical_control_id', type: 'uuid' })
  criticalControlId: string;

  @ManyToOne(() => CriticalControlEntity, (control) => control.verificationItems, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'critical_control_id', foreignKeyConstraintName: 'fk_control_verification_items_control' })
  criticalControl: CriticalControlEntity;

  @Column({ type: 'varchar', length: 60 })
  code: string;

  @Column({ type: 'text', nullable: true })
  question: string | null;

  @Column({ name: 'requirement_text', type: 'text', nullable: true })
  requirementText: string | null;

  @Column({ name: 'evidence_type', type: 'varchar', length: 80, nullable: true })
  evidenceType: string | null;

  @Column({ name: 'expected_evidence', type: 'text', nullable: true })
  expectedEvidence: string | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
