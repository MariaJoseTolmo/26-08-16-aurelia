import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InspectionCloseIcon, InspectionInfoIcon } from '../icons/InspectionsIcons';

function isManualExecutionCancel(button: HTMLButtonElement) {
  if (button.dataset.manualExecutionCancelConfirm === 'true') return false;
  if (button.textContent?.trim() !== 'Cancelar') return false;
  const root = button.closest<HTMLElement>('.absolute.inset-0');
  const text = root?.textContent ?? '';
  return text.includes('Detalle del hallazgo') && text.includes('Sin red · guardando localmente') && text.includes('Marcar como ejecutado') && text.includes('Fotografía "Después"');
}

export function ManualExecutionCancelConfirmBridge() {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const bypassRef = useRef(false);
  const [dialogHost, setDialogHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function captureCancelClick(event: MouseEvent) {
      if (bypassRef.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button');
      if (!(button instanceof HTMLButtonElement)) return;
      if (!isManualExecutionCancel(button)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      cancelButtonRef.current = button;
      setDialogHost(button.closest<HTMLElement>('section[role="dialog"]'));
      setOpen(true);
    }

    document.addEventListener('click', captureCancelClick, true);
    return () => document.removeEventListener('click', captureCancelClick, true);
  }, []);

  function closeDialog() {
    setOpen(false);
    cancelButtonRef.current = null;
    setDialogHost(null);
  }

  function confirmCancel() {
    const button = cancelButtonRef.current;
    setOpen(false);
    if (!button) return;
    bypassRef.current = true;
    button.click();
    window.setTimeout(() => {
      bypassRef.current = false;
      cancelButtonRef.current = null;
      setDialogHost(null);
    }, 0);
  }

  if (!open) return null;

  const node = <div className={`${dialogHost ? 'absolute' : 'fixed'} inset-0 z-[10020] flex items-center justify-center bg-[rgba(19,19,19,0.75)] px-[16px]`} role="presentation"><div className="w-[328px] max-w-full rounded-[16px] bg-white p-[16px] shadow-[0_4px_14px_rgba(19,19,19,0.24)]" role="dialog" aria-modal="true" aria-labelledby="manual-cancel-title"><div className="flex items-center justify-between"><div className="text-[#24588b]"><InspectionInfoIcon /></div><button type="button" className="flex size-[32px] items-center justify-center text-[#131313]" onClick={closeDialog} aria-label="Cerrar cancelación"><InspectionCloseIcon /></button></div><div className="mt-[32px] flex flex-col gap-[8px]"><p id="manual-cancel-title" className="text-[18px] font-bold leading-[22px] tracking-[0.36px] text-[#2a2a2a]">Cancelar</p><p className="whitespace-pre-line text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">Usted está dando por cancelada la ejecución de esta inspección. Al hacer esto se borrarán todos los datos ingresados.{`\n`}¿Estás de acuerdo?</p></div><div className="mt-[32px] flex flex-col gap-[12px]"><button type="button" data-manual-execution-cancel-confirm="true" className="flex h-[40px] w-full items-center justify-center rounded-[8px] bg-[#c8a064] px-[16px] py-[8px] text-[14px] font-bold tracking-[0.28px] text-white" onClick={confirmCancel}>Cancelar ejecución</button><button type="button" className="flex h-[40px] w-full items-center justify-center rounded-[8px] border border-[#c8a064] bg-white px-[16px] py-[8px] text-[14px] font-bold tracking-[0.28px] text-[#c8a064]" onClick={closeDialog}>Volver al formulario</button></div></div></div>;

  return dialogHost ? createPortal(node, dialogHost) : node;
}
