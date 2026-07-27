import { NotificationDeliveryStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NotificationEntity } from './notification.entity';

@Entity('notification_deliveries')
@Index('idx_notification_deliveries_status', ['status'])
@Index('idx_notification_deliveries_notification', ['notificationId'])
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId: string;

  @ManyToOne(() => NotificationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id', foreignKeyConstraintName: 'fk_nd_notification' })
  notification: NotificationEntity;

  @Column({ type: 'varchar', length: 30, default: 'in_app' })
  channel: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  destination: string | null;

  @Column({ type: 'enum', enum: NotificationDeliveryStatus, enumName: 'notification_delivery_status', default: NotificationDeliveryStatus.PENDING })
  status: NotificationDeliveryStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'max_attempts', type: 'integer', default: 3 })
  maxAttempts: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
