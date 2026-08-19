import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentInvestigationEntity } from './incident-investigation.entity';

@Entity('incident_investigation_team')
export class IncidentInvestigationTeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'investigation_id', type: 'uuid' })
  investigationId: string;

  @ManyToOne(() => IncidentInvestigationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigation_id', foreignKeyConstraintName: 'fk_iit_investigation' })
  investigation: IncidentInvestigationEntity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_iit_user' })
  user: UserEntity | null;

  @Column({ type: 'varchar', length: 120 })
  role: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
