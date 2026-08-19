import { InspectionItemResponseType } from '@aurelia/contracts';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { InspectionFormSectionEntity } from './inspection-form-section.entity';

@Entity('inspection_checklist_items')
@Unique('uq_ici_section_code', ['sectionId', 'code'])
@Unique('uq_ici_section_order', ['sectionId', 'sortOrder'])
export class InspectionFormItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'section_id', type: 'uuid' })
  sectionId: string;

  @ManyToOne(() => InspectionFormSectionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id', foreignKeyConstraintName: 'fk_ici_section' })
  section: InspectionFormSectionEntity;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  question: string;

  @Column({ type: 'text', nullable: true })
  guidance: string | null;

  @Column({ name: 'response_type', type: 'enum', enum: InspectionItemResponseType, enumName: 'inspection_item_response_type' })
  responseType: InspectionItemResponseType;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ name: 'requires_evidence_on_not_compliant', type: 'boolean', default: false })
  requiresEvidenceOnNotCompliant: boolean;

  @Column({ name: 'sort_order', type: 'integer' })
  sortOrder: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weight: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
