import { useState } from 'react';
import { SprFooterInfoIcon, SprRejectCrossIcon, SprSubmitIcon } from '../icons/SprIcons';
import { SPR_AREA_REVIEW } from '../spr.constants';
import { SprAreaApproveModal, type SprAreaApproveModalSummary } from './SprAreaApproveModal';
import { SprAreaRejectModal } from './SprAreaRejectModal';

interface SprAreaReviewFooterProps {
  isApproving: boolean;
  isRejecting: boolean;
  canAct: boolean;
  /** Emisión automática (MA / Sustentabilidad): solo firmar, sin rechazar (Alexis). */
  allowReject?: boolean;
  actionErrorMessage: string | null;
  responsibleLabel: string;
  rejectErrorMessage: string | null;
  approveSummary: SprAreaApproveModalSummary;
  onRejectConfirm: (comments: string) => Promise<void>;
  onApproveConfirm: () => Promise<void>;
}

// Footer de acciones del gerente (Figma 1395:12112) + modales rechazo/aprobación.
export function SprAreaReviewFooter({
  isApproving,
  isRejecting,
  canAct,
  allowReject = true,
  actionErrorMessage,
  responsibleLabel,
  rejectErrorMessage,
  approveSummary,
  onRejectConfirm,
  onApproveConfirm,
}: SprAreaReviewFooterProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const isBusy = isApproving || isRejecting;
  const footerMessage = actionErrorMessage ?? SPR_AREA_REVIEW.footerInfo;

  function handleOpenRejectModal() {
    if (!allowReject || !canAct || isBusy) return;
    setRejectModalOpen(true);
  }

  function handleCloseRejectModal() {
    if (isRejecting) return;
    setRejectModalOpen(false);
  }

  async function handleConfirmReject(comments: string) {
    if (!allowReject) return;
    try {
      await onRejectConfirm(comments);
      setRejectModalOpen(false);
    } catch {
      // Mantener el modal abierto; el error se muestra via rejectErrorMessage.
    }
  }

  function handleOpenApproveModal() {
    if (!canAct || isBusy) return;
    setApproveModalOpen(true);
  }

  function handleCloseApproveModal() {
    if (isApproving) return;
    setApproveModalOpen(false);
  }

  async function handleConfirmApprove() {
    try {
      await onApproveConfirm();
      setApproveModalOpen(false);
    } catch {
      // Mantener el modal abierto; el error se muestra en el footer.
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#e3e3e3] bg-white px-[24px] py-[13px]">
        <div className="flex items-center gap-[6px]">
          <SprFooterInfoIcon className="h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
          <p
            className={`font-['Inter:Regular',sans-serif] text-[11px] ${actionErrorMessage ? 'text-[#bd3b5b]' : 'text-[#646464]'}`}
          >
            {footerMessage}
          </p>
        </div>

        <div className="flex items-center gap-[10px]">
          {allowReject ? (
            <button
              type="button"
              data-action="spr-area-reject"
              onClick={handleOpenRejectModal}
              disabled={!canAct || isBusy}
              className="flex h-[36px] items-center gap-[6px] rounded-[8px] border-[1.5px] border-[#bd3b5b] bg-white px-[21.5px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#bd3b5b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SprRejectCrossIcon className="h-[11px] w-[13.75px] shrink-0 text-[#bd3b5b]" />
              {isRejecting ? 'Rechazando…' : SPR_AREA_REVIEW.rejectLabel}
            </button>
          ) : null}
          <button
            type="button"
            data-action="spr-area-approve"
            onClick={handleOpenApproveModal}
            disabled={!canAct || isBusy}
            className="flex h-[36px] items-center gap-[6px] rounded-[8px] bg-[#c8a064] px-[24px] font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#001e39] hover:bg-[#b89158] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SprSubmitIcon className="h-[13px] w-[16.25px] shrink-0 text-[#001e39]" />
            {isApproving ? 'Aprobando…' : SPR_AREA_REVIEW.approveLabel}
          </button>
        </div>
      </div>

      {allowReject ? (
        <SprAreaRejectModal
          open={rejectModalOpen}
          responsibleLabel={responsibleLabel}
          isSubmitting={isRejecting}
          submitErrorMessage={rejectModalOpen ? rejectErrorMessage : null}
          onClose={handleCloseRejectModal}
          onConfirm={handleConfirmReject}
        />
      ) : null}

      <SprAreaApproveModal
        open={approveModalOpen}
        responsibleLabel={responsibleLabel}
        summary={approveSummary}
        isSubmitting={isApproving}
        onClose={handleCloseApproveModal}
        onConfirm={handleConfirmApprove}
      />
    </>
  );
}
