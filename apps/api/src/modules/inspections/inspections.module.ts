import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { CommentsModule } from '../comments/comments.module';
import { EvidencesModule } from '../evidences/evidences.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { ReportsModule } from '../reports/reports.module';
import { UserEntity } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { InspectionAiAssessmentEntity } from './entities/inspection-ai-assessment.entity';
import { InspectionFindingSeverityEntity } from './entities/inspection-finding-severity.entity';
import { InspectionFindingResponsibleEntity } from './entities/inspection-finding-responsible.entity';
import { InspectionFindingTypeEntity } from './entities/inspection-finding-type.entity';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionFollowupEntity } from './entities/inspection-followup.entity';
import { InspectionFormItemEntity } from './entities/inspection-form-item.entity';
import { InspectionFormSectionEntity } from './entities/inspection-form-section.entity';
import { InspectionFormTemplateEntity } from './entities/inspection-form-template.entity';
import { InspectionItemResponseEntity } from './entities/inspection-item-response.entity';
import { InspectionProcessRequestEntity } from './entities/inspection-process-request.entity';
import { InspectionRiskConsequenceEntity } from './entities/inspection-risk-consequence.entity';
import { InspectionRiskProbabilityEntity } from './entities/inspection-risk-probability.entity';
import { InspectionStateEntity } from './entities/inspection-state.entity';
import { InspectionTypeEntity } from './entities/inspection-type.entity';
import { InspectionEntity } from './entities/inspection.entity';
import { InspectionAccessService } from './inspection-access.service';
import { InspectionAssignmentEmailService } from './inspection-assignment-email.service';
import { InspectionCriticalityCatalogController } from './inspection-criticality-catalog.controller';
import { InspectionDashboardController } from './inspection-dashboard.controller';
import { InspectionDashboardService } from './inspection-dashboard.service';
import { InspectionDetailService } from './inspection-detail.service';
import { InspectionFindingCatalogController } from './inspection-finding-catalog.controller';
import { InspectionFindingCatalogService } from './inspection-finding-catalog.service';
import { InspectionHistoryController } from './inspection-history.controller';
import { InspectionHistoryService } from './inspection-history.service';
import { InspectionProcessController } from './inspection-process.controller';
import { InspectionProcessService } from './inspection-process.service';
import { InspectionTransitionPolicyService } from './inspection-transition-policy.service';
import { InspectionTransversalController } from './inspection-transversal.controller';
import { InspectionTransversalService } from './inspection-transversal.service';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

@Module({
  imports: [
    AccessControlModule,
    AuditModule,
    CommentsModule,
    EvidencesModule,
    NotificationsModule,
    ReportsModule,
    UsersModule,
    TypeOrmModule.forFeature([
      InspectionTypeEntity,
      InspectionFindingTypeEntity,
      InspectionFindingSeverityEntity,
      InspectionRiskProbabilityEntity,
      InspectionRiskConsequenceEntity,
      InspectionFormTemplateEntity,
      InspectionFormSectionEntity,
      InspectionFormItemEntity,
      InspectionEntity,
      InspectionItemResponseEntity,
      InspectionFindingEntity,
      InspectionFindingResponsibleEntity,
      InspectionFollowupEntity,
      InspectionStateEntity,
      InspectionProcessRequestEntity,
      InspectionAiAssessmentEntity,
      AreaEntity,
      CompanyEntity,
      SectorEntity,
      UserEntity,
    ]),
  ],
  controllers: [
    InspectionsController,
    InspectionProcessController,
    InspectionDashboardController,
    InspectionHistoryController,
    InspectionTransversalController,
    InspectionFindingCatalogController,
    InspectionCriticalityCatalogController,
  ],
  providers: [
    InspectionsService,
    InspectionAccessService,
    InspectionProcessService,
    InspectionTransitionPolicyService,
    InspectionDashboardService,
    InspectionHistoryService,
    InspectionDetailService,
    InspectionTransversalService,
    InspectionFindingCatalogService,
    InspectionAssignmentEmailService,
  ],
  exports: [
    InspectionsService,
    InspectionAccessService,
    InspectionProcessService,
    InspectionTransitionPolicyService,
    InspectionDashboardService,
    InspectionHistoryService,
    InspectionDetailService,
    InspectionFindingCatalogService,
  ],
})
export class InspectionsModule {}
