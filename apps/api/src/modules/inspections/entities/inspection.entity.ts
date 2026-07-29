import { InspectionStatus } from '@aurelia/contracts';
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
import { InspectionLegacyImportEntity } from '../../inspection-legacy-import/entities/inspection-legacy-import.entity';
import { AreaEntity } from '../../organization/entities/area.entity';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { LocationEntity } from '../../organization/entities/location.entity';
import { SectorEntity } from '../../organization/entities/sector.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionFormTemplateEntity } from './inspection-form-template.entity';
import { InspectionTypeEntity } from './inspection-type.entity';

@Entity('inspections')
export class InspectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_inspections_type')
  @Column({ name: 'inspection_type_id', type: 'uuid' })
  inspectionTypeId: string;

  @ManyToOne(() => InspectionTypeEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inspection_type_id', foreignKeyConstraintName: 'fk_inspections_type' })
  inspectionType: InspectionTypeEntity;

  @Index('idx_inspections_template')
  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @ManyToOne(() => InspectionFormTemplateEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id', foreignKeyConstraintName: 'fk_inspections_template' })
  template: InspectionFormTemplateEntity | null;

  @Index('idx_inspections_company')
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'fk_inspections_company' })
  company: CompanyEntity | null;

  @Index('idx_inspections_area')
  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => AreaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id', foreignKeyConstraintName: 'fk_inspections_area' })
  area: AreaEntity | null;

  @Column({ name: 'sector_id', type: 'uuid', nullable: true })
  sectorId: string | null;

  @ManyToOne(() => SectorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sector_id', foreignKeyConstraintName: 'fk_inspections_sector' })
  sector: SectorEntity | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => LocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id', foreignKeyConstraintName: 'fk_inspections_location' })
  location: LocationEntity | null;

  @Index('idx_inspections_inspector')
  @Column({ name: 'inspector_user_id', type: 'uuid', nullable: true })
  inspectorId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inspector_user_id', foreignKeyConstraintName: 'fk_inspections_inspector' })
  inspector: UserEntity | null;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  get code(): string {
    return '';
  }

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('idx_inspections_status')
  @Column({
    type: 'enum',
    enum: InspectionStatus,
    enumName: 'inspection_status',
    default: InspectionStatus.DRAFT,
  })
  status: InspectionStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: string | null;

  @Column({ name: 'findings_count', type: 'integer', default: 0 })
  findingsCount: number;

  @Column({ name: 'open_findings_count', type: 'integer', default: 0 })
  openFindingsCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToOne(() => InspectionLegacyImportEntity, (legacyImport) => legacyImport.inspection)
  legacyImport: InspectionLegacyImportEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
