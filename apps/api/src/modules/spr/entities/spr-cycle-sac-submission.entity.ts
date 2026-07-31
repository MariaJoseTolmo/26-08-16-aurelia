import { SprCycleSacSubmissionStatus } from '@aurelia/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { SprCycleEntity } from './spr-cycle.entity';

@Entity('spr_cycle_sac_submissions')
@Unique('uq_spr_cycle_sac_submissions_cycle', ['cycleId'])
export class SprCycleSacSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_sac_cycle')
  @Column({ name: 'cycle_id', type: 'uuid' })
  cycleId: string;

  @ManyToOne(() => SprCycleEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cycle_id', foreignKeyConstraintName: 'fk_spr_sac_cycle' })
  cycle: SprCycleEntity;

  @Index('idx_spr_sac_status')
  @Column({
    type: 'enum',
    enum: SprCycleSacSubmissionStatus,
    enumName: 'spr_cycle_sac_submission_status',
    default: SprCycleSacSubmissionStatus.PENDING,
  })
  status: SprCycleSacSubmissionStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'report_ready_at', type: 'timestamptz', nullable: true })
  reportReadyAt: Date | null;

  @Column({ name: 'external_ref', type: 'varchar', length: 120, nullable: true })
  externalRef: string | null;

  @Column({ name: 'payload_snapshot', type: 'jsonb', nullable: true })
  payloadSnapshot: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
