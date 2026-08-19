import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { InspectionFormTemplateEntity } from './inspection-form-template.entity';

@Entity('inspection_checklist_sections')
@Unique('uq_ics_template_code', ['templateId', 'code'])
@Unique('uq_ics_template_order', ['templateId', 'sortOrder'])
export class InspectionFormSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => InspectionFormTemplateEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id', foreignKeyConstraintName: 'fk_ics_template' })
  template: InspectionFormTemplateEntity;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'sort_order', type: 'integer' })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
