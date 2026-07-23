import { SprApprovalStatus, SprRecordStatus, type SprMonthlyRecordResponse, type SprRecordApprovalResponse } from '@aurelia/contracts';
import { SPR_ACTIVE_CYCLE, SPR_CORRECTION_MODE } from './spr.constants';

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

export interface SprRejectionContext {
  bannerTitle: string;
  comment: string;
  statusLabel: string;
  statusHelper: string;
}

function filterSprCycleRecords(records: SprMonthlyRecordResponse[] | undefined): SprMonthlyRecordResponse[] {
  return (records ?? []).filter(
    (record) => record.periodYear === SPR_ACTIVE_CYCLE.periodYear && record.periodMonth === SPR_ACTIVE_CYCLE.periodMonth,
  );
}

export function findSprRejectedRecordId(records: SprMonthlyRecordResponse[] | undefined): string | null {
  return filterSprCycleRecords(records).find((record) => record.status === SprRecordStatus.REJECTED)?.id ?? null;
}

function formatSprDateLabel(value: string | null | undefined): string {
  if (!value) return SPR_CORRECTION_MODE.rejectedDateFallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return SPR_CORRECTION_MODE.rejectedDateFallback;
  return dateFormatter.format(date).replace(/\//g, '-');
}

function formatSprTimeLabel(value: string | null | undefined): string {
  if (!value) return SPR_CORRECTION_MODE.rejectedTimeFallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return SPR_CORRECTION_MODE.rejectedTimeFallback;
  return timeFormatter.format(date);
}

function pickLatestRejectedApproval(approvals: SprRecordApprovalResponse[] | undefined): SprRecordApprovalResponse | null {
  const rejectedApprovals = (approvals ?? [])
    .filter((approval) => approval.status === SprApprovalStatus.REJECTED)
    .sort((left, right) => {
      const leftTime = left.decidedAt ? new Date(left.decidedAt).getTime() : 0;
      const rightTime = right.decidedAt ? new Date(right.decidedAt).getTime() : 0;
      return rightTime - leftTime;
    });

  return rejectedApprovals[0] ?? null;
}

function formatSprDateLabelStrict(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date).replace(/\//g, '-');
}

function formatSprTimeLabelStrict(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return timeFormatter.format(date);
}

export function findLatestRejectedApproval(
  approvals: SprRecordApprovalResponse[] | undefined,
): SprRecordApprovalResponse | null {
  return pickLatestRejectedApproval(approvals);
}

export interface SprManagerCorrectionBannerContext {
  bannerTitle: string;
  comment: string | null;
}

/** Banner gerente post-corrección (Figma 1672:8997). Solo datos reales de approvals — sin fallbacks mock. */
export function resolveSprManagerCorrectionBanner(
  approvals: SprRecordApprovalResponse[] | undefined,
): SprManagerCorrectionBannerContext | null {
  const latestRejection = pickLatestRejectedApproval(approvals);
  if (!latestRejection) return null;

  const decidedAt = latestRejection.decidedAt;
  const dateLabel = decidedAt ? formatSprDateLabelStrict(decidedAt) : null;
  const timeLabel = decidedAt ? formatSprTimeLabelStrict(decidedAt) : null;
  const bannerTitle =
    dateLabel && timeLabel
      ? `Corrección solicitada por ti. · ${dateLabel} · ${timeLabel}`
      : 'Corrección solicitada por ti.';

  const comment = latestRejection.comments?.trim() || null;

  return { bannerTitle, comment };
}

// PLACEHOLDER: el contrato de approvals no incluye nombre del aprobador; se usa fallback visual.
export function resolveSprRejectionContext(approvals: SprRecordApprovalResponse[] | undefined): SprRejectionContext {
  const latestRejection = pickLatestRejectedApproval(approvals);
  const dateLabel = formatSprDateLabel(latestRejection?.decidedAt);
  const timeLabel = formatSprTimeLabel(latestRejection?.decidedAt);
  const approverLabel = SPR_CORRECTION_MODE.approverFallbackLabel;
  const comment = latestRejection?.comments?.trim() || SPR_CORRECTION_MODE.commentFallback;

  return {
    bannerTitle: SPR_CORRECTION_MODE.bannerTitle(approverLabel, dateLabel, timeLabel),
    comment,
    statusLabel: SPR_CORRECTION_MODE.statusLabel,
    statusHelper: SPR_CORRECTION_MODE.statusHelper(dateLabel, timeLabel),
  };
}
