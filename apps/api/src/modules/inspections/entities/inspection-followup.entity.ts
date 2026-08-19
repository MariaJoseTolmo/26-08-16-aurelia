import { InspectionFollowupStatus } from '@aurelia/contracts';
import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionFindingEntity } from './inspection-finding.entity';

@Entity('inspection_followups')
@Unique('uq_ifu_finding_sequence', ['findingId', 'sequenceNumber'])
@Check('chk_ifu_sequence', '"sequence_number" BETWEEN 1 AND 3')
export class InspectionFollowupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finding_id', type: 'uuid' })
  findingId: string;

  @ManyToOne(() => InspectionFindingEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'finding_id', foreignKeyConstraintName: 'fk_ifu_finding' })
  finding: InspectionFindingEntity;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber: number;

  @Column({
    type: 'enum',
    enum: InspectionFollowupStatus,
    enumName: 'inspection_followup_status',
    default: InspectionFollowupStatus.PENDING,
  })
  status: InspectionFollowupStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'performed_by_user_id', type: 'uuid', nullable: true })
  performedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performed_by_user_id', foreignKeyConstraintName: 'fk_ifu_user' })
  performedByUser: UserEntity | null;

  @Column({ name: 'performed_at', type: 'timestamptz', nullable: true })
  performedAt: Date | null;

  @Column({ name: 'next_due_at', type: 'timestamptz', nullable: true })
  nextDueAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
