import { SprProcessStatusSection } from './components/SprProcessStatusSection';
import { SprSubmittedSummaryHeader, type SprSubmittedSummaryVariant } from './components/SprSubmittedSummaryHeader';
import type { SprProcessStatusVariant } from './sprSubmittedStatus';

interface SprSubmittedStatusViewProps {
  signDateLabel: string;
  managerApprovalDateLabel?: string;
  variant?: SprSubmittedSummaryVariant;
  processVariant?: SprProcessStatusVariant;
  onStartCorrections?: () => void;
  onStartKpiReview?: () => void;
  onStartDiscrepancyCorrection?: () => void;
}

// Vista post-envio del formulario SPR (Figma 1666:2149 / 1672:5810 / 1672:8557 / 1672:10996 / 1672:14978).
export function SprSubmittedStatusView({
  signDateLabel,
  managerApprovalDateLabel,
  variant = 'pending_approval',
  processVariant = 'initial',
  onStartCorrections,
  onStartKpiReview,
  onStartDiscrepancyCorrection,
}: SprSubmittedStatusViewProps) {
  return (
    <div className="h-[calc(100vh-56px)] w-full overflow-y-auto bg-[#f7f7f7]">
      <div className="flex flex-col gap-[14px] px-[22px] py-[18px]">
        <SprSubmittedSummaryHeader signDateLabel={signDateLabel} variant={variant} />
        <SprProcessStatusSection
          variant={processVariant}
          managerApprovalDateLabel={managerApprovalDateLabel}
          signDateLabel={signDateLabel}
          onKpiValidationClick={
            variant === 'kpi_validation_pending' || variant === 'correction_resubmitted'
              ? onStartKpiReview
              : undefined
          }
        />
        {variant === 'rejected' && onStartCorrections ? (
          <button
            type="button"
            onClick={onStartCorrections}
            className="self-start font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#24588b] underline-offset-2 hover:underline"
          >
            Corregir formulario
          </button>
        ) : null}
        {variant === 'correction_requested' && onStartDiscrepancyCorrection ? (
          <button
            type="button"
            onClick={onStartDiscrepancyCorrection}
            className="self-start rounded-[7px] bg-[#c8a064] px-[16px] py-[8px] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#001e39] hover:bg-[#b89158]"
          >
            Corregir discrepancia
          </button>
        ) : null}
      </div>
    </div>
  );
}

