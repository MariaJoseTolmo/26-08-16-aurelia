import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityReferenceTypeEntity } from './entities/entity-reference-type.entity';
import { EvidenceEntity } from './entities/evidence.entity';
import { EvidenceLinkEntity } from './entities/evidence-link.entity';
import { EvidencesController } from './evidences.controller';
import { EvidencesService } from './evidences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityReferenceTypeEntity,
      EvidenceEntity,
      EvidenceLinkEntity,
    ]),
  ],
  controllers: [EvidencesController],
  providers: [EvidencesService],
  exports: [TypeOrmModule, EvidencesService],
})
export class EvidencesModule {}
