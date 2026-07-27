import { InspectionFindingSeverity } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('inspection_sla_policies')
@Index('uq_inspection_sla_policies_severity', ['severity'], { unique: true })
export class InspectionSlaPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: InspectionFindingSeverity, enumName: 'inspection_finding_severity' })
  severity: InspectionFindingSeverity;

  @Column({ name: 'first_reminder_hours_before', type: 'integer', default: 72 })
  firstReminderHoursBefore: number;

  @Column({ name: 'second_reminder_hours_before', type: 'integer', default: 24 })
  secondReminderHoursBefore: number;

  @Column({ name: 'escalation_hours_after', type: 'integer', default: 24 })
  escalationHoursAfter: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_user_id', foreignKeyConstraintName: 'fk_isp_updated_by' })
  updatedByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
