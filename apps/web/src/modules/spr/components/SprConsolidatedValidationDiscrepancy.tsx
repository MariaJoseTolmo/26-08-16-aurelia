import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { SprConsolidatedDiscrepancyDetailView } from './SprConsolidatedDiscrepancyDetailView';
import { SprConfirmSendIcon, SprProcessStatusDocumentIcon, SprWarningTriangleIcon } from '../icons/SprIcons';
import {
  SPR_CONSOLIDATED_REPORT,
  type SprKpiValidationRowStatus,
} from '../spr.constants';

const copy = SPR_CONSOLIDATED_REPORT.validacionDiscrepancia;
const kpiRows = SPR_CONSOLIDATED_REPORT.validacionDiscrepanciaKpiRows;

function areaPillClass(tone: 'blue' | 'amber') {
  return tone === 'blue' ? 'bg-[#e6f3ff] text-[#0d3862]' : 'bg-[#fdf3e3] text-[#8e6e3e]';
}

function avatarClass(tone: 'blue' | 'amber') {
  return tone === 'blue' ? 'bg-[#e6f3ff] text-[#0d3862]' : 'bg-[#fdf3e3] text-[#8e6e3e]';
}

function StatusBadge({ status }: { status: SprKpiValidationRowStatus }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-[4px] rounded-[4px] bg-[#e0ffd3] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#2a5c16]">
        <span aria-hidden>✓</span>
        Confirmado
      </span>
    );
  }
  if (status === 'discrepancy') {
    return (
      <span className="inline-flex items-center gap-[4px] rounded-[4px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#570b1d]">
        <SprWarningTriangleIcon className="h-[8px] w-[10px] shrink-0" />
        Discrepancia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[4px] rounded-[4px] border border-[#e3e3e3] bg-[#f7f7f7] px-[8px] py-[3px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#acacac]">
      <span aria-hidden>⏱</span>
      Pendiente
    </span>
  );
}

function ReopenAreaModal({
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="flex w-full max-w-[440px] flex-col rounded-[12px] bg-white p-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-reopen-area-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="spr-reopen-area-modal-title" className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">
          {copy.reopenModalTitle}
        </p>
        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {copy.reopenModalBody}
        </p>
        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {copy.reopenModalQuestion}
        </p>
        <div className="flex justify-end gap-[10px] pt-[16px]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[34px] rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464] disabled:opacity-50"
          >
            {copy.reopenModalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex h-[34px] items-center gap-[6px] rounded-[7px] bg-[#c8a064] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#001e39] disabled:opacity-50"
          >
            <SprConfirmSendIcon className="h-[11px] w-[13.75px] shrink-0 text-[#001e39]" />
            {isSubmitting ? copy.reopenModalSubmitting : copy.reopenModalConfirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Figma 1760:24201 / 1760:25798 — validacion con discrepancia (requiere revision o esperando correccion).
export function SprConsolidatedValidationDiscrepancy({
  variant = 'requiresReview',
  showDetail,
  reopenModalOpen,
  onOpenDetail,
  onCloseDetail,
  onOpenReopenModal,
  onCloseReopenModal,
}: {
  variant?: 'requiresReview' | 'awaitingCorrection';
  showDetail: boolean;
  reopenModalOpen: boolean;
  onOpenDetail: () => void;
  onCloseDetail: () => void;
  onOpenReopenModal: () => void;
  onCloseReopenModal: () => void;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAwaitingCorrection = variant === 'awaitingCorrection';
  const alertTitle = isAwaitingCorrection ? copy.awaitingCorrectionAlertTitle : copy.alertTitle;

  async function handleConfirmReopen() {
    setIsSubmitting(true);
    try {
      navigate(copy.specialistPostReopenDemoHref);
    } finally {
      setIsSubmitting(false);
      onCloseReopenModal();
    }
  }

  if (showDetail) {
    return (
      <>
        <SprConsolidatedDiscrepancyDetailView onBack={onCloseDetail} />
        <ReopenAreaModal
          open={!isAwaitingCorrection && reopenModalOpen}
          isSubmitting={isSubmitting}
          onClose={onCloseReopenModal}
          onConfirm={handleConfirmReopen}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-[14px]">
        <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
          <div className="flex items-center gap-[7px] bg-[#001e39] px-[16px] py-[11px]">
            <SprWarningTriangleIcon className="h-[12px] w-[15px] shrink-0 text-white" />
            <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{alertTitle}</p>
          </div>

        <div className="border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.48px] text-[#646464]">
              {copy.areaServiciosLabel}
            </p>
            <span className="rounded-[5px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#570b1d]">
              {copy.casesCountLabel(1)}
            </span>
          </div>
        </div>

        <div className="p-[16px]">
          <button
            type="button"
            onClick={onOpenDetail}
            className="w-full rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px] text-left hover:border-[#bd3b5b]"
          >
            <div className="flex items-start gap-[10px]">
              <span className={`flex size-[30px] shrink-0 items-center justify-center rounded-full font-['Inter:Bold',sans-serif] text-[11px] font-bold ${avatarClass('blue')}`}>
                FN
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#131313]">{copy.reportedCaseTitle}</p>
                <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{copy.reportedAtLabel}</p>
                <p className="pt-[6px] rounded-[5px] bg-[#ffd0db] px-[8px] py-[6px] font-['Inter:Italic',sans-serif] text-[10.5px] italic leading-[15.75px] text-[#570b1d]">
                  {copy.commentFallback}
                </p>
              </div>
              <span className="shrink-0 rounded-[4px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#570b1d]">
                {copy.unresolvedBadge}
              </span>
            </div>
          </button>

          {!isAwaitingCorrection ? (
            <div className="flex justify-end pt-[12px]">
              <button
                type="button"
                onClick={onOpenReopenModal}
                className="h-[36px] rounded-[7px] bg-[#c8a064] px-[20px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white hover:bg-[#b89255]"
              >
                {copy.reopenCta}
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.48px] text-[#646464]">
              {copy.areaOptimizacionLabel}
            </p>
            <span className="rounded-[5px] bg-[#f7f7f7] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#acacac]">
              {copy.noCasesLabel}
            </span>
          </div>
        </div>
      </section>

        <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-[#e3e3e3] px-[14px] py-[10px]">
            <div className="flex items-center gap-[7px]">
              <SprProcessStatusDocumentIcon className="h-[12px] w-[15px] shrink-0 text-[#001e39]" />
              <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">
                {copy.kpiTableTitle}
              </p>
            </div>
          <span className="inline-flex items-center gap-[4px] rounded-[5px] bg-[#ffd0db] px-[8px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#570b1d]">
            <span className="size-[8px] rounded-full bg-[#bd3b5b]" aria-hidden />
            {copy.kpiTableAlert}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f7f7]">
                {['KPI', 'Área', 'Responsable', 'Valor SAC', 'Estado', 'Comentario'].map((header) => (
                  <th
                    key={header}
                    className="border-b border-[#e3e3e3] px-[12px] py-[8px] text-left font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.48px] text-[#646464]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpiRows.map((row) => (
                <tr key={row.id} className="border-b border-[#f4f6f9]">
                  <td className="px-[12px] py-[10px] font-['Inter:Regular',sans-serif] text-[11px] text-[#333]">{row.kpi}</td>
                  <td className="px-[12px] py-[10px]">
                    <span className={`rounded-[4px] px-[6px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold ${areaPillClass(row.areaTone)}`}>
                      {row.area}
                    </span>
                  </td>
                  <td className="px-[12px] py-[10px]">
                    <div className="flex items-center gap-[7px]">
                      <span className={`flex size-[24px] items-center justify-center rounded-full font-['Inter:Bold',sans-serif] text-[9px] font-bold ${avatarClass(row.responsibleTone)}`}>
                        {row.responsibleInitials}
                      </span>
                      <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#333]">{row.responsibleName}</span>
                    </div>
                  </td>
                  <td className="px-[12px] py-[10px] font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#333]">
                    {row.sacValue}
                  </td>
                  <td className="px-[12px] py-[10px]">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="max-w-[280px] px-[12px] py-[10px]">
                    {row.status === 'discrepancy' ? (
                      <p className="rounded-[5px] bg-[#ffd0db] px-[8px] py-[6px] font-['Inter:Italic',sans-serif] text-[10.5px] italic leading-[15.75px] text-[#570b1d]">
                        {row.comment}
                      </p>
                    ) : (
                      <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">{row.comment}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#e3e3e3] bg-[#f7f7f7] px-[14px] py-[10px]">
          <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">{copy.footerSummary}</p>
          <button
            type="button"
            className="h-[27px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#646464]"
          >
            {copy.resendReminderLabel}
          </button>
        </div>
        </section>
      </div>

      <ReopenAreaModal
        open={!isAwaitingCorrection && reopenModalOpen}
        isSubmitting={isSubmitting}
        onClose={onCloseReopenModal}
        onConfirm={handleConfirmReopen}
      />
    </>
  );
}
