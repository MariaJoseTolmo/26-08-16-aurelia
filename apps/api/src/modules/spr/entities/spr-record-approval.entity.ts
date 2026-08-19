import { SprApprovalStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { SprMonthlyRecordEntity } from './spr-monthly-record.entity';

@Entity('spr_record_approvals')
export class SprRecordApprovalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_spr_approvals_record')
  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @ManyToOne(() => SprMonthlyRecordEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id', foreignKeyConstraintName: 'fk_spr_approval_record' })
  record: SprMonthlyRecordEntity;

  @Column({ name: 'approver_user_id', type: 'uuid', nullable: true })
  approverUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approver_user_id', foreignKeyConstraintName: 'fk_spr_approval_user' })
  approverUser: UserEntity | null;

  @Column({ type: 'enum', enum: SprApprovalStatus, enumName: 'spr_approval_status', default: SprApprovalStatus.PENDING })
  status: SprApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
