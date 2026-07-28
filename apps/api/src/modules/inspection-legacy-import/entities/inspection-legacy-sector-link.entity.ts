import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SectorEntity } from '../../organization/entities/sector.entity';
import { InspectionLegacyImportEntity } from './inspection-legacy-import.entity';

@Entity('inspection_legacy_sector_links')
@Unique('uq_inspection_legacy_sector_sequence', ['legacyImportId', 'sequenceNumber'])
@Check('chk_inspection_legacy_sector_sequence', '"sequence_number" > 0')
@Index('idx_inspection_legacy_sector_import', ['legacyImportId'])
@Index('idx_inspection_legacy_sector_sector', ['sectorId'])
export class InspectionLegacySectorLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_import_id', type: 'uuid' })
  legacyImportId: string;

  @ManyToOne(() => InspectionLegacyImportEntity, (legacyImport) => legacyImport.sectorLinks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'legacy_import_id', foreignKeyConstraintName: 'fk_ilsl_legacy_import' })
  legacyImport: InspectionLegacyImportEntity;

  @Column({ name: 'sector_id', type: 'uuid', nullable: true })
  sectorId: string | null;

  @ManyToOne(() => SectorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sector_id', foreignKeyConstraintName: 'fk_ilsl_sector' })
  sector: SectorEntity | null;

  @Column({ name: 'source_name', type: 'varchar', length: 255 })
  sourceName: string;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;
}
