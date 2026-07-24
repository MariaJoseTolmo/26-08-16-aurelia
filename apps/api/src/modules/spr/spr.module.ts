import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { CommentsModule } from '../comments/comments.module';
import { EvidencesModule } from '../evidences/evidences.module';
import { UserEntity } from '../users/entities/user.entity';
import { SprConsolidationRuleEntity } from './entities/spr-consolidation-rule.entity';
import { SprMeasureGroupEntity } from './entities/spr-measure-group.entity';
import { SprMonthlyRecordEntity } from './entities/spr-monthly-record.entity';
import { SprParameterAreaAssignmentEntity } from './entities/spr-parameter-area-assignment.entity';
import { SprParameterEntity } from './entities/spr-parameter.entity';
import { SprRecordApprovalEntity } from './entities/spr-record-approval.entity';
import { SprUnitEntity } from './entities/spr-unit.entity';
import { SprController } from './spr.controller';
import { SprService } from './spr.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SprMeasureGroupEntity,
      SprUnitEntity,
      SprParameterEntity,
      SprParameterAreaAssignmentEntity,
      SprMonthlyRecordEntity,
      SprRecordApprovalEntity,
      SprConsolidationRuleEntity,
      UserEntity,
    ]),
    EvidencesModule,
    CommentsModule,
    AuditModule,
  ],
  controllers: [SprController],
  providers: [SprService],
  exports: [SprService],
})
export class SprModule {}
