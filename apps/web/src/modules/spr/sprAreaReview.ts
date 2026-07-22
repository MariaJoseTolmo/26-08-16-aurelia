import type { SprMonthlyRecordResponse } from '@aurelia/contracts';
import { SprRecordStatus } from '@aurelia/contracts';
import { SPR_ACTIVE_CYCLE, SPR_AREA_REVIEW } from './spr.constants';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function filterSprCycleRecords(records: SprMonthlyRecordResponse[] | undefined): SprMonthlyRecordResponse[] {
  return (records ?? []).filter(
    (record) => record.periodYear === SPR_ACTIVE_CYCLE.periodYear && record.periodMonth === SPR_ACTIVE_CYCLE.periodMonth,
  );
}

export function findSprActionableRecordIds(records: SprMonthlyRecordResponse[] | undefined): string[] {
  return filterSprCycleRecords(records)
    .filter((record) => [SprRecordStatus.SUBMITTED, SprRecordStatus.UNDER_REVIEW].includes(record.status))
    .map((record) => record.id);
}

function formatSprDateLabel(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return dateFormatter.format(date).replace(/\//g, '-');
}

function formatSprTimeLabel(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return timeFormatter.format(date);
}

function pickLatestSubmittedRecord(records: SprMonthlyRecordResponse[]): SprMonthlyRecordResponse | null {
  const withSubmittedAt = records
    .filter((record) => record.submittedAt)
    .sort((left, right) => new Date(right.submittedAt ?? 0).getTime() - new Date(left.submittedAt ?? 0).getTime());
  return withSubmittedAt[0] ?? records[0] ?? null;
}

export interface SprAreaReviewContext {
  responsibleLabel: string;
  receivedDateLabel: string;
  signedDateLabel: string;
  signedTimeLabel: string;
  signedDateTimeLabel: string;
  responsibleInitials: string;
}

export function resolveSprAreaReviewContext(records: SprMonthlyRecordResponse[] | undefined): SprAreaReviewContext {
  const cycleRecords = filterSprCycleRecords(records);
  const anchorRecord = pickLatestSubmittedRecord(cycleRecords);
  const signedDateLabel = formatSprDateLabel(anchorRecord?.submittedAt, SPR_AREA_REVIEW.signedDateFallback);
  const signedTimeLabel = formatSprTimeLabel(anchorRecord?.submittedAt, SPR_AREA_REVIEW.signedTimeFallback);
  const receivedDateLabel = formatSprDateLabel(anchorRecord?.submittedAt, SPR_AREA_REVIEW.submittedDateFallback);
  const responsibleFromApi = cycleRecords
    .map((record) => record.submittedByFullName?.trim())
    .find((name): name is string => Boolean(name));
  const responsibleLabel = responsibleFromApi || SPR_AREA_REVIEW.responsibleNameFallback;

  return {
    responsibleLabel,
    receivedDateLabel,
    signedDateLabel,
    signedTimeLabel,
    signedDateTimeLabel: `${signedDateLabel} · ${signedTimeLabel}`,
    responsibleInitials: responsibleLabel
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
  };
}

export function formatSprRecordEntryDateTime(record: SprMonthlyRecordResponse | null | undefined): string {
  if (!record?.submittedAt && !record?.createdAt) return SPR_AREA_REVIEW.entryDateFallback;
  const value = record.submittedAt ?? record.createdAt;
  return `${formatSprDateLabel(value, SPR_AREA_REVIEW.signedDateFallback)} · ${formatSprTimeLabel(value, SPR_AREA_REVIEW.signedTimeFallback)}`;
}
