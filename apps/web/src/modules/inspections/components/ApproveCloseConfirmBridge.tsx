import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SnackbarCheckIcon } from '../../../shared/components/icons/SnackbarCheckIcon';
import { InspectionCloseIcon, InspectionInfoIcon } from '../icons/InspectionsIcons';

const APPROVE_CLOSE_MESSAGE = '¿Aprobar cierre de esta observación?';

function renderScoped(node: ReactNode, host: HTMLElement | null) {
  return host ? createPortal(node, host) : node;
}

export function ApproveCloseConfirmBridge() {
  const approveButtonRef = useRef<HTMLButtonElement | null>(null);
  const bypassRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const [dialogHost, setDialogHost] = useState<HTMLElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const originalConfirm = window.confirm;

    window.confirm = (message?: string) => {
      if (message === APPROVE_CLOSE_MESSAGE && bypassRef.current) return true;
      if (message === APPROVE_CLOSE_MESSAGE) return false;
      return originalConfirm.call(window, message);
    };

    function captureApproveClick(event: MouseEvent) {
      if (bypassRef.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button');
      if (!(button instanceof HTMLButtonElement)) return;
      if (button.dataset.approveCloseConfirm === 'true') return;
      if (!button.textContent?.includes('Aprobar cierre')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      approveButtonRef.current = button;
      setDialogHost(button.closest<HTMLElement>('section[role="dialog"]'));
      setToastVisible(false);
      setDialogOpen(true);
    }

    document.addEventListener('click', captureApproveClick, true);

    return () => {
      window.confirm = originalConfirm;
      document.removeEventListener('click', captureApproveClick, true);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  function closeDialog() {
    setDialogOpen(false);
    approveButtonRef.current = null;
    if (!toastVisible) setDialogHost(null);
  }

  function hideToast() {
    setToastVisible(false);
    setDialogHost(null);
  }

  function approveClose() {
    const button = approveButtonRef.current;
    setDialogOpen(false);
    if (!button) return;
    bypassRef.current = true;
    button.click();
    window.setTimeout(() => {
      bypassRef.current = false;
      approveButtonRef.current = null;
      setToastVisible(true);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(hideToast, 3200);
    }, 0);
  }

  const dialogNode = dialogOpen ? <div className={`${dialogHost ? 'absolute' : 'fixed'} inset-0 z-[10000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] px-[16px]`} role="presentation"><div className="w-[328px] max-w-full rounded-[16px] bg-white p-[16px] shadow-[0_4px_14px_rgba(19,19,19,0.24)]" role="dialog" aria-modal="true" aria-labelledby="approve-close-title"><div className="flex items-center justify-between"><div className="text-[#24588b]"><InspectionInfoIcon /></div><button type="button" className="flex size-[32px] items-center justify-center text-[#131313]" onClick={closeDialog} aria-label="Cerrar aprobación"><InspectionCloseIcon /></button></div><div className="mt-[32px] flex flex-col gap-[8px]"><p id="approve-close-title" className="text-[18px] font-bold leading-[22px] tracking-[0.36px] text-[#2a2a2a]">Aprobar cierre de observación</p><p className="text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">La observación en cuestión será cerrada. Esta podrá ser revisada en la sección de observaciones cerradas. ¿Desea aprobar el cierre?</p></div><div className="mt-[32px] flex flex-col gap-[12px]"><button type="button" data-approve-close-confirm="true" className="flex h-[40px] w-full items-center justify-center rounded-[8px] bg-[#c8a064] px-[16px] py-[8px] text-[14px] font-bold tracking-[0.28px] text-white" onClick={approveClose}>Aprobar cierre</button><button type="button" className="flex h-[40px] w-full items-center justify-center rounded-[8px] border border-[#c8a064] bg-white px-[16px] py-[8px] text-[14px] font-bold tracking-[0.28px] text-[#c8a064]" onClick={closeDialog}>Cancelar</button></div></div></div> : null;
  const toastNode = toastVisible ? <div className={`${dialogHost ? 'absolute' : 'fixed'} bottom-[92px] left-1/2 z-[10001] flex -translate-x-1/2 items-center gap-[8px] rounded-[8px] bg-[#54a036] p-[12px] text-white shadow-[0_4px_14px_rgba(19,19,19,0.18)]`} role="status" aria-live="polite"><span className="flex size-[24px] shrink-0 items-center justify-center"><SnackbarCheckIcon className="block size-[20px] shrink-0" /></span><p className="whitespace-nowrap text-[14px] font-bold leading-[22.7px] tracking-[0.28px]">Observación aprobada</p><button type="button" className="flex size-[16px] items-center justify-center" onClick={hideToast} aria-label="Ocultar confirmación"><InspectionCloseIcon /></button></div> : null;

  return <>{renderScoped(dialogNode, dialogHost)}{renderScoped(toastNode, dialogHost)}</>;
}
