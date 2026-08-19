import type { ComponentType, SVGProps } from 'react';
import { BellIcon } from '../../../shared/components/icons/BellIcon';
import {
  SprProcessStatusApprovedIcon,
  SprProcessStatusClipboardCheckIcon,
  SprProcessStatusDocumentIcon,
  SprProcessStatusDoubleCheckIcon,
  SprProcessStatusRejectedIcon,
} from '../icons/SprIcons';
import {
  SPR_ACTIVE_CYCLE,
  SPR_APPROVED_STATUS,
  SPR_CORRECTED_STATUS,
  SPR_MANAGER_APPROVED_STATUS,
  SPR_MANAGER_PENDING_REVIEW_STATUS,
  SPR_MANAGER_PENDING_RE_REVIEW_STATUS,
  SPR_MANAGER_REJECTED_WAITING_STATUS,
  SPR_MANAGER_SOX_DISCREPANCY_STATUS,
  SPR_MANAGER_WAITING_STATUS,
  SPR_REJECTED_STATUS,
  SPR_RESPONSIBLE_KPI_REVIEW_APPROVED_STATUS,
  SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS,
  SPR_RESPONSIBLE_KPI_VALIDATION_STATUS,
  SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS,
  SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS,
  SPR_SUBMITTED_STATUS,
} from '../spr.constants';
import type { SprProcessStatusVariant } from '../sprSubmittedStatus';
import type { SprAreaProcessStatusVariant } from '../sprAreaStatus';

interface SprProcessStatusSectionProps {
  variant?: SprProcessStatusVariant | SprAreaProcessStatusVariant;
  managerApprovalDateLabel?: string;
  signDateLabel?: string;
  onKpiValidationClick?: () => void;
  /** Figma 1672:8268 → 1672:8997: clic en el paso Pendiente abre la revisión accionable. */
  onPendingReReviewClick?: () => void;
  /** Si el ciclo tuvo rechazo real, el timeline post-aprobación incluye ese paso. */
  hasCorrectionHistory?: boolean;
}

type ProcessStepIcon =
  | 'document'
  | 'rejected'
  | 'corrected'
  | 'approved'
  | 'double-check'
  | 'clipboard-check'
  | 'pending-report';

interface ProcessStepRowProps {
  icon: ProcessStepIcon;
  iconBgClassName: string;
  iconClassName: string;
  title: string;
  helper: string;
  badgeLabel: string;
  badgeClassName: string;
  withBottomBorder?: boolean;
}

const PROCESS_STEP_ICONS: Record<ProcessStepIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  document: SprProcessStatusDocumentIcon,
  'pending-report': SprProcessStatusDocumentIcon,
  approved: SprProcessStatusApprovedIcon,
  'double-check': SprProcessStatusDoubleCheckIcon,
  'clipboard-check': SprProcessStatusClipboardCheckIcon,
  rejected: SprProcessStatusRejectedIcon,
  corrected: SprProcessStatusRejectedIcon,
};

function ProcessStepRow({
  icon,
  iconBgClassName,
  iconClassName,
  title,
  helper,
  badgeLabel,
  badgeClassName,
  withBottomBorder = false,
}: ProcessStepRowProps) {
  const Icon = PROCESS_STEP_ICONS[icon];

  return (
    <div
      className={`flex flex-wrap items-center gap-[10px] px-[14px] py-[10px] ${withBottomBorder ? 'border-b border-[#f4f6f9] pb-[11px] pt-[10px]' : ''}`}
    >
      <div className={`flex size-[32px] shrink-0 items-center justify-center rounded-[8px] ${iconBgClassName}`}>
        <Icon className={`h-[13px] w-[16.25px] ${iconClassName}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold text-[#131313]">{title}</p>
        <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{helper}</p>
      </div>

      <span
        className={`shrink-0 rounded-[4px] px-[6px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold ${badgeClassName}`}
      >
        {badgeLabel}
      </span>
    </div>
  );
}

function CompletedEmittedRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="document"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_CORRECTED_STATUS.emittedStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_CORRECTED_STATUS.emittedStepHelper}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CompletedCorrectedRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="corrected"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_CORRECTED_STATUS.correctedStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_CORRECTED_STATUS.correctedStepHelper}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function KpiPendingRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="pending-report"
      iconBgClassName="bg-[#f7f7f7]"
      iconClassName="text-[#acacac]"
      title={SPR_APPROVED_STATUS.kpiPendingStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_APPROVED_STATUS.kpiPendingStepHelper}
      badgeLabel={SPR_APPROVED_STATUS.kpiPendingBadgeLabel}
      badgeClassName="bg-[#f7f7f7] text-[#acacac]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function KpiValidationPendingRow({
  withBottomBorder = false,
  onClick,
}: {
  withBottomBorder?: boolean;
  onClick?: () => void;
}) {
  const row = (
    <ProcessStepRow
      icon="clipboard-check"
      iconBgClassName="bg-[#e6f3ff]"
      iconClassName="text-[#0d3862]"
      title={SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.kpiValidationStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.kpiValidationStepHelper}
      badgeLabel={SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.kpiValidationBadgeLabel}
      badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
      withBottomBorder={withBottomBorder}
    />
  );

  if (!onClick) return row;

  return (
    <button type="button" onClick={onClick} className="w-full text-left hover:bg-[#fafcff]">
      {row}
    </button>
  );
}

function KpiValidationCompletedRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="approved"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS.kpiValidationStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS.kpiValidationStepHelper}
      badgeLabel={SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS.kpiValidationBadgeLabel}
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

/** Figma 1760:23007 — fila tope post-POST approved. */
function ResponsibleReviewedValidatedRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="approved"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_KPI_REVIEW_APPROVED_STATUS.reviewedValidatedStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_KPI_REVIEW_APPROVED_STATUS.reviewedValidatedStepHelper}
      badgeLabel={SPR_RESPONSIBLE_KPI_REVIEW_APPROVED_STATUS.reviewedValidatedBadgeLabel}
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function ResponsibleDiscrepancyPendingRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="rejected"
      iconBgClassName="bg-[#ffd0db]"
      iconClassName="text-[#570b1d]"
      title={SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS.discrepancyStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS.discrepancyStepHelper}
      badgeLabel={SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS.discrepancyBadgeLabel}
      badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
      withBottomBorder={withBottomBorder}
    />
  );
}

/** Figma 1760:22435 — fila tope gerente cuando Responsable SOX reportó discrepancia. */
function ManagerSoxDiscrepancyPendingRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="rejected"
      iconBgClassName="bg-[#ffd0db]"
      iconClassName="text-[#570b1d]"
      title={SPR_MANAGER_SOX_DISCREPANCY_STATUS.discrepancyStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_MANAGER_SOX_DISCREPANCY_STATUS.discrepancyStepHelper}
      badgeLabel={SPR_MANAGER_SOX_DISCREPANCY_STATUS.discrepancyBadgeLabel}
      badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CorrectionRequestedUrgentRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="rejected"
      iconBgClassName="bg-[#ffd0db]"
      iconClassName="text-[#570b1d]"
      title={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.urgentStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.urgentStepHelper}
      badgeLabel={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.urgentBadgeLabel}
      badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CorrectionRequestedSubmittedHistoryRow({
  signDateLabel,
  withBottomBorder = false,
}: {
  signDateLabel: string;
  withBottomBorder?: boolean;
}) {
  return (
    <ProcessStepRow
      icon="document"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.submittedHistoryStepTitle(signDateLabel)}
      helper={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.submittedHistoryStepHelper}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CorrectionRequestedEmittedHistoryRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="document"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.emittedStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.emittedStepHelper(
        SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.emittedDateFallback,
      )}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CorrectionResubmittedKpiUrgentRow({
  withBottomBorder = false,
  onClick,
}: {
  withBottomBorder?: boolean;
  onClick?: () => void;
}) {
  const row = (
    <ProcessStepRow
      icon="clipboard-check"
      iconBgClassName="bg-[#e6f3ff]"
      iconClassName="text-[#0d3862]"
      title={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.kpiValidationUrgentStepTitle}
      helper={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.kpiValidationUrgentStepHelper}
      badgeLabel={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.kpiValidationUrgentBadgeLabel}
      badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
      withBottomBorder={withBottomBorder}
    />
  );

  if (!onClick) return row;

  return (
    <button type="button" onClick={onClick} className="w-full text-left hover:bg-[#fafcff]">
      {row}
    </button>
  );
}

function CorrectionResubmittedCompletedRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="approved"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.correctedStepTitle}
      helper={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.correctedStepHelper}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CorrectionResubmittedSubmittedHistoryRow({
  withBottomBorder = false,
}: {
  withBottomBorder?: boolean;
}) {
  return (
    <ProcessStepRow
      icon="document"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.submittedHistoryStepTitle(
        SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.resubmittedDateFallback,
      )}
      helper={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.submittedHistoryStepHelper}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function CorrectionResubmittedEmittedHistoryRow({ withBottomBorder = false }: { withBottomBorder?: boolean }) {
  return (
    <ProcessStepRow
      icon="document"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.emittedStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.emittedStepHelper(
        SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.emittedDateFallback,
      )}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

function ManagerApprovedRow({
  managerApprovalDateLabel,
  withBottomBorder = false,
}: {
  managerApprovalDateLabel: string;
  withBottomBorder?: boolean;
}) {
  return (
    <ProcessStepRow
      icon="double-check"
      iconBgClassName="bg-[#e0ffd3]"
      iconClassName="text-[#2a5c16]"
      title={SPR_APPROVED_STATUS.approvedStepTitle(SPR_ACTIVE_CYCLE.label)}
      helper={SPR_APPROVED_STATUS.approvedStepHelper(managerApprovalDateLabel)}
      badgeLabel="Completado"
      badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
      withBottomBorder={withBottomBorder}
    />
  );
}

// Tarjeta "Estatus del proceso" post-envio (Figma 1666:2384 / 1672:6045 / 1672:8792 / 1672:11231).
export function SprProcessStatusSection({
  variant = 'initial',
  managerApprovalDateLabel = SPR_APPROVED_STATUS.managerApprovalDateFallback,
  signDateLabel = SPR_SUBMITTED_STATUS.signDateFallbackLabel,
  onKpiValidationClick,
  onPendingReReviewClick,
  hasCorrectionHistory = false,
}: SprProcessStatusSectionProps) {
  return (
    <div className="w-full overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
      <div className="border-b border-[#e3e3e3] px-[14px] py-[10px]">
        <div className="flex items-center gap-[7px]">
          <BellIcon className="h-[12px] w-[15px] shrink-0 text-[#24588b]" />
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">Estatus del proceso</p>
        </div>
      </div>

      {variant === 'manager_waiting' ? (
        <ProcessStepRow
          icon="document"
          iconBgClassName="bg-[#f7f7f7]"
          iconClassName="text-[#acacac]"
          title={SPR_MANAGER_WAITING_STATUS.unavailableStepTitle(SPR_ACTIVE_CYCLE.label)}
          helper={SPR_MANAGER_WAITING_STATUS.unavailableStepHelper}
          badgeLabel={SPR_MANAGER_WAITING_STATUS.pendingBadgeLabel}
          badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
        />
      ) : variant === 'manager_pending_review' ? (
        <>
          <ProcessStepRow
            icon="document"
            iconBgClassName="bg-[#f7f7f7]"
            iconClassName="text-[#acacac]"
            title={SPR_MANAGER_PENDING_REVIEW_STATUS.pendingStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_PENDING_REVIEW_STATUS.pendingStepHelper}
            badgeLabel={SPR_MANAGER_PENDING_REVIEW_STATUS.pendingBadgeLabel}
            badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
            withBottomBorder
          />
          <ProcessStepRow
            icon="document"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_PENDING_REVIEW_STATUS.deliveredStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_PENDING_REVIEW_STATUS.deliveredStepHelper}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
          />
        </>
      ) : variant === 'manager_rejected_waiting_correction' ? (
        <>
          <ProcessStepRow
            icon="rejected"
            iconBgClassName="bg-[#ffd0db]"
            iconClassName="text-[#570b1d]"
            title={SPR_MANAGER_REJECTED_WAITING_STATUS.rejectedStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_REJECTED_WAITING_STATUS.rejectedStepHelper}
            badgeLabel={SPR_MANAGER_REJECTED_WAITING_STATUS.rejectedBadgeLabel}
            badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
            withBottomBorder
          />
          <ProcessStepRow
            icon="document"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_REJECTED_WAITING_STATUS.deliveredStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_REJECTED_WAITING_STATUS.deliveredStepHelper}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
          />
        </>
      ) : variant === 'manager_pending_re_review' ? (
        <>
          {onPendingReReviewClick ? (
            <button
              type="button"
              onClick={onPendingReReviewClick}
              className="w-full text-left hover:bg-[#fafcff]"
              aria-label="Revisar formulario con correcciones"
            >
              <ProcessStepRow
                icon="document"
                iconBgClassName="bg-[#f7f7f7]"
                iconClassName="text-[#acacac]"
                title={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.pendingStepTitle(SPR_ACTIVE_CYCLE.label)}
                helper={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.pendingStepHelper}
                badgeLabel={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.pendingBadgeLabel}
                badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
                withBottomBorder
              />
            </button>
          ) : (
            <ProcessStepRow
              icon="document"
              iconBgClassName="bg-[#f7f7f7]"
              iconClassName="text-[#acacac]"
              title={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.pendingStepTitle(SPR_ACTIVE_CYCLE.label)}
              helper={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.pendingStepHelper}
              badgeLabel={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.pendingBadgeLabel}
              badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
              withBottomBorder
            />
          )}
          <ProcessStepRow
            icon="corrected"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.rejectedStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.rejectedStepHelper}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
            withBottomBorder
          />
          <ProcessStepRow
            icon="document"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.deliveredStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_PENDING_RE_REVIEW_STATUS.deliveredStepHelper}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
          />
        </>
      ) : variant === 'kpi_validation_corrected' ? (
        <>
          <KpiValidationPendingRow withBottomBorder onClick={onKpiValidationClick} />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedCorrectedRow withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'correction_resubmitted' ? (
        <>
          <CorrectionResubmittedKpiUrgentRow withBottomBorder onClick={onKpiValidationClick} />
          <CorrectionResubmittedCompletedRow withBottomBorder />
          <CorrectionResubmittedSubmittedHistoryRow withBottomBorder />
          <CorrectionResubmittedEmittedHistoryRow />
        </>
      ) : variant === 'correction_requested' ? (
        <>
          <CorrectionRequestedUrgentRow withBottomBorder />
          <CorrectionRequestedSubmittedHistoryRow signDateLabel={signDateLabel} withBottomBorder />
          <CorrectionRequestedEmittedHistoryRow />
        </>
      ) : variant === 'kpi_validation_submitted_corrected' ? (
        <>
          <ResponsibleDiscrepancyPendingRow withBottomBorder />
          <KpiValidationCompletedRow withBottomBorder />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedCorrectedRow withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'kpi_validation_submitted' ? (
        <>
          <ResponsibleDiscrepancyPendingRow withBottomBorder />
          <KpiValidationCompletedRow withBottomBorder />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'kpi_validation_approved_corrected' ? (
        <>
          <ResponsibleReviewedValidatedRow withBottomBorder />
          <KpiValidationCompletedRow withBottomBorder />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedCorrectedRow withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'kpi_validation_approved' ? (
        <>
          <ResponsibleReviewedValidatedRow withBottomBorder />
          <KpiValidationCompletedRow withBottomBorder />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'kpi_validation' ? (
        <>
          <KpiValidationPendingRow withBottomBorder onClick={onKpiValidationClick} />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'manager_approved' ? (
        <>
          <ProcessStepRow
            icon="double-check"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_APPROVED_STATUS.approvedStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_APPROVED_STATUS.approvedStepHelper(managerApprovalDateLabel)}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
            withBottomBorder
          />
          {hasCorrectionHistory ? (
            <ProcessStepRow
              icon="rejected"
              iconBgClassName="bg-[#e0ffd3]"
              iconClassName="text-[#2a5c16]"
              title={SPR_MANAGER_APPROVED_STATUS.rejectedStepTitle(SPR_ACTIVE_CYCLE.label)}
              helper={SPR_MANAGER_APPROVED_STATUS.rejectedStepHelper}
              badgeLabel="Completado"
              badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
              withBottomBorder
            />
          ) : null}
          <ProcessStepRow
            icon="document"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_APPROVED_STATUS.deliveredStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_APPROVED_STATUS.deliveredStepHelper}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
          />
        </>
      ) : variant === 'manager_approved_sox_discrepancy' ? (
        <>
          <ManagerSoxDiscrepancyPendingRow withBottomBorder />
          <ProcessStepRow
            icon="double-check"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_APPROVED_STATUS.approvedStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_APPROVED_STATUS.approvedStepHelper(managerApprovalDateLabel)}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
            withBottomBorder
          />
          {hasCorrectionHistory ? (
            <ProcessStepRow
              icon="rejected"
              iconBgClassName="bg-[#e0ffd3]"
              iconClassName="text-[#2a5c16]"
              title={SPR_MANAGER_APPROVED_STATUS.rejectedStepTitle(SPR_ACTIVE_CYCLE.label)}
              helper={SPR_MANAGER_APPROVED_STATUS.rejectedStepHelper}
              badgeLabel="Completado"
              badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
              withBottomBorder
            />
          ) : null}
          <ProcessStepRow
            icon="document"
            iconBgClassName="bg-[#e0ffd3]"
            iconClassName="text-[#2a5c16]"
            title={SPR_MANAGER_APPROVED_STATUS.deliveredStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_MANAGER_APPROVED_STATUS.deliveredStepHelper}
            badgeLabel="Completado"
            badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
          />
        </>
      ) : variant === 'approved_corrected' ? (
        <>
          <KpiPendingRow withBottomBorder />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedCorrectedRow withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'approved' ? (
        <>
          <KpiPendingRow withBottomBorder />
          <ManagerApprovedRow managerApprovalDateLabel={managerApprovalDateLabel} withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : variant === 'rejected' ? (
        <>
          <ProcessStepRow
            icon="rejected"
            iconBgClassName="bg-[#ffd0db]"
            iconClassName="text-[#570b1d]"
            title={SPR_REJECTED_STATUS.rejectedStepTitle(SPR_ACTIVE_CYCLE.label)}
            helper={SPR_REJECTED_STATUS.rejectedStepHelper}
            badgeLabel={SPR_REJECTED_STATUS.rejectedBadgeLabel}
            badgeClassName="bg-[#ffeab8] text-[10px] text-[#8e6e3e]"
            withBottomBorder
          />
          <CompletedEmittedRow />
        </>
      ) : variant === 'corrected' ? (
        <>
          <CompletedCorrectedRow withBottomBorder />
          <CompletedEmittedRow />
        </>
      ) : (
        <ProcessStepRow
          icon="document"
          iconBgClassName="bg-[#e0ffd3]"
          iconClassName="text-[#2a5c16]"
          title={SPR_SUBMITTED_STATUS.processStepTitle(SPR_ACTIVE_CYCLE.label)}
          helper={SPR_SUBMITTED_STATUS.processStepHelper}
          badgeLabel="Completado"
          badgeClassName="bg-[#e0ffd3] text-[#2a5c16]"
        />
      )}
    </div>
  );
}

