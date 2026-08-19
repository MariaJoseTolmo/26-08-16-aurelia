import { IncidentLevelCode, RecordStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('incident_levels')
export class IncidentLevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: IncidentLevelCode, enumName: 'incident_level_code', unique: true })
  code: IncidentLevelCode;

  @Column({ name: 'level_number', type: 'integer', unique: true })
  levelNumber: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'sla_hours', type: 'integer' })
  slaHours: number;

  @Column({ name: 'requires_investigation', type: 'boolean', default: false })
  requiresInvestigation: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: RecordStatus, enumName: 'record_status', default: RecordStatus.ACTIVE })
  status: RecordStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
