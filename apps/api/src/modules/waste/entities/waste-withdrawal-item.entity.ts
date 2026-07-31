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
import { WasteLotEntity } from './waste-lot.entity';
import { WasteUnitEntity } from './waste-unit.entity';
import { WasteWithdrawalRequestEntity } from './waste-withdrawal-request.entity';

@Entity('waste_withdrawal_items')
@Unique('uq_waste_withdrawal_items_request_lot', ['withdrawalRequestId', 'lotId'])
export class WasteWithdrawalItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_waste_withdrawal_items_request')
  @Column({ name: 'withdrawal_request_id', type: 'uuid' })
  withdrawalRequestId: string;

  @ManyToOne(() => WasteWithdrawalRequestEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'withdrawal_request_id', foreignKeyConstraintName: 'fk_waste_withdrawal_items_request' })
  withdrawalRequest: WasteWithdrawalRequestEntity;

  @Index('idx_waste_withdrawal_items_lot')
  @Column({ name: 'lot_id', type: 'uuid' })
  lotId: string;

  @ManyToOne(() => WasteLotEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lot_id', foreignKeyConstraintName: 'fk_waste_withdrawal_items_lot' })
  lot: WasteLotEntity;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => WasteUnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id', foreignKeyConstraintName: 'fk_waste_withdrawal_items_unit' })
  unit: WasteUnitEntity;

  @Column({ name: 'requested_quantity', type: 'numeric', precision: 18, scale: 6 })
  requestedQuantity: string;

  @Column({ name: 'approved_quantity', type: 'numeric', precision: 18, scale: 6, nullable: true })
  approvedQuantity: string | null;

  @Column({ name: 'withdrawn_quantity', type: 'numeric', precision: 18, scale: 6, nullable: true })
  withdrawnQuantity: string | null;

  @Column({ name: 'available_quantity_snapshot', type: 'numeric', precision: 18, scale: 6 })
  availableQuantitySnapshot: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
