import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlAreaAssignmentEntity } from './entities/control-area-assignment.entity';
import { ControlEvidenceEntity } from './entities/control-evidence.entity';
import { ControlSelfAssessmentAnswerEntity } from './entities/control-self-assessment-answer.entity';
import { ControlSelfAssessmentEntity } from './entities/control-self-assessment.entity';
import { ControlVerificationItemEntity } from './entities/control-verification-item.entity';
import { CriticalControlEntity } from './entities/critical-control.entity';
import { MueEntity } from './entities/mue.entity';
import { CriticalControlsCatalogController, MueController } from './mue.controller';
import { MueService } from './mue.service';

const entities = [
  MueEntity,
  CriticalControlEntity,
  ControlVerificationItemEntity,
  ControlAreaAssignmentEntity,
  ControlSelfAssessmentEntity,
  ControlSelfAssessmentAnswerEntity,
  ControlEvidenceEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  controllers: [MueController, CriticalControlsCatalogController],
  providers: [MueService],
  exports: [TypeOrmModule, MueService],
})
export class MueModule {}
