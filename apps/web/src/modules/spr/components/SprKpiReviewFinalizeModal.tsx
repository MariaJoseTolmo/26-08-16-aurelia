import { createPortal } from 'react-dom';
import { SprConfirmSendIcon } from '../icons/SprIcons';
import { SPR_KPI_REVIEW_FINALIZE_MODAL } from '../spr.constants';

export interface SprKpiReviewFinalizeModalSummary {
  confirmedCount: number;
  discrepancyCount: number;
}

interface SprKpiReviewFinalizeModalProps {
  open: boolean;
  summary: SprKpiReviewFinalizeModalSummary;
  kpiCount?: number;
  areaLabel?: string;
  specialistLabel?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function SummaryRow({ label, value, valueClassName }: { label: string; value: string; valueClassName: string }) {
  return (
    <div className="flex items-start justify-between pt-[4px] first:pt-[7px]">
      <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{label}</p>
      <p className={`font-['Inter:Bold',sans-serif] text-[11px] font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

// Modal de confirmacion al enviar revision KPI (Figma 1831:52699).
export function SprKpiReviewFinalizeModal({
  open,
  summary,
  kpiCount = SPR_KPI_REVIEW_FINALIZE_MODAL.kpiCount,
  areaLabel = SPR_KPI_REVIEW_FINALIZE_MODAL.areaLabelFallback,
  specialistLabel = SPR_KPI_REVIEW_FINALIZE_MODAL.specialistLabelFallback,
  isSubmitting,
  onClose,
  onConfirm,
}: SprKpiReviewFinalizeModalProps): JSX.Element | null {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="flex w-full max-w-[420px] flex-col rounded-[12px] bg-white p-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-kpi-review-finalize-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="spr-kpi-review-finalize-modal-title" className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">
          {SPR_KPI_REVIEW_FINALIZE_MODAL.title}
        </p>

        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {SPR_KPI_REVIEW_FINALIZE_MODAL.description(kpiCount, areaLabel, specialistLabel)}
        </p>

        <div className="pt-[16px]">
          <div className="rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] p-[13px]">
            <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.57px] text-[#646464]">
              {SPR_KPI_REVIEW_FINALIZE_MODAL.summaryTitle}
            </p>
            <SummaryRow
              label={SPR_KPI_REVIEW_FINALIZE_MODAL.confirmedCountLabel}
              value={String(summary.confirmedCount)}
              valueClassName="text-[#2a5c16]"
            />
            <SummaryRow
              label={SPR_KPI_REVIEW_FINALIZE_MODAL.discrepancyCountLabel}
              value={String(summary.discrepancyCount)}
              valueClassName="text-[#bd3b5b]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-[10px] pt-[16px]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[34px] rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
          >
            {SPR_KPI_REVIEW_FINALIZE_MODAL.continueReviewLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex h-[34px] items-center gap-[6px] rounded-[7px] bg-[#c8a064] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#001e39] transition-colors hover:bg-[#b89158] disabled:opacity-50"
          >
            <SprConfirmSendIcon className="h-[11px] w-[13.75px] shrink-0 text-[#001e39]" />
            {isSubmitting ? SPR_KPI_REVIEW_FINALIZE_MODAL.submittingLabel : SPR_KPI_REVIEW_FINALIZE_MODAL.submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
