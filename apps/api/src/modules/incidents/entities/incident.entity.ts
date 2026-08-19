import { IncidentStatus } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AreaEntity } from '../../organization/entities/area.entity';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { LocationEntity } from '../../organization/entities/location.entity';
import { SectorEntity } from '../../organization/entities/sector.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentLevelEntity } from './incident-level.entity';
import { IncidentTypeEntity } from './incident-type.entity';

@Entity('incidents')
export class IncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_incidents_type')
  @Column({ name: 'incident_type_id', type: 'uuid' })
  incidentTypeId: string;

  @ManyToOne(() => IncidentTypeEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'incident_type_id', foreignKeyConstraintName: 'fk_incidents_type' })
  incidentType: IncidentTypeEntity;

  @Index('idx_incidents_level')
  @Column({ name: 'incident_level_id', type: 'uuid' })
  incidentLevelId: string;

  @ManyToOne(() => IncidentLevelEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'incident_level_id', foreignKeyConstraintName: 'fk_incidents_level' })
  incidentLevel: IncidentLevelEntity;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'fk_incidents_company' })
  company: CompanyEntity | null;

  @Index('idx_incidents_area')
  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_incidents_area' })
  area: AreaEntity | null;

  @Column({ name: 'sector_id', type: 'uuid', nullable: true })
  sectorId: string | null;

  @ManyToOne(() => SectorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sector_id', foreignKeyConstraintName: 'fk_incidents_sector' })
  sector: SectorEntity | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => LocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id', foreignKeyConstraintName: 'fk_incidents_location' })
  location: LocationEntity | null;

  @Column({ name: 'reported_by_user_id', type: 'uuid', nullable: true })
  reportedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reported_by_user_id', foreignKeyConstraintName: 'fk_incidents_reported_by' })
  reportedByUser: UserEntity | null;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index('idx_incidents_status')
  @Column({ type: 'enum', enum: IncidentStatus, enumName: 'incident_status', default: IncidentStatus.REPORTED })
  status: IncidentStatus;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Index('idx_incidents_reported_at')
  @Column({ name: 'reported_at', type: 'timestamptz', default: () => 'now()' })
  reportedAt: Date;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'immediate_response_summary', type: 'text', nullable: true })
  immediateResponseSummary: string | null;

  @Column({ name: 'environmental_impact_summary', type: 'text', nullable: true })
  environmentalImpactSummary: string | null;

  @Column({ name: 'sla_due_at', type: 'timestamptz', nullable: true })
  slaDueAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by_user_id', type: 'uuid', nullable: true })
  closedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by_user_id', foreignKeyConstraintName: 'fk_incidents_closed_by' })
  closedByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
