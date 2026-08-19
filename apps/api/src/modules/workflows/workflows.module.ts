import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityReferenceTypeEntity } from '../evidences/entities/entity-reference-type.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowDefinitionStepEntity } from './entities/workflow-definition-step.entity';
import { WorkflowDefinitionEntity } from './entities/workflow-definition.entity';
import { WorkflowInstanceStepEntity } from './entities/workflow-instance-step.entity';
import { WorkflowInstanceEntity } from './entities/workflow-instance.entity';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      WorkflowDefinitionEntity,
      WorkflowDefinitionStepEntity,
      WorkflowInstanceEntity,
      WorkflowInstanceStepEntity,
      EntityReferenceTypeEntity,
    ]),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [TypeOrmModule, WorkflowsService],
})
export class WorkflowsModule {}
