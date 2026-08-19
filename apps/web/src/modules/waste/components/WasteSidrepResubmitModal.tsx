import { WasteSidrepSendIcon } from '../icons/WasteSidrepDocumentsIcons';
import { WasteConfirmModal, WasteConfirmModalCancelButton } from './WasteConfirmModal';

/** Rótulo compartido por el pie `4278:20293` y el primario del modal `4278:20648`. */
export const SIDREP_RESUBMIT_LABEL = 'Reenviar solicitud';

interface WasteSidrepResubmitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Confirmación del reenvío SIDREP — nodo Figma `4278:20635`.
 *
 * Reutiliza el armazón accesible de `WasteConfirmModal`: velo centrado, cierre con
 * Escape, foco dentro del diálogo y tarjeta de 440px que se adapta en pantallas
 * angostas. Este nodo conserva su botón dorado y el avión SVG exacto del flujo SIDREP.
 */
export function WasteSidrepResubmitModal({
  open,
  onClose,
  onConfirm,
}: WasteSidrepResubmitModalProps) {
  return (
    <WasteConfirmModal
      open={open}
      title={SIDREP_RESUBMIT_LABEL}
      description="Haz realizado las correcciones del formulario."
      onClose={onClose}
      onSubmit={onConfirm}
      actions={
        <>
          <WasteConfirmModalCancelButton label="Cancelar" onClick={onClose} />
          <button
            type="submit"
            className="flex h-[34px] shrink-0 items-center gap-[6px] rounded-[8px] bg-[#c8a064] px-[22px] transition-colors hover:bg-[#bb9057]"
          >
            <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-white">
              {SIDREP_RESUBMIT_LABEL}
            </span>
            <WasteSidrepSendIcon className="block h-[12px] w-[15px] shrink-0 text-white" />
          </button>
        </>
      }
    >
      <p className="w-full pt-[16.5px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[16.5px] text-[#646464]">
        ¿Deseas continuar?
      </p>
    </WasteConfirmModal>
  );
}
