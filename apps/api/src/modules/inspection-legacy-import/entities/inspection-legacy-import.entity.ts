import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { InspectionEntity } from '../../inspections/entities/inspection.entity';
import { InspectionLegacyMilestoneEntity } from './inspection-legacy-milestone.entity';

export enum InspectionLegacyMode {
  FINDING = 'finding',
  CHECKLIST = 'checklist',
}

@Entity('inspection_legacy_imports')
@Unique('uq_inspection_legacy_import_inspection', ['inspectionId'])
@Unique('uq_inspection_legacy_source', ['sourceSystem', 'legacyYear', 'legacyNumber'])
@Check('chk_inspection_legacy_mode', `"legacy_mode" IN ('finding', 'checklist')`)
@Check('chk_inspection_legacy_source_row', '"source_row" > 0')
@Check('chk_inspection_legacy_year_number', '"legacy_year" > 0 AND "legacy_number" > 0')
@Index('idx_inspection_legacy_year_number', ['legacyYear', 'legacyNumber'])
@Index('idx_inspection_legacy_mode', ['legacyMode'])
export class InspectionLegacyImportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_id', type: 'uuid' })
  inspectionId: string;

  @OneToOne(() => InspectionEntity, (inspection) => inspection.legacyImport, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inspection_id', foreignKeyConstraintName: 'fk_ili_inspection' })
  inspection: InspectionEntity;

  @Column({ name: 'source_system', type: 'varchar', length: 100 })
  sourceSystem: string;

  @Column({ name: 'source_file_name', type: 'varchar', length: 255 })
  sourceFileName: string;

  @Column({ name: 'source_sheet', type: 'varchar', length: 100 })
  sourceSheet: string;

  @Column({ name: 'source_row', type: 'integer' })
  sourceRow: number;

  @Column({ name: 'legacy_year', type: 'integer' })
  legacyYear: number;

  @Column({ name: 'legacy_number', type: 'integer' })
  legacyNumber: number;

  @Column({ name: 'legacy_mode', type: 'varchar', length: 30 })
  legacyMode: InspectionLegacyMode;

  @Column({ name: 'legacy_inspector_name', type: 'varchar', length: 255, nullable: true })
  legacyInspectorName: string | null;

  @Column({ name: 'legacy_area_name', type: 'varchar', length: 255, nullable: true })
  legacyAreaName: string | null;

  @Column({ name: 'legacy_company_name', type: 'varchar', length: 255, nullable: true })
  legacyCompanyName: string | null;

  @Column({ name: 'legacy_sector_name', type: 'text', nullable: true })
  legacySectorName: string | null;

  @Column({ name: 'legacy_detail', type: 'text', nullable: true })
  legacyDetail: string | null;

  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload: Record<string, unknown>;

  @Column({ name: 'import_warnings', type: 'jsonb', nullable: true })
  importWarnings: Array<Record<string, unknown>> | null;

  @CreateDateColumn({ name: 'imported_at', type: 'timestamptz' })
  importedAt: Date;

  @OneToMany(() => InspectionLegacyMilestoneEntity, (milestone) => milestone.legacyImport)
  milestones: InspectionLegacyMilestoneEntity[];
}
