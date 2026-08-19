import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialHashService } from '../auth/credential-hash.service';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserAreaEntity } from './entities/user-area.entity';
import { UserCompanyEntity } from './entities/user-company.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      UserCompanyEntity,
      UserAreaEntity,
      RoleEntity,
      CompanyEntity,
      AreaEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, CredentialHashService],
  exports: [UsersService],
})
export class UsersModule {}
