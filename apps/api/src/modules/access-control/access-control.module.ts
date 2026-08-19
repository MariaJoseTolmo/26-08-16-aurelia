import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentEntity } from '../incidents/entities/incident.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ResourceScopeInterceptor } from './resource-scope.interceptor';
import { ResourceScopeService } from './resource-scope.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, InspectionEntity, IncidentEntity])],
  providers: [ResourceScopeService, ResourceScopeInterceptor],
  exports: [ResourceScopeService, ResourceScopeInterceptor],
})
export class AccessControlModule {}
