import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { InspectionTypeEntity } from './inspection-type.entity';

@Entity('inspection_checklist_templates')
export class InspectionFormTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_inspection_templates_type')
  @Column({ name: 'inspection_type_id', type: 'uuid' })
  inspectionTypeId: string;

  @ManyToOne(() => InspectionTypeEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inspection_type_id', foreignKeyConstraintName: 'fk_ict_type' })
  inspectionType: InspectionTypeEntity;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
