import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SprCycleValidationStatus, type SprCycleValidationResponse } from '@aurelia/contracts';
import { useReopenSprCycleValidation } from '../../../shared/hooks/useSprCycleValidations';
import { SprConfirmSendIcon, SprWarningTriangleIcon } from '../icons/SprIcons';
import { SPR_CONSOLIDATED_REPORT } from '../spr.constants';
import { initialsFromFullName } from '../sprConsolidatedSignatureLayout';
import {
  buildSoxValidationSlots,
  formatSoxValidationDecidedAt,
  type SprSoxValidationSlot,
} from '../sprConsolidatedValidationLayout';

type OrgArea = { id: string; code: string; name: string };

const copy = SPR_CONSOLIDATED_REPORT.validacionDiscrepancia;

function areaTone(code: string): 'blue' | 'amber' {
  return code === 'AREA-OPTACTIVOS' ? 'amber' : 'blue';
}

function avatarClass(tone: 'blue' | 'amber') {
  return tone === 'blue' ? 'bg-[#e6f3ff] text-[#0d3862]' : 'bg-[#fdf3e3] text-[#8e6e3e]';
}

function ReopenAreaModal({
  open,
  areaName,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: {
  open: boolean;
  areaName: string;
  isSubmitting: boolean;
  errorMessage: string | null;
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
        aria-labelledby="spr-sox-reopen-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="spr-sox-reopen-modal-title" className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">
          {`Reabrir proceso para ${areaName}`}
        </p>
        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {copy.reopenModalBody}
        </p>
        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {copy.reopenModalQuestion}
        </p>
        {errorMessage ? (
          <p className="pt-[10px] font-['Inter:Regular',sans-serif] text-[11px] text-[#bd3b5b]" role="alert">
            {errorMessage}
          </p>
        ) : null}
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

function DiscrepancyCaseCard({
  slot,
  awaitingCorrection,
}: {
  slot: SprSoxValidationSlot;
  awaitingCorrection: boolean;
}) {
  const validation = slot.validation;
  if (!validation) return null;
  const isDiscrepancy = validation.status === SprCycleValidationStatus.DISCREPANCY_REPORTED;
  const isReopened = validation.status === SprCycleValidationStatus.REOPENED;
  if (!isDiscrepancy && !isReopened) return null;

  const actorName = validation.actorFullName?.trim() || 'Responsable de área';
  const decidedLabel = formatSoxValidationDecidedAt(validation.decidedAt);
  const tone = areaTone(slot.code);

  return (
    <div className="rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px]">
      <div className="flex items-start gap-[10px]">
        <span
          className={`flex size-[30px] shrink-0 items-center justify-center rounded-full font-['Inter:Bold',sans-serif] text-[11px] font-bold ${avatarClass(tone)}`}
        >
          {initialsFromFullName(actorName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#131313]">
            {actorName} · {slot.name}
          </p>
          {decidedLabel ? (
            <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
              Reportado el {decidedLabel}
            </p>
          ) : null}
          {validation.comments?.trim() ? (
            <p className="mt-[6px] whitespace-pre-wrap rounded-[5px] bg-[#ffd0db] px-[8px] py-[6px] font-['Inter:Italic',sans-serif] text-[10.5px] italic leading-[15.75px] text-[#570b1d]">
              {validation.comments.trim()}
            </p>
          ) : (
            <p className="mt-[6px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
              Sin comentario detallado.
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-[4px] bg-[#ffd0db] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#570b1d]">
          {awaitingCorrection || isReopened ? 'En corrección' : copy.unresolvedBadge}
        </span>
      </div>
    </div>
  );
}

/**
 * Tab Validación — discrepancia SOX post-firmas a nivel área (Figma 1760:23481).
 * CTA Reabrir → POST .../validations/:areaId/reopen (Fase 5.1).
 */
export function SprSoxValidationDiscrepancyPanel({
  cycleId,
  areas,
  validations,
}: {
  cycleId: string;
  areas: OrgArea[] | null | undefined;
  validations: SprCycleValidationResponse[];
}) {
  const slots = useMemo(() => buildSoxValidationSlots(areas, validations), [areas, validations]);
  const reopenMutation = useReopenSprCycleValidation(cycleId);
  const [reopenAreaId, setReopenAreaId] = useState<string | null>(null);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const reopenSlot = slots.find((slot) => slot.areaId === reopenAreaId) ?? null;
  const hasAnyReopened = slots.some(
    (slot) => slot.validation?.status === SprCycleValidationStatus.REOPENED,
  );
  const alertTitle = hasAnyReopened ? copy.awaitingCorrectionAlertTitle : copy.alertTitle;

  async function confirmReopen() {
    if (!reopenAreaId) return;
    setReopenError(null);
    try {
      await reopenMutation.mutateAsync({ areaId: reopenAreaId });
      setReopenAreaId(null);
    } catch (error) {
      setReopenError(error instanceof Error ? error.message : 'No se pudo reabrir el área SOX');
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
        <div className="flex items-center gap-[7px] bg-[#001e39] px-[16px] py-[11px]">
          <SprWarningTriangleIcon className="h-[12px] w-[15px] shrink-0 text-white" />
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white">{alertTitle}</p>
        </div>

        {slots.map((slot, index) => {
          const isDiscrepancy =
            slot.validation?.status === SprCycleValidationStatus.DISCREPANCY_REPORTED;
          const isReopened = slot.validation?.status === SprCycleValidationStatus.REOPENED;
          const showCase = isDiscrepancy || isReopened;
          const isLast = index === slots.length - 1;
          const caseCount = showCase ? 1 : 0;

          return (
            <div key={slot.code} className={isLast ? undefined : 'border-b border-[#e3e3e3]'}>
              <div className="border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[8px]">
                <div className="flex items-center justify-between gap-[8px]">
                  <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.48px] text-[#646464]">
                    {slot.name}
                  </p>
                  <span
                    className={`rounded-[5px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold ${
                      showCase ? 'bg-[#ffd0db] text-[#570b1d]' : 'bg-[#f7f7f7] text-[#acacac]'
                    }`}
                  >
                    {caseCount > 0 ? copy.casesCountLabel(caseCount) : copy.noCasesLabel}
                  </span>
                </div>
              </div>

              {showCase ? (
                <div className="p-[16px]">
                  <DiscrepancyCaseCard slot={slot} awaitingCorrection={isReopened} />
                  {isDiscrepancy && slot.areaId ? (
                    <div className="flex justify-end pt-[12px]">
                      <button
                        type="button"
                        onClick={() => {
                          setReopenError(null);
                          setReopenAreaId(slot.areaId);
                        }}
                        className="h-[36px] rounded-[7px] bg-[#c8a064] px-[20px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-white hover:bg-[#b89255]"
                      >
                        {copy.reopenCta}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <ReopenAreaModal
        open={Boolean(reopenAreaId)}
        areaName={reopenSlot?.name ?? 'esta área'}
        isSubmitting={reopenMutation.isPending}
        errorMessage={reopenError}
        onClose={() => {
          if (reopenMutation.isPending) return;
          setReopenAreaId(null);
          setReopenError(null);
        }}
        onConfirm={confirmReopen}
      />
    </>
  );
}
