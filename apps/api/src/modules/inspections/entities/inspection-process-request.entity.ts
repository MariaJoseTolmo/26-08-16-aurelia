import { InspectionProcessRequestStatus, InspectionProcessRequestType } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionFindingEntity } from './inspection-finding.entity';

@Entity('inspection_process_requests')
@Index('idx_inspection_process_requests_finding_type', ['findingId', 'type'])
@Index('idx_inspection_process_requests_status', ['status'])
export class InspectionProcessRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finding_id', type: 'uuid' })
  findingId: string;

  @ManyToOne(() => InspectionFindingEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'finding_id', foreignKeyConstraintName: 'fk_ipr_finding' })
  finding: InspectionFindingEntity;

  @Column({ type: 'enum', enum: InspectionProcessRequestType, enumName: 'inspection_process_request_type' })
  type: InspectionProcessRequestType;

  @Column({ type: 'enum', enum: InspectionProcessRequestStatus, enumName: 'inspection_process_request_status', default: InspectionProcessRequestStatus.PENDING })
  status: InspectionProcessRequestStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'requested_due_at', type: 'timestamptz', nullable: true })
  requestedDueAt: Date | null;

  @Column({ name: 'resolved_due_at', type: 'timestamptz', nullable: true })
  resolvedDueAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  iteration: number | null;

  @Column({ name: 'requested_by_user_id', type: 'uuid', nullable: true })
  requestedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id', foreignKeyConstraintName: 'fk_ipr_requested_by' })
  requestedByUser: UserEntity | null;

  @Column({ name: 'resolved_by_user_id', type: 'uuid', nullable: true })
  resolvedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_user_id', foreignKeyConstraintName: 'fk_ipr_resolved_by' })
  resolvedByUser: UserEntity | null;

  @Column({ name: 'resolution_reason', type: 'text', nullable: true })
  resolutionReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
