import { useEffect, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { SnackbarCheckIcon } from '../../../shared/components/icons/SnackbarCheckIcon';
import { InspectionCloseIcon, InspectionInfoIcon } from '../icons/InspectionsIcons';

export function FindingRejectDialog({ open, isSubmitting, onClose, onConfirm }: { open: boolean; isSubmitting: boolean; onClose: () => void; onConfirm: (reason: string) => void | Promise<void> }): ReactElement | null {
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  async function submit() {
    if (!canSubmit) return;
    await onConfirm(reason.trim());
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] px-[16px]" role="presentation">
      <div className="w-[495px] max-w-full rounded-[16px] bg-white p-[16px] shadow-[0_4px_14px_rgba(19,19,19,0.24)]" role="dialog" aria-modal="true" aria-labelledby="reject-observation-title">
        <div className="flex items-center justify-between">
          <div className="text-[#24588b]"><InspectionInfoIcon /></div>
          <button type="button" className="flex size-[32px] items-center justify-center text-[#131313]" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar rechazo"><InspectionCloseIcon /></button>
        </div>
        <div className="mt-[32px] flex flex-col gap-[8px]">
          <p id="reject-observation-title" className="text-[18px] font-bold leading-[22px] tracking-[0.36px] text-[#2a2a2a]">Rechazar observación</p>
          <p className="text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">Para rechazar esta observación debe llenar el siguiente campo explicando el motivo y solicitud de corrección</p>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="reject-observation-reason" className="text-[13px] font-bold leading-none text-[#131313]">Motivo y solicitud</label>
            <textarea id="reject-observation-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="h-[80px] min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#d1d1d1] bg-[#f6faff] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#757575]" placeholder="Describa la acción correctiva a ejecutar..." disabled={isSubmitting} />
          </div>
        </div>
        <div className="mt-[32px] flex gap-[12px]">
          <button type="button" className="flex h-[40px] min-w-0 flex-1 items-center justify-center rounded-[8px] border border-[#c8a064] bg-white px-[16px] py-[8px] text-[14px] font-bold tracking-[0.28px] text-[#c8a064]" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button type="button" className={`flex h-[40px] min-w-0 flex-1 items-center justify-center rounded-[8px] px-[16px] py-[8px] text-[14px] font-bold tracking-[0.28px] ${canSubmit ? 'bg-[#c8a064] text-white' : 'bg-[#d1d1d1] text-[#646464]'}`} onClick={submit} disabled={!canSubmit}>{isSubmitting ? 'Rechazando...' : 'Rechazar observación'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ObservationRejectedToast({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-[83px] left-1/2 z-[80] flex -translate-x-1/2 items-center gap-[8px] rounded-[8px] bg-[#54a036] p-[12px] text-white shadow-[0_4px_14px_rgba(19,19,19,0.18)]" role="status" aria-live="polite">
      <span className="flex size-[24px] shrink-0 items-center justify-center"><SnackbarCheckIcon className="block size-[20px] shrink-0" /></span>
      <p className="whitespace-nowrap text-[14px] font-bold leading-[22.7px] tracking-[0.28px]">Observación rechazada</p>
      <button type="button" className="flex size-[16px] items-center justify-center" onClick={onClose} aria-label="Ocultar confirmación"><InspectionCloseIcon /></button>
    </div>
  );
}
