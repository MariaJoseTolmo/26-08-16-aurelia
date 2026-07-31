import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { WasteMovementType } from '../waste.enums';
import { WasteLotEntity } from './waste-lot.entity';
import { WasteUnitEntity } from './waste-unit.entity';
import { WasteWithdrawalRequestEntity } from './waste-withdrawal-request.entity';

@Entity('waste_inventory_movements')
export class WasteInventoryMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_waste_inventory_movements_lot')
  @Column({ name: 'lot_id', type: 'uuid' })
  lotId: string;

  @ManyToOne(() => WasteLotEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lot_id', foreignKeyConstraintName: 'fk_waste_inventory_movements_lot' })
  lot: WasteLotEntity;

  @Index('idx_waste_inventory_movements_type')
  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: WasteMovementType,
    enumName: 'waste_movement_type',
  })
  movementType: WasteMovementType;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  quantity: string;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => WasteUnitEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id', foreignKeyConstraintName: 'fk_waste_inventory_movements_unit' })
  unit: WasteUnitEntity;

  @Column({ name: 'previous_quantity', type: 'numeric', precision: 18, scale: 6 })
  previousQuantity: string;

  @Column({ name: 'resulting_quantity', type: 'numeric', precision: 18, scale: 6 })
  resultingQuantity: string;

  @Column({ name: 'withdrawal_request_id', type: 'uuid', nullable: true })
  withdrawalRequestId: string | null;

  @ManyToOne(() => WasteWithdrawalRequestEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'withdrawal_request_id', foreignKeyConstraintName: 'fk_waste_inventory_movements_withdrawal' })
  withdrawalRequest: WasteWithdrawalRequestEntity | null;

  @Column({ name: 'performed_by_user_id', type: 'uuid', nullable: true })
  performedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performed_by_user_id', foreignKeyConstraintName: 'fk_waste_inventory_movements_performed_by' })
  performedByUser: UserEntity | null;

  @Index('idx_waste_inventory_movements_occurred_at')
  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'now()' })
  occurredAt: Date;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
