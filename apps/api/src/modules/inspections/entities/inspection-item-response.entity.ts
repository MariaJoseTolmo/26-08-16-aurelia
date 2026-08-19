import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionFormItemEntity } from './inspection-form-item.entity';
import { InspectionEntity } from './inspection.entity';

@Entity('inspection_checklist_answers')
@Unique('uq_ica_inspection_item', ['inspectionId', 'checklistItemId'])
export class InspectionItemResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_id', type: 'uuid' })
  inspectionId: string;

  @ManyToOne(() => InspectionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspection_id', foreignKeyConstraintName: 'fk_ica_inspection' })
  inspection: InspectionEntity;

  @Column({ name: 'checklist_item_id', type: 'uuid' })
  checklistItemId: string;

  @ManyToOne(() => InspectionFormItemEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checklist_item_id', foreignKeyConstraintName: 'fk_ica_item' })
  checklistItem: InspectionFormItemEntity;

  @Column({ name: 'answer_value', type: 'varchar', length: 80, nullable: true })
  answerValue: string | null;

  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answerText: string | null;

  @Column({ name: 'numeric_value', type: 'numeric', precision: 18, scale: 6, nullable: true })
  numericValue: string | null;

  @Column({ name: 'answered_by_user_id', type: 'uuid', nullable: true })
  answeredByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'answered_by_user_id', foreignKeyConstraintName: 'fk_ica_user' })
  answeredByUser: UserEntity | null;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
