import { useEffect, useRef, useState } from 'react';
import { WasteSinaderMarkDeclaredIcon } from '../icons/WasteSinaderReportIcons';
import { WasteFolioFooterActionButton } from './WasteFolioFooterActionButton';
import {
  WasteFormModal,
  WasteFormModalCancelButton,
  WasteFormModalDateInput,
  WasteFormModalField,
  WasteFormModalNotice,
  WASTE_FORM_MODAL_INPUT_CLASS,
} from './WasteFormModal';

/**
 * Modal "Marcar período como declarado" — nodo Figma `4319:34781`, emplazado en
 * `4319:34428`. Lo abre el botón `3830:65730` del pie de "Reporte SINADER".
 *
 * EL ARMAZÓN VIVE EN `WasteFormModal` y no acá: el nodo `4230:13273` ("Registrar
 * cierre de folio") dibuja la MISMA tarjeta —velo, radio, sombra, cabecera, padding
 * del cuerpo, pie y los dos botones del pie coinciden píxel a píxel— con otro ancho.
 * Ahí está la geometría documentada, incluidos los 480px de esta tarjeta y las dos
 * medidas que esta versión corrige respecto de la anterior (la "X" de cierre va
 * centrada en su caja y el glifo del aviso azul arranca en el tope del texto).
 *
 * Los 436px de los campos NO se fijan: son 480 menos los `px-[22px]` de la tarjeta,
 * así que `w-full` los reproduce y además acompaña al ancho.
 *
 * EL BOTÓN PRIMARIO ESTÁ DESHABILITADO EN EL NODO, que es lo correcto con el
 * formulario vacío. Acá se habilita cuando hay folio Y fecha: son los dos datos
 * que el modal existe para pedir, y confirmar sin ellos cerraría el período sin la
 * referencia de la declaración.
 */

/** Texto del nodo `4319:34785`. */
export const WASTE_SINADER_DECLARE_TITLE = 'Marcar período como declarado';

export interface WasteSinaderDeclareSubmit {
  /** N° de folio SINADER, ya sin espacios en los extremos. */
  folio: string;
  /** Fecha de declaración en ISO `yyyy-mm-dd`, tal como la entrega `<input type="date">`. */
  declaredOn: string;
}

interface WasteSinaderDeclareModalProps {
  open: boolean;
  /** Subtítulo de la cabecera: "Reporte SINADER — Julio 2026". */
  periodLabel: string;
  /** Cifra del resumen, ya formateada con su unidad: "3.270 kg". */
  totalQuantity: string;
  movementCount: number;
  onClose: () => void;
  onConfirm: (input: WasteSinaderDeclareSubmit) => void;
  /** Bloquea el pie mientras la API responde. */
  isSubmitting?: boolean;
  /** Mensaje de la última confirmación fallida. */
  errorMessage?: string | null;
}

export function WasteSinaderDeclareModal({
  open,
  periodLabel,
  totalQuantity,
  movementCount,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
}: WasteSinaderDeclareModalProps) {
  const folioRef = useRef<HTMLInputElement>(null);
  const [folio, setFolio] = useState('');
  const [declaredOn, setDeclaredOn] = useState('');

  /*
   * Cada apertura arranca en blanco y con el foco en el folio, el mismo criterio
   * que `WasteRcaThresholdsModal`: un modal que recuerda lo tipeado la vez
   * anterior invita a confirmar un dato viejo sin releerlo, y acá ese dato cierra
   * un período.
   *
   * El foco lo pone el armazón con `initialFocusRef`.
   */
  useEffect(() => {
    if (!open) return undefined;

    setFolio('');
    setDeclaredOn('');
    return undefined;
  }, [open]);

  const trimmedFolio = folio.trim();
  const canConfirm = trimmedFolio.length > 0 && declaredOn.length > 0 && !isSubmitting;

  function handleSubmit() {
    if (!canConfirm) return;
    onConfirm({ folio: trimmedFolio, declaredOn });
  }

  return (
    <WasteFormModal
      open={open}
      title={WASTE_SINADER_DECLARE_TITLE}
      subtitle={periodLabel}
      onClose={onClose}
      onSubmit={handleSubmit}
      initialFocusRef={folioRef}
      actions={
        <>
          <WasteFormModalCancelButton onClick={onClose} />
          <WasteFolioFooterActionButton
            label={isSubmitting ? 'Confirmando…' : 'Confirmar declaración'}
            type="submit"
            fullWidth={false}
            icon={(className) => <WasteSinaderMarkDeclaredIcon className={className} />}
            disabled={!canConfirm}
          />
        </>
      }
    >
      {/* Aviso `4319:34792`. */}
      <WasteFormModalNotice>
        Ingresa el N° de folio SINADER una vez que hayas completado la declaración en la Ventanilla
        Única del RETC. Esto cerrará el período y no admitirá más movimientos.
      </WasteFormModalNotice>

      {/* Resumen `4319:34796`: lo que se está por declarar, para releerlo antes de confirmar. */}
      <div className="flex w-full items-center justify-between rounded-[8px] border border-solid border-[#e3e3e3] bg-[#f7f7f7] px-[15px] py-[13px]">
        <div className="flex flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold not-italic leading-[normal] text-[#646464]">
            Total declarado
          </p>
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[normal] text-[#131313]">
            {totalQuantity}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="whitespace-nowrap text-right font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold not-italic leading-[normal] text-[#646464]">
            Movimientos incluidos
          </p>
          <p className="whitespace-nowrap text-right font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[normal] text-[#131313]">
            {movementCount}
          </p>
        </div>
      </div>

      <WasteFormModalField label="N° de Folio SINADER">
        {(fieldId) => (
          <input
            ref={folioRef}
            id={fieldId}
            value={folio}
            onChange={(event) => setFolio(event.target.value)}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej. 1227458"
            className={WASTE_FORM_MODAL_INPUT_CLASS}
          />
        )}
      </WasteFormModalField>

      <WasteFormModalField label="Fecha de declaración">
        {(fieldId) => (
          <WasteFormModalDateInput id={fieldId} value={declaredOn} onChange={setDeclaredOn} />
        )}
      </WasteFormModalField>

      {errorMessage ? (
        <p
          role="alert"
          className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
        >
          {errorMessage}
        </p>
      ) : null}
    </WasteFormModal>
  );
}
