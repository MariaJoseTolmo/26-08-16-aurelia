import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { InspectionDetailLegacySummaryResponse } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from '../inspection-legacy-import/entities/inspection-legacy-milestone.entity';
import { InspectionLegacyParticipantEntity } from '../inspection-legacy-import/entities/inspection-legacy-participant.entity';
import { InspectionLegacySectorLinkEntity } from '../inspection-legacy-import/entities/inspection-legacy-sector-link.entity';
import { InspectionEntity } from './entities/inspection.entity';

@Injectable()
export class InspectionLegacyDetailProjectionService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionLegacyImportEntity)
    private readonly legacyImports: Repository<InspectionLegacyImportEntity>,
    @InjectRepository(InspectionLegacyMilestoneEntity)
    private readonly milestones: Repository<InspectionLegacyMilestoneEntity>,
    @InjectRepository(InspectionLegacyParticipantEntity)
    private readonly participants: Repository<InspectionLegacyParticipantEntity>,
    @InjectRepository(InspectionLegacySectorLinkEntity)
    private readonly sectorLinks: Repository<InspectionLegacySectorLinkEntity>,
  ) {}

  async getSummary(inspectionId: string): Promise<InspectionDetailLegacySummaryResponse | null> {
    const legacyImport = await this.legacyImports.findOneBy({ inspectionId });
    if (!legacyImport) return null;

    const [inspection, milestones, participants, sectorLinks] = await Promise.all([
      this.inspections.findOneBy({ id: inspectionId }),
      this.milestones.find({
        where: { legacyImportId: legacyImport.id },
        order: { sequenceNumber: 'ASC' },
      }),
      this.participants.find({
        where: { legacyImportId: legacyImport.id },
        order: { sequenceNumber: 'ASC' },
      }),
      this.sectorLinks.find({
        where: { legacyImportId: legacyImport.id },
        order: { sequenceNumber: 'ASC' },
      }),
    ]);

    if (!inspection) return null;

    return {
      sourceSystem: legacyImport.sourceSystem,
      legacyYear: legacyImport.legacyYear,
      legacyNumber: legacyImport.legacyNumber,
      mode: legacyImport.legacyMode === InspectionLegacyMode.CHECKLIST ? 'checklist' : 'finding',
      originalInspectorName: legacyImport.legacyInspectorName,
      originalAreaName: legacyImport.legacyAreaName,
      originalCompanyName: legacyImport.legacyCompanyName,
      originalSectorName: legacyImport.legacySectorName,
      originalDetail: legacyImport.legacyDetail,
      totalObservations: inspection.findingsCount,
      closedObservations: Math.max(0, inspection.findingsCount - inspection.openFindingsCount),
      openObservations: inspection.openFindingsCount,
      milestones: milestones.map((milestone) => ({
        sequenceNumber: milestone.sequenceNumber,
        occurredAt: milestone.occurredAt,
        closedIncrement: milestone.closedIncrement,
        pendingAfter: milestone.pendingAfter,
        closedPercentage: this.toNullableNumber(milestone.closedPercentage),
        pendingPercentage: this.toNullableNumber(milestone.pendingPercentage),
      })),
      participants: participants.map((participant) => ({
        userId: participant.userId,
        fullName: participant.sourceName,
        isPrimary: participant.isPrimary,
      })),
      sectors: sectorLinks.map((sectorLink) => ({
        sectorId: sectorLink.sectorId,
        name: sectorLink.sourceName,
        isPrimary: sectorLink.isPrimary,
      })),
      dataAvailability: {
        findingDetails: false,
        checklistAnswers: false,
        comments: false,
        images: false,
      },
    };
  }

  private toNullableNumber(value: string | null): number | null {
    if (value === null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
