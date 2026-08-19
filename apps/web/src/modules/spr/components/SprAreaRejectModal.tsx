import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SprConfirmSendIcon, SprProcessStatusRejectedIcon } from '../icons/SprIcons';
import { SPR_ACTIVE_CYCLE, SPR_AREA_REJECT_MODAL } from '../spr.constants';

interface SprAreaRejectModalProps {
  open: boolean;
  responsibleLabel: string;
  isSubmitting: boolean;
  submitErrorMessage: string | null;
  onClose: () => void;
  onConfirm: (comments: string) => void | Promise<void>;
}

function parseDaysRemainingLabel(deadlineHelper: string) {
  return deadlineHelper.replace(/\s*restantes?$/i, '').trim() || deadlineHelper;
}

// Modal de rechazo del gerente (Figma 1399:14360 / 1399:14886).
export function SprAreaRejectModal({
  open,
  responsibleLabel,
  isSubmitting,
  submitErrorMessage,
  onClose,
  onConfirm,
}: SprAreaRejectModalProps): JSX.Element | null {
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (!open) setComments('');
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const trimmedComments = comments.trim();
  const canSubmit = trimmedComments.length > 0 && !isSubmitting;
  const daysRemainingLabel = parseDaysRemainingLabel(SPR_ACTIVE_CYCLE.deadlineHelper);

  async function handleSubmit() {
    if (!canSubmit) return;
    await onConfirm(trimmedComments);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="flex w-full max-w-[440px] flex-col rounded-[12px] bg-white p-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-area-reject-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="spr-area-reject-modal-title" className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">
          {SPR_AREA_REJECT_MODAL.title}
        </p>

        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {SPR_AREA_REJECT_MODAL.description}
        </p>

        <div className="pt-[18px]">
          <p className="pb-[6px] font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">
            {SPR_AREA_REJECT_MODAL.reasonLabel} <span className="text-[#bd3b5b]">*</span>
          </p>
          <textarea
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            placeholder={SPR_AREA_REJECT_MODAL.reasonPlaceholder(responsibleLabel)}
            disabled={isSubmitting}
            rows={4}
            className="h-[100px] w-full resize-none rounded-[8px] border border-[#d1d1d1] bg-[#e6f3ff] px-[13px] py-[11px] font-['Inter:Regular',sans-serif] text-[12px] text-[#131313] outline-none placeholder:text-[#acacac] focus:border-[#24588b] disabled:opacity-60"
          />
        </div>

        <div className="pt-[12px]">
          <div className="flex items-start gap-[8px] rounded-[7px] bg-[#ffd0db] px-[12px] py-[9px]">
            <SprProcessStatusRejectedIcon className="mt-px h-[16px] w-[16px] shrink-0 text-[#570b1d]" />
            <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#570b1d]">
              El responsable tendrá hasta el{' '}
              <span className="font-['Inter:Bold',sans-serif] font-bold">{SPR_ACTIVE_CYCLE.deadlineLabel}</span> para
              corregir y reenviar el formulario. Quedan{' '}
              <span className="font-['Inter:Bold',sans-serif] font-bold">{daysRemainingLabel}</span>.
            </p>
          </div>
        </div>

        {submitErrorMessage ? (
          <p className="pt-[10px] font-['Inter:Regular',sans-serif] text-[11px] text-[#bd3b5b]">{submitErrorMessage}</p>
        ) : null}

        <div className="flex justify-end gap-[10px] pt-[16px]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[34px] rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
          >
            {SPR_AREA_REJECT_MODAL.cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex h-[34px] items-center gap-[6px] rounded-[7px] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold transition-colors ${
              canSubmit
                ? 'bg-[#bd3b5b] text-white hover:bg-[#a83350]'
                : 'cursor-not-allowed bg-[#e3e3e3] text-[#acacac]'
            }`}
          >
            <SprConfirmSendIcon className={`h-[11px] w-[13.75px] shrink-0 ${canSubmit ? 'text-white' : 'text-[#acacac]'}`} />
            {isSubmitting ? 'Enviando…' : SPR_AREA_REJECT_MODAL.submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
