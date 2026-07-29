import { InspectionStatus } from '@aurelia/contracts';
import { InspectionLegacyMode } from './entities/inspection-legacy-import.entity';

export type LegacyImportDisposition =
  | 'READY'
  | 'WARNING'
  | 'QUARANTINE'
  | 'BLOCKED'
  | 'ALREADY_IMPORTED';

export type LegacyMilestoneSequence = 1 | 2 | 3;

export enum LegacyInspectionWarningCode {
  MISSING_LEGACY_KEY = 'MISSING_LEGACY_KEY',
  INVALID_INSPECTION_DATE = 'INVALID_INSPECTION_DATE',
  YEAR_DATE_MISMATCH = 'YEAR_DATE_MISMATCH',
  UNKNOWN_MODE = 'UNKNOWN_MODE',
  UNKNOWN_STATUS = 'UNKNOWN_STATUS',
  MISSING_TOTAL_FINDINGS = 'MISSING_TOTAL_FINDINGS',
  INVALID_COUNTER = 'INVALID_COUNTER',
  INVALID_MILESTONE_DATE = 'INVALID_MILESTONE_DATE',
  MILESTONE_BEFORE_INSPECTION = 'MILESTONE_BEFORE_INSPECTION',
  MILESTONE_OUT_OF_SEQUENCE = 'MILESTONE_OUT_OF_SEQUENCE',
  ORPHAN_MILESTONE_VALUES = 'ORPHAN_MILESTONE_VALUES',
  COUNTER_RECONCILIATION_MISMATCH = 'COUNTER_RECONCILIATION_MISMATCH',
  STATUS_COUNTER_MISMATCH = 'STATUS_COUNTER_MISMATCH',
}

export interface LegacyInspectionWarning {
  code: LegacyInspectionWarningCode;
  message: string;
  field?: string;
  rawValue?: unknown;
}

export interface NormalizedLegacyMilestone {
  sequenceNumber: LegacyMilestoneSequence;
  occurredAt: string;
  closedIncrement: number;
  pendingAfter: number;
  closedPercentage: number | null;
  pendingPercentage: number | null;
  rawPayload: Record<string, unknown>;
}

export interface NormalizedLegacyInspection {
  sourceRow: number;
  legacyYear: number | null;
  legacyNumber: number | null;
  inspectionDate: string | null;
  inspectorName: string | null;
  areaName: string | null;
  companyName: string | null;
  sectorName: string | null;
  detail: string | null;
  mode: InspectionLegacyMode | null;
  status: InspectionStatus | null;
  findingsCount: number | null;
  openFindingsCount: number | null;
  closedFindingsCount: number | null;
  completedAt: string | null;
  closedAt: string | null;
  milestones: NormalizedLegacyMilestone[];
  warnings: LegacyInspectionWarning[];
  disposition: LegacyImportDisposition;
  rawPayload: Record<string, unknown>;
}

export type LegacyInspectionRawRow = Record<string, unknown>;
