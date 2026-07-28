import { Injectable } from '@nestjs/common';
import { InspectionStatus } from '@aurelia/contracts';
import { InspectionLegacyMode } from './entities/inspection-legacy-import.entity';
import { LegacyImportDisposition } from './inspection-legacy-import.types';
import {
  LegacyCatalogResolutionStatus,
  ValidatedLegacyInspection,
} from './inspection-legacy-resolution.types';

export interface InspectionLegacyReconciliationSummary {
  sourceSystem: string | null;
  totalRows: number;
  dispositions: Record<LegacyImportDisposition, number>;
  modes: {
    finding: number;
    checklist: number;
    unresolved: number;
  };
  statuses: {
    closed: number;
    inProgress: number;
    unresolved: number;
  };
  totals: {
    findingsCount: number;
    closedFindingsCount: number;
    openFindingsCount: number;
    milestoneS1: number;
    milestoneS2: number;
    milestoneS3: number;
  };
  catalogResolutions: Record<LegacyCatalogResolutionStatus, number>;
  invariant: {
    classifiedRows: number;
    allRowsClassified: boolean;
  };
}

@Injectable()
export class InspectionLegacyReconciliationService {
  summarize(rows: ValidatedLegacyInspection[]): InspectionLegacyReconciliationSummary {
    const dispositions = this.emptyDispositions();
    const catalogResolutions = this.emptyCatalogResolutions();
    let finding = 0;
    let checklist = 0;
    let unresolvedMode = 0;
    let closed = 0;
    let inProgress = 0;
    let unresolvedStatus = 0;
    let findingsCount = 0;
    let closedFindingsCount = 0;
    let openFindingsCount = 0;
    let milestoneS1 = 0;
    let milestoneS2 = 0;
    let milestoneS3 = 0;

    rows.forEach((row) => {
      dispositions[row.finalDisposition] += 1;
      [row.area, row.company, row.inspector].forEach((resolution) => {
        catalogResolutions[resolution.status] += 1;
      });

      if (row.normalized.mode === InspectionLegacyMode.FINDING) finding += 1;
      else if (row.normalized.mode === InspectionLegacyMode.CHECKLIST) checklist += 1;
      else unresolvedMode += 1;

      if (row.normalized.status === InspectionStatus.CLOSED) closed += 1;
      else if (row.normalized.status === InspectionStatus.IN_PROGRESS) inProgress += 1;
      else unresolvedStatus += 1;

      findingsCount += row.normalized.findingsCount ?? 0;
      closedFindingsCount += row.normalized.closedFindingsCount ?? 0;
      openFindingsCount += row.normalized.openFindingsCount ?? 0;

      row.normalized.milestones.forEach((milestone) => {
        if (milestone.sequenceNumber === 1) milestoneS1 += 1;
        if (milestone.sequenceNumber === 2) milestoneS2 += 1;
        if (milestone.sequenceNumber === 3) milestoneS3 += 1;
      });
    });

    const classifiedRows = Object.values(dispositions).reduce((total, count) => total + count, 0);

    return {
      sourceSystem: rows[0]?.sourceSystem ?? null,
      totalRows: rows.length,
      dispositions,
      modes: {
        finding,
        checklist,
        unresolved: unresolvedMode,
      },
      statuses: {
        closed,
        inProgress,
        unresolved: unresolvedStatus,
      },
      totals: {
        findingsCount,
        closedFindingsCount,
        openFindingsCount,
        milestoneS1,
        milestoneS2,
        milestoneS3,
      },
      catalogResolutions,
      invariant: {
        classifiedRows,
        allRowsClassified: classifiedRows === rows.length,
      },
    };
  }

  private emptyDispositions(): Record<LegacyImportDisposition, number> {
    return {
      READY: 0,
      WARNING: 0,
      QUARANTINE: 0,
      BLOCKED: 0,
      ALREADY_IMPORTED: 0,
    };
  }

  private emptyCatalogResolutions(): Record<LegacyCatalogResolutionStatus, number> {
    return {
      DIRECT_MATCH: 0,
      ALIAS_MATCH: 0,
      CREATE_ARCHIVED: 0,
      KEEP_TEXT_ONLY: 0,
      MANUAL_REVIEW: 0,
      BLOCKED: 0,
    };
  }
}
