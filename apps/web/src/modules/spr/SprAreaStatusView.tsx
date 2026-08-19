import { SprProcessStatusSection } from './components/SprProcessStatusSection';
import { SprSubmittedSummaryHeader } from './components/SprSubmittedSummaryHeader';
import type { SprAreaProcessStatusVariant, SprAreaStatusViewMode } from './sprAreaStatus';

interface SprAreaStatusViewProps {
  signDateLabel: string;
  managerApprovalDateLabel?: string;
  mode: SprAreaStatusViewMode;
  onPendingReReviewClick?: () => void;
  hasCorrectionHistory?: boolean;
  /** Figma 1760:22435 — Responsable SOX reportó discrepancy_reported. */
  soxDiscrepancyReported?: boolean;
}

const STATUS_VIEW_CONFIG: Record<
  SprAreaStatusViewMode,
  {
    summaryVariant:
      | 'waiting_for_responsible'
      | 'pending_approval'
      | 'manager_corrections_pending'
      | 'manager_approved';
    processVariant: SprAreaProcessStatusVariant;
  }
> = {
  waiting_for_responsible: {
    summaryVariant: 'waiting_for_responsible',
    processVariant: 'manager_waiting',
  },
  // PROVISIONAL: Figma 1672:5531 — copy KPI pendiente de confirmar con Alexis (pregunta C1).
  rejected_pending_correction: {
    summaryVariant: 'manager_corrections_pending',
    processVariant: 'manager_rejected_waiting_correction',
  },
  // Figma 1672:8268 — landing post-corrección; CTA en paso Pendiente → 1672:8997.
  pending_review_after_correction: {
    summaryVariant: 'pending_approval',
    processVariant: 'manager_pending_re_review',
  },
  // Formulario aprobado por gerente (discrepancia SOX → processVariant vía prop).
  approved: {
    summaryVariant: 'manager_approved',
    processVariant: 'manager_approved',
  },
};

// Vista de estado del gerente de area (Figma 1672:4446 / 1672:5531 / 1672:8268 / 1760:22435).
export function SprAreaStatusView({
  signDateLabel,
  managerApprovalDateLabel,
  mode,
  onPendingReReviewClick,
  hasCorrectionHistory = false,
  soxDiscrepancyReported = false,
}: SprAreaStatusViewProps) {
  const { summaryVariant, processVariant: baseProcessVariant } = STATUS_VIEW_CONFIG[mode];
  const processVariant: SprAreaProcessStatusVariant =
    mode === 'approved' && soxDiscrepancyReported
      ? 'manager_approved_sox_discrepancy'
      : baseProcessVariant;

  return (
    <div className="h-[calc(100vh-56px)] w-full overflow-y-auto bg-[#f7f7f7]">
      <div className="flex flex-col gap-[14px] px-[22px] py-[18px]">
        <SprSubmittedSummaryHeader signDateLabel={signDateLabel} variant={summaryVariant} />
        <SprProcessStatusSection
          variant={processVariant}
          managerApprovalDateLabel={managerApprovalDateLabel}
          onPendingReReviewClick={onPendingReReviewClick}
          hasCorrectionHistory={hasCorrectionHistory}
        />
      </div>
    </div>
  );
}
