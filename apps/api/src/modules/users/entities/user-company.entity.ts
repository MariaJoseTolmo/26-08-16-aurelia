import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CompanyEntity } from '../../organization/entities/company.entity';
import { UserEntity } from './user.entity';

@Entity('user_companies')
@Unique('uq_user_companies_user_company', ['user', 'company'])
export class UserCompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.userCompanies, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_user_companies_user' })
  user: UserEntity;

  @ManyToOne(() => CompanyEntity, (company) => company.userCompanies, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'fk_user_companies_company' })
  company: CompanyEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
