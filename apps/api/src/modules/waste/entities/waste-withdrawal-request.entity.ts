import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { LocationEntity } from '../../organization/entities/location.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { WasteApprovalStatus, WasteWithdrawalStatus } from '../waste.enums';
import { WasteWarehouseEntity } from './waste-warehouse.entity';

@Entity('waste_withdrawal_requests')
export class WasteWithdrawalRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_number', type: 'varchar', length: 80, unique: true })
  requestNumber: string;

  @Index('idx_waste_withdrawals_warehouse')
  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => WasteWarehouseEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id', foreignKeyConstraintName: 'fk_waste_withdrawals_warehouse' })
  warehouse: WasteWarehouseEntity;

  @Column({ name: 'is_hazardous', type: 'boolean' })
  isHazardous: boolean;

  @Index('idx_waste_withdrawals_status')
  @Column({
    type: 'enum',
    enum: WasteWithdrawalStatus,
    enumName: 'waste_withdrawal_status',
    default: WasteWithdrawalStatus.DRAFT,
  })
  status: WasteWithdrawalStatus;

  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: WasteApprovalStatus,
    enumName: 'waste_approval_status',
    default: WasteApprovalStatus.NOT_REQUIRED,
  })
  approvalStatus: WasteApprovalStatus;

  @Column({ name: 'requested_by_user_id', type: 'uuid', nullable: true })
  requestedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id', foreignKeyConstraintName: 'fk_waste_withdrawals_requested_by' })
  requestedByUser: UserEntity | null;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'now()' })
  requestedAt: Date;

  @Column({ name: 'transport_company_id', type: 'uuid', nullable: true })
  transportCompanyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transport_company_id', foreignKeyConstraintName: 'fk_waste_withdrawals_transport_company' })
  transportCompany: CompanyEntity | null;

  @Column({ name: 'destination_company_id', type: 'uuid', nullable: true })
  destinationCompanyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destination_company_id', foreignKeyConstraintName: 'fk_waste_withdrawals_destination_company' })
  destinationCompany: CompanyEntity | null;

  @Column({ name: 'destination_location_id', type: 'uuid', nullable: true })
  destinationLocationId: string | null;

  @ManyToOne(() => LocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destination_location_id', foreignKeyConstraintName: 'fk_waste_withdrawals_destination_location' })
  destinationLocation: LocationEntity | null;

  @Column({ name: 'vehicle_plate', type: 'varchar', length: 30, nullable: true })
  vehiclePlate: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 180, nullable: true })
  driverName: string | null;

  @Column({ name: 'gross_weight_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  grossWeightKg: string | null;

  @Column({ name: 'tare_weight_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  tareWeightKg: string | null;

  @Column({ name: 'net_weight_kg', type: 'numeric', precision: 18, scale: 3, nullable: true })
  netWeightKg: string | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_user_id', foreignKeyConstraintName: 'fk_waste_withdrawals_approved_by' })
  approvedByUser: UserEntity | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'rejected_by_user_id', type: 'uuid', nullable: true })
  rejectedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rejected_by_user_id', foreignKeyConstraintName: 'fk_waste_withdrawals_rejected_by' })
  rejectedByUser: UserEntity | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'registered_at', type: 'timestamptz', nullable: true })
  registeredAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by_user_id', type: 'uuid', nullable: true })
  closedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by_user_id', foreignKeyConstraintName: 'fk_waste_withdrawals_closed_by' })
  closedByUser: UserEntity | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
