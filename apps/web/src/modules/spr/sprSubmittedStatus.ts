import { SprRecordStatus, type SprMonthlyRecordResponse } from '@aurelia/contracts';
import { SPR_ACTIVE_CYCLE, SPR_APPROVED_STATUS, SPR_SUBMITTED_STATUS } from './spr.constants';

const dateLabelFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export type SprFormDisplayMode = 'entry' | 'pending_approval' | 'rejected' | 'manager_approved';

export type SprProcessStatusVariant =
  | 'initial'
  | 'rejected'
  | 'corrected'
  | 'approved'
  | 'approved_corrected'
  | 'kpi_validation'
  | 'kpi_validation_corrected'
  | 'kpi_validation_approved'
  | 'kpi_validation_approved_corrected'
  | 'kpi_validation_submitted'
  | 'kpi_validation_submitted_corrected'
  | 'correction_requested'
  | 'correction_resubmitted';

export type SprCyclePeriod = {
  periodYear: number;
  periodMonth: number;
};

const DEFAULT_CYCLE_PERIOD: SprCyclePeriod = {
  periodYear: SPR_ACTIVE_CYCLE.periodYear,
  periodMonth: SPR_ACTIVE_CYCLE.periodMonth,
};

function filterSprCycleRecords(
  records: SprMonthlyRecordResponse[] | undefined,
  period: SprCyclePeriod = DEFAULT_CYCLE_PERIOD,
): SprMonthlyRecordResponse[] {
  return (records ?? []).filter(
    (record) => record.periodYear === period.periodYear && record.periodMonth === period.periodMonth,
  );
}

function resolveLatestSprDateLabel(
  records: SprMonthlyRecordResponse[],
  field: 'submittedAt' | 'approvedAt',
  fallback: string,
): string {
  const dates = records
    .map((record) => record[field])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (dates.length === 0) return fallback;

  const latest = dates.reduce((current, next) => (next > current ? next : current));
  return dateLabelFormatter.format(latest).replace(/\//g, '-');
}

export function isSprFormSubmitted(
  records: SprMonthlyRecordResponse[] | undefined,
  totalParameterCount: number,
  period?: SprCyclePeriod,
): boolean {
  return resolveSprFormDisplayMode(records, totalParameterCount, period) !== 'entry';
}

export function resolveSprFormDisplayMode(
  records: SprMonthlyRecordResponse[] | undefined,
  totalParameterCount: number,
  period?: SprCyclePeriod,
): SprFormDisplayMode {
  if (totalParameterCount <= 0) return 'entry';

  const cycleRecords = filterSprCycleRecords(records, period);
  if (cycleRecords.length < totalParameterCount) return 'entry';
  if (cycleRecords.some((record) => record.status === SprRecordStatus.DRAFT)) return 'entry';
  if (cycleRecords.some((record) => record.status === SprRecordStatus.REJECTED)) return 'rejected';
  if (
    cycleRecords.every(
      (record) => record.status === SprRecordStatus.APPROVED || record.status === SprRecordStatus.CLOSED,
    )
  ) {
    return 'manager_approved';
  }

  return 'pending_approval';
}

export function getSprCycleRecordIds(
  records: SprMonthlyRecordResponse[] | undefined,
  period?: SprCyclePeriod,
): string[] {
  return filterSprCycleRecords(records, period).map((record) => record.id);
}

export function resolveSprProcessStatusVariant(
  displayMode: SprFormDisplayMode,
  hasCorrectionHistory: boolean,
): SprProcessStatusVariant {
  if (displayMode === 'rejected') return 'rejected';
  if (displayMode === 'manager_approved') {
    return hasCorrectionHistory ? 'approved_corrected' : 'approved';
  }
  if (displayMode === 'pending_approval' && hasCorrectionHistory) return 'corrected';
  return 'initial';
}

export function resolveSprSignDateLabel(
  records: SprMonthlyRecordResponse[] | undefined,
  period?: SprCyclePeriod,
): string {
  return resolveLatestSprDateLabel(
    filterSprCycleRecords(records, period),
    'submittedAt',
    SPR_SUBMITTED_STATUS.signDateFallbackLabel,
  );
}

export function resolveSprManagerApprovalDateLabel(
  records: SprMonthlyRecordResponse[] | undefined,
  period?: SprCyclePeriod,
): string {
  return resolveLatestSprDateLabel(
    filterSprCycleRecords(records, period),
    'approvedAt',
    SPR_APPROVED_STATUS.managerApprovalDateFallback,
  );
}
