import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from './entities/area.entity';
import { BusinessUnitEntity } from './entities/business-unit.entity';
import { CompanyEntity } from './entities/company.entity';
import { GerenciaEntity } from './entities/gerencia.entity';
import { LocationEntity } from './entities/location.entity';
import { SectorEntity } from './entities/sector.entity';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessUnitEntity,
      GerenciaEntity,
      AreaEntity,
      SectorEntity,
      LocationEntity,
      CompanyEntity,
    ]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [TypeOrmModule, OrganizationService],
})
export class OrganizationModule {}
