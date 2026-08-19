import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { WasteSidrepStatus } from '../waste.enums';
import { WasteWithdrawalRequestEntity } from './waste-withdrawal-request.entity';

@Entity('waste_sidrep_records')
export class WasteSidrepRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'withdrawal_request_id', type: 'uuid', unique: true })
  withdrawalRequestId: string;

  @OneToOne(() => WasteWithdrawalRequestEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'withdrawal_request_id', foreignKeyConstraintName: 'fk_waste_sidrep_request' })
  withdrawalRequest: WasteWithdrawalRequestEntity;

  @Index('idx_waste_sidrep_status')
  @Column({
    type: 'enum',
    enum: WasteSidrepStatus,
    enumName: 'waste_sidrep_status',
    default: WasteSidrepStatus.AWAITING_APPROVAL,
  })
  status: WasteSidrepStatus;

  @Column({ name: 'external_folio', type: 'varchar', length: 100, nullable: true, unique: true })
  externalFolio: string | null;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt: Date | null;

  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registered_by_user_id', foreignKeyConstraintName: 'fk_waste_sidrep_registered_by' })
  registeredByUser: UserEntity | null;

  @Column({ name: 'approval_deadline_at', type: 'timestamptz', nullable: true })
  approvalDeadlineAt: Date | null;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'final_disposal_at', type: 'timestamptz', nullable: true })
  finalDisposalAt: Date | null;

  @Column({ name: 'dispatched_net_weight_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  dispatchedNetWeightKg: string | null;

  @Column({ name: 'received_weight_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  receivedWeightKg: string | null;

  @Column({ name: 'weight_difference_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  weightDifferenceKg: string | null;

  @Column({ name: 'difference_reason', type: 'text', nullable: true })
  differenceReason: string | null;

  @Column({ name: 'destination_receipt_number', type: 'varchar', length: 120, nullable: true })
  destinationReceiptNumber: string | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by_user_id', type: 'uuid', nullable: true })
  closedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by_user_id', foreignKeyConstraintName: 'fk_waste_sidrep_closed_by' })
  closedByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
