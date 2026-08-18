import { useEffect, useState } from 'react';
import { WASTE_SIDREP_REJECT_MODAL } from '../wasteSidrepPendingFolios';
import {
  WasteConfirmModal,
  WasteConfirmModalCancelButton,
  WasteConfirmModalDangerButton,
  WasteConfirmModalTextArea,
} from './WasteConfirmModal';

/**
 * Modal "Rechazar solicitud" — nodo Figma `4295:24214`. Lo abre el botón `3073:6084`, el
 * "Rechazar" del pie del panel de "Pendientes de revisión".
 *
 * EL ARMAZÓN VIVE EN `WasteConfirmModal`: ahí está la geometría de la tarjeta, por qué no
 * es una variante de `WasteFormModal` y la anotación de que esta misma pantalla ya existe
 * en el módulo SPR. Acá queda sólo lo que este diálogo decide.
 *
 * EL NODO NO NOMBRA LA SOLICITUD QUE SE ESTÁ RECHAZANDO —ni en el título, ni en una
 * bajada, ni en el campo—, y se reproduce así. La tarjeta se abre encima del panel de
 * detalle, que sí tiene el `#SR-…`, el residuo y el transportista a la vista detrás del
 * velo; y el modal se abre con la solicitud del panel, así que agregarle un subtítulo
 * habría sido inventar contenido para resolver un problema que el emplazamiento no tiene.
 * Queda anotado como lo primero a pedirle al diseño si el diálogo alguna vez se abre desde
 * otro lado.
 *
 * SIN `onConfirm` EL PRIMARIO QUEDA DESHABILITADO, mismo criterio que `WasteFolioCloseModal`
 * y `WasteFolioSupportModal`: rechazar una solicitud le devuelve el trabajo a otra persona,
 * así que un botón que dice "Enviar rechazo" y no envía nada es peor que uno apagado.
 */

interface WasteFolioRejectModalProps {
  open: boolean;
  onClose: () => void;
  /** Envía el rechazo con el motivo ya sin espacios en los extremos. */
  onConfirm?: (reason: string) => void;
}

export function WasteFolioRejectModal({ open, onClose, onConfirm }: WasteFolioRejectModalProps) {
  const [reason, setReason] = useState('');

  /*
   * Cada apertura arranca en blanco, el mismo criterio que el resto de los modales del
   * módulo: un diálogo que recuerda lo tipeado la vez anterior invita a enviar el motivo
   * de OTRA solicitud sin releerlo.
   */
  useEffect(() => {
    if (!open) return undefined;

    setReason('');
    return undefined;
  }, [open]);

  const trimmedReason = reason.trim();
  const canConfirm = trimmedReason.length > 0 && onConfirm !== undefined;

  function handleSubmit() {
    if (!canConfirm) return;
    onConfirm?.(trimmedReason);
  }

  return (
    <WasteConfirmModal
      open={open}
      title={WASTE_SIDREP_REJECT_MODAL.title}
      description={WASTE_SIDREP_REJECT_MODAL.description}
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <WasteConfirmModalCancelButton
            label={WASTE_SIDREP_REJECT_MODAL.cancelLabel}
            onClick={onClose}
          />
          <WasteConfirmModalDangerButton
            label={WASTE_SIDREP_REJECT_MODAL.submitLabel}
            disabled={!canConfirm}
          />
        </>
      }
    >
      <WasteConfirmModalTextArea
        label={WASTE_SIDREP_REJECT_MODAL.reasonLabel}
        value={reason}
        onChange={setReason}
        placeholder={WASTE_SIDREP_REJECT_MODAL.reasonPlaceholder}
      />
    </WasteConfirmModal>
  );
}
