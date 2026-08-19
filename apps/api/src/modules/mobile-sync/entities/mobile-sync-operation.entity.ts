import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('mobile_sync_operations')
@Unique('UQ_mobile_sync_operations_idempotency_key', ['idempotencyKey'])
@Index('idx_mobile_sync_operations_device_local', ['deviceId', 'localId'])
@Index('idx_mobile_sync_operations_batch', ['batchId'])
export class MobileSyncOperationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_id', type: 'varchar', length: 120 })
  batchId: string;

  @Column({ name: 'local_id', type: 'varchar', length: 160 })
  localId: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 220 })
  idempotencyKey: string;

  @Column({ name: 'device_id', type: 'varchar', length: 160 })
  deviceId: string;

  @Column({ name: 'device_session_id', type: 'varchar', length: 160 })
  deviceSessionId: string;

  @Column({ name: 'operation_type', type: 'varchar', length: 80 })
  operationType: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 80 })
  entityType: string;

  @Column({ type: 'varchar', length: 40 })
  status: string;

  @Column({ name: 'remote_id', type: 'varchar', length: 160, nullable: true })
  remoteId: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 120, nullable: true })
  errorCode: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: unknown | null;

  @Column({ name: 'synced_at', type: 'timestamptz', nullable: true })
  syncedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
