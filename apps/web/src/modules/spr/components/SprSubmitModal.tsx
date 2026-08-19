import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../../../shared/stores/session.store';
import { SprConfirmSendIcon, SprDigitalSignatureIcon, SprDigitalSignedCheckIcon } from '../icons/SprIcons';
import { SPR_SUBMIT_MODAL } from '../spr.constants';

export interface SprSubmitModalSummary {
  completedCount: number;
  totalCount: number;
  attachmentCount: number;
  soxParameterCount: number;
}

export type SprSubmitModalVariant = 'initial' | 'correction';

interface SprSubmitModalProps {
  open: boolean;
  summary: SprSubmitModalSummary;
  variant?: SprSubmitModalVariant;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between pt-[3px] first:pt-[6px]">
      <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#2a5c16]">{label}</p>
      <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold text-[#2a5c16]">{value}</p>
    </div>
  );
}

// PLACEHOLDER: firma digital sin integracion con proveedor/backend (Figma 1666:3035 / 1672:7702 / 1672:7774).
export function SprSubmitModal({
  open,
  summary,
  variant = 'initial',
  isSubmitting,
  onClose,
  onConfirm,
}: SprSubmitModalProps): JSX.Element | null {
  const user = useSessionStore((state) => state.user);
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) {
      setIsSigned(false);
      setSignedAt(null);
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const signerName = user?.fullName ?? 'Usuario';
  const signerRoleLabel = 'Responsable de Área';
  const signedAtLabel = signedAt ? dateTimeFormatter.format(signedAt) : 'Fecha y hora automática';
  const signerMeta = `${signerName} · ${signerRoleLabel} · ${signedAtLabel}`;

  const attachmentLabel = summary.attachmentCount === 1 ? '1 archivo' : `${summary.attachmentCount} archivos`;
  const soxLabel = summary.soxParameterCount === 1 ? '1 parámetro' : `${summary.soxParameterCount} parámetros`;
  const canConfirm = isSigned && !isSubmitting;
  const description =
    variant === 'correction' ? SPR_SUBMIT_MODAL.correctionDescription : SPR_SUBMIT_MODAL.initialDescription;
  const showSummary = variant === 'initial';

  function handleSign() {
    if (isSigned || isSubmitting) return;
    setIsSigned(true);
    setSignedAt(new Date());
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="flex w-full max-w-[420px] flex-col rounded-[12px] bg-white p-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spr-submit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="spr-submit-modal-title" className="font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#001e39]">
          {SPR_SUBMIT_MODAL.title}
        </p>

        <p className="pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] leading-[16.5px] text-[#646464]">
          {description}
        </p>

        {showSummary ? (
          <div className="pt-[16px]">
            <div className="rounded-[8px] border border-[#a8dfa8] bg-[#e0ffd3] p-[12px]">
              <p className="font-['Inter:Bold',sans-serif] text-[9.5px] font-bold uppercase tracking-[0.57px] text-[#2a5c16]">
                {SPR_SUBMIT_MODAL.summaryTitle}
              </p>
              <SummaryRow label="Parámetros completados" value={`${summary.completedCount} de ${summary.totalCount}`} />
              <SummaryRow label="Documentos adjuntos" value={attachmentLabel} />
              <SummaryRow label="Parámetros con control SOX" value={soxLabel} />
            </div>
          </div>
        ) : null}

        <div className={showSummary ? 'pt-[14px]' : isSigned ? 'pt-[14px]' : 'pt-[16px]'}>
          <div className="h-[117px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] p-[13px]">
            <p className="text-center font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">Firma digital</p>

            {isSigned ? (
              <div className="mt-[8px] flex h-[52px] w-full items-center justify-center gap-[6px] rounded-[7px] border-[1.5px] border-dashed border-[#3a9b3a] bg-[#f0fff5] p-[1.5px]">
                <SprDigitalSignedCheckIcon className="h-[14px] w-[17.5px] shrink-0 text-[#3a9b3a]" />
                <span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#3a9b3a]">
                  Firmado digitalmente
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSign}
                disabled={isSubmitting}
                className="mt-[8px] flex h-[52px] w-full items-center justify-center gap-[6px] rounded-[7px] border-[1.5px] border-dashed border-[#d1d1d1] p-[1.5px] transition-colors hover:border-[#acacac] hover:bg-white disabled:cursor-default"
              >
                <SprDigitalSignatureIcon className="h-[14px] w-[17.5px] shrink-0 text-[#acacac]" />
                <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#acacac]">Haz clic para firmar digitalmente</span>
              </button>
            )}

            <p className="pt-[8px] text-center font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">{signerMeta}</p>
          </div>
        </div>

        <div className="flex justify-end gap-[10px] pt-[16px]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[34px] rounded-[7px] border border-[#e3e3e3] bg-white px-[17px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex h-[34px] items-center gap-[6px] rounded-[7px] px-[16px] font-['Inter:Bold',sans-serif] text-[12px] font-bold transition-colors ${
              canConfirm
                ? 'bg-[#c8a064] text-[#001e39] hover:bg-[#b89158]'
                : 'cursor-not-allowed bg-[#e3e3e3] text-[#acacac]'
            }`}
          >
            <SprConfirmSendIcon
              className={`h-[11px] w-[13.75px] shrink-0 ${canConfirm ? 'text-[#001e39]' : 'text-[#acacac]'}`}
            />
            {isSubmitting ? 'Enviando…' : 'Confirmar y enviar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
