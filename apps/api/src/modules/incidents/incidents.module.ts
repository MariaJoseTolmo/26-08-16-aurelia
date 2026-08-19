import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { CommentsModule } from '../comments/comments.module';
import { EvidencesModule } from '../evidences/evidences.module';
import { IncidentActionEvidenceEntity } from './entities/incident-action-evidence.entity';
import { IncidentActionPlanEntity } from './entities/incident-action-plan.entity';
import { IncidentDisseminationEntity } from './entities/incident-dissemination.entity';
import { IncidentFiveWhyAnalysisEntity } from './entities/incident-five-why-analysis.entity';
import { IncidentFlashReportEntity } from './entities/incident-flash-report.entity';
import { IncidentImmediateActionEntity } from './entities/incident-immediate-action.entity';
import { IncidentInvestigationTeamEntity } from './entities/incident-investigation-team.entity';
import { IncidentInvestigationEntity } from './entities/incident-investigation.entity';
import { IncidentInvolvedPersonEntity } from './entities/incident-involved-person.entity';
import { IncidentLevelEntity } from './entities/incident-level.entity';
import { IncidentPeepoAnalysisEntity } from './entities/incident-peepo-analysis.entity';
import { IncidentStatusHistoryEntity } from './entities/incident-status-history.entity';
import { IncidentTimelineEventEntity } from './entities/incident-timeline-event.entity';
import { IncidentTypeEntity } from './entities/incident-type.entity';
import { IncidentValidationEntity } from './entities/incident-validation.entity';
import { IncidentEntity } from './entities/incident.entity';
import { IncidentTransversalController } from './incident-transversal.controller';
import { IncidentTransversalService } from './incident-transversal.service';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IncidentTypeEntity,
      IncidentLevelEntity,
      IncidentEntity,
      IncidentInvolvedPersonEntity,
      IncidentImmediateActionEntity,
      IncidentFlashReportEntity,
      IncidentValidationEntity,
      IncidentInvestigationEntity,
      IncidentInvestigationTeamEntity,
      IncidentPeepoAnalysisEntity,
      IncidentTimelineEventEntity,
      IncidentFiveWhyAnalysisEntity,
      IncidentActionPlanEntity,
      IncidentActionEvidenceEntity,
      IncidentStatusHistoryEntity,
      IncidentDisseminationEntity,
    ]),
    CommentsModule,
    EvidencesModule,
    AuditModule,
  ],
  controllers: [IncidentsController, IncidentTransversalController],
  providers: [IncidentsService, IncidentTransversalService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
