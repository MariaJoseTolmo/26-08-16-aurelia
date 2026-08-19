import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { InspectionFindingEntity } from './inspection-finding.entity';

@Entity('inspection_finding_responsibles')
@Unique('uq_inspection_finding_responsibles_finding_user', ['findingId', 'userId'])
export class InspectionFindingResponsibleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_inspection_finding_responsibles_finding')
  @Column({ name: 'finding_id', type: 'uuid' })
  findingId: string;

  @ManyToOne(() => InspectionFindingEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'finding_id', foreignKeyConstraintName: 'fk_ifr_finding' })
  finding: InspectionFindingEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_ifr_user' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}