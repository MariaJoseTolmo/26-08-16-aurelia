import {
  SPR_ACTIVE_CYCLE,
  SPR_APPROVED_STATUS,
  SPR_MANAGER_APPROVED_STATUS,
  SPR_MANAGER_REJECTED_WAITING_STATUS,
  SPR_MANAGER_WAITING_STATUS,
  SPR_REJECTED_STATUS,
  SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS,
  SPR_RESPONSIBLE_KPI_VALIDATION_STATUS,
  SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS,
  SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS,
  SPR_SUBMITTED_STATUS,
} from '../spr.constants';

export type SprSubmittedSummaryVariant =
  | 'pending_approval'
  | 'rejected'
  | 'completed'
  | 'kpi_validation_pending'
  | 'kpi_review_submitted'
  | 'correction_requested'
  | 'correction_resubmitted'
  | 'manager_approved'
  | 'waiting_for_responsible'
  | 'manager_corrections_pending';

interface SprSubmittedSummaryHeaderProps {
  signDateLabel: string;
  variant?: SprSubmittedSummaryVariant;
}

function SummaryColumn({
  label,
  value,
  helper,
  valueClassName,
  withDivider = true,
}: {
  label: string;
  value: string;
  helper: string;
  valueClassName: string;
  withDivider?: boolean;
}) {
  return (
    <div className={`flex flex-col ${withDivider ? 'border-r border-[#e3e3e3] pr-[21px]' : 'px-[20px]'}`}>
      <p className="pb-[3px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.63px] text-[#acacac]">{label}</p>
      <p className={`font-['Inter:Bold',sans-serif] text-[12px] font-bold ${valueClassName}`}>{value}</p>
      <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{helper}</p>
    </div>
  );
}

// Barra resumen post-envio (Figma 1666:2149 / 1672:8919 / 1672:11206).
export function SprSubmittedSummaryHeader({ signDateLabel, variant = 'pending_approval' }: SprSubmittedSummaryHeaderProps) {
  const statusCopy =
    variant === 'rejected'
      ? SPR_REJECTED_STATUS
      : variant === 'kpi_validation_pending'
        ? SPR_RESPONSIBLE_KPI_VALIDATION_STATUS
        : variant === 'kpi_review_submitted'
          ? SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS
          : variant === 'correction_requested'
            ? SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS
            : variant === 'correction_resubmitted'
              ? SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS
          : variant === 'completed' || variant === 'manager_approved'
          ? variant === 'manager_approved'
            ? SPR_MANAGER_APPROVED_STATUS
            : SPR_APPROVED_STATUS
          : variant === 'waiting_for_responsible'
            ? SPR_MANAGER_WAITING_STATUS
            : variant === 'manager_corrections_pending'
              ? SPR_MANAGER_REJECTED_WAITING_STATUS
              : SPR_SUBMITTED_STATUS;
  const cycleStatusLabel =
    variant === 'correction_requested' || variant === 'correction_resubmitted'
      ? variant === 'correction_resubmitted'
        ? SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.cycleStatusLabel
        : SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.cycleStatusLabel
      : variant === 'manager_approved'
      ? SPR_MANAGER_APPROVED_STATUS.cycleStatusLabel
      : variant === 'kpi_validation_pending' || variant === 'kpi_review_submitted'
        ? SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.cycleStatusLabel
        : SPR_ACTIVE_CYCLE.cycleStatusLabel;
  const reportHelper =
    variant === 'correction_requested'
      ? SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS.reportStatusHelper
      : variant === 'correction_resubmitted'
        ? SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS.reportStatusHelper
      : variant === 'kpi_validation_pending' || variant === 'kpi_review_submitted'
        ? SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.reportSignHelper(
            SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.reportSignDateFallback,
            SPR_RESPONSIBLE_KPI_VALIDATION_STATUS.reportSignerFallback,
          )
        : `Fecha de firma · ${signDateLabel}`;
  const formStatusColor =
    variant === 'rejected' || variant === 'manager_corrections_pending' || variant === 'correction_requested'
      ? 'text-[#570b1d]'
      : variant === 'completed' ||
          variant === 'manager_approved' ||
          variant === 'kpi_validation_pending' ||
          variant === 'kpi_review_submitted' ||
          variant === 'correction_resubmitted'
        ? 'text-[#3a9b3a]'
        : 'text-[#8e6e3e]';

  return (
    <div className="w-full border-b border-[#e3e3e3] bg-white px-[20px] py-[10px]">
      <div className="flex flex-wrap items-stretch">
        <SummaryColumn
          label="Ciclo"
          value={SPR_ACTIVE_CYCLE.label}
          helper={cycleStatusLabel}
          valueClassName="text-[#131313]"
        />
        <div className="pl-[20px]">
          <SummaryColumn
            label="Tu formulario"
            value={statusCopy.formStatusLabel}
            helper={statusCopy.formStatusHelper}
            valueClassName={formStatusColor}
          />
        </div>
        <SummaryColumn
          label="Reporte SPR"
          value={statusCopy.reportStatusLabel}
          helper={reportHelper}
          valueClassName="text-[#24588b]"
          withDivider={false}
        />
      </div>
    </div>
  );
}
