import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { DatabaseMaintenanceModule } from './modules/database-maintenance/database-maintenance.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CriticalControlsModule } from './modules/critical-controls/critical-controls.module';
import { EvidencesModule } from './modules/evidences/evidences.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { InspectionMutationAuditInterceptor } from './modules/inspections/inspection-mutation-audit.interceptor';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { MobileBootstrapModule } from './modules/mobile-bootstrap/mobile-bootstrap.module';
import { MobileSyncModule } from './modules/mobile-sync/mobile-sync.module';
import { MueModule } from './modules/mue/mue.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { SprModule } from './modules/spr/spr.module';
import { UsersModule } from './modules/users/users.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    UsersModule,
    RolesModule,
    FilesModule,
    EvidencesModule,
    CommentsModule,
    AuditModule,
    DatabaseMaintenanceModule,
    WorkflowsModule,
    MessagingModule.register(),
    InspectionsModule,
    IncidentsModule,
    ReportsModule,
    NotificationsModule,
    MueModule,
    CriticalControlsModule,
    MobileBootstrapModule,
    MobileSyncModule,
    SprModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: InspectionMutationAuditInterceptor,
    },
  ],
})
export class AppModule {}
