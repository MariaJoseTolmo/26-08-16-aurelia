import { RecordStatus } from '@aurelia/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserCompanyEntity } from '../../users/entities/user-company.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  code: string | null;

  @Column({ length: 250 })
  name: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId: string | null;

  @Column({ name: 'company_type', type: 'varchar', length: 80, nullable: true })
  companyType: string | null;

  @Column({ name: 'is_contractor', default: true })
  isContractor: boolean;

  @Column({
    type: 'enum',
    enum: RecordStatus,
    enumName: 'record_status',
    default: RecordStatus.ACTIVE,
  })
  status: RecordStatus;

  @OneToMany(() => UserEntity, (user) => user.company)
  users: UserEntity[];

  @OneToMany(() => UserCompanyEntity, (userCompany) => userCompany.company)
  userCompanies: UserCompanyEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
