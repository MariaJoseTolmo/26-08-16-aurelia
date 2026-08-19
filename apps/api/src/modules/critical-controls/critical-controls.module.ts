import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlSelfAssessmentAnswerEntity } from '../mue/entities/control-self-assessment-answer.entity';
import { ControlSelfAssessmentEntity } from '../mue/entities/control-self-assessment.entity';
import { ControlVerificationItemEntity } from '../mue/entities/control-verification-item.entity';
import { MueModule } from '../mue/mue.module';
import { CriticalControlsController } from './critical-controls.controller';
import { CriticalControlsService } from './critical-controls.service';

@Module({
  imports: [
    MueModule,
    TypeOrmModule.forFeature([
      ControlSelfAssessmentEntity,
      ControlSelfAssessmentAnswerEntity,
      ControlVerificationItemEntity,
    ]),
  ],
  controllers: [CriticalControlsController],
  providers: [CriticalControlsService],
  exports: [CriticalControlsService],
})
export class CriticalControlsModule {}
