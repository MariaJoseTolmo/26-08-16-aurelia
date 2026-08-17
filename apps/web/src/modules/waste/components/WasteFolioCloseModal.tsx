import { useEffect, useRef, useState } from 'react';
import { WarehouseFormLotIcon } from '../icons/WarehouseIntakeFormIcons';
import { WasteFolioFooterActionButton } from './WasteFolioFooterActionButton';
import { WasteSidrepFileDropzone } from './WasteSidrepFileDropzone';
import {
  WasteFormModal,
  WasteFormModalCancelButton,
  WasteFormModalDateInput,
  WasteFormModalField,
  WasteFormModalNotice,
  WASTE_FORM_MODAL_INPUT_CLASS,
} from './WasteFormModal';

/**
 * Modal "Registrar cierre de folio" — nodo `4230:13273`.
 *
 * Lo abre "Registrar cierre" (`3081:7977`), el pie del panel de detalle de un folio SIDREP
 * ABIERTO, y sólo cuando el residuo es PELIGROSO: un traslado no peligroso no genera
 * declaración SIDREP, que es el documento sobre el que se apoya todo este formulario.
 * Ver `WasteSidrepFoliosPage`.
 *
 * ES EL PASO QUE CIERRA EL TRASLADO. Un folio abierto es un residuo que salió de faena y
 * cuya recepción en destino todavía no está confirmada; este formulario registra la
 * confirmación: cuándo se dispuso finalmente, con qué declaración SIDREP, con qué ticket
 * de recepción y con cuántos kilos llegaron.
 *
 * EL FORMULARIO ES PROGRESIVO Y ESO ES LO QUE EL NODO DIBUJA. El ticket de recepción y los
 * kg recibidos NO son campos todavía: son dos cajas grises que dicen "Se requiere
 * declaración SIDREP" (`4230:13440` y `4230:13443`). Los dos datos salen del documento, así
 * que pedirlos antes de tenerlo invita a escribirlos de memoria. Con el PDF cargado pasan a
 * ser campos, y su forma es la MISMA del selector de fecha de este mismo nodo —rótulo Inter
 * Semi Bold 11.5px sobre una caja de 36px— así que el estado desbloqueado no inventa
 * vocabulario: reusa el que el nodo ya trae. El nodo no lo dibuja, y queda dicho.
 *
 * "CONFIRMAR CIERRE" ENTRA DESHABILITADO, y esta vez no es una desviación: el nodo
 * `4230:13314` lo pinta `#e2e2e2` con el texto en `#acacac`, que es lo correcto con el
 * formulario recién abierto. Se habilita cuando están los cuatro datos Y hay a quién
 * confirmarle —ver `onConfirm`—.
 *
 * Geometría del design context (el armazón, en `WasteFormModal`):
 *
 *   cuerpo     px-[22px] py-[20px] · gap-[16px] · tarjeta de 520
 *   aviso      bg #e6f3ff · border #c5d8f0 · rounded-[8px] · px-[15px] py-[12px]
 *              gap-[10px] · glifo 11.5 × 11.5 · texto 11.5px / 17.25px · #0d3862
 *   fecha      rótulo Inter Semi Bold 11.5px #333 · gap-[5px]
 *              caja h-[36px] · rounded-[7px] · border #d1d1d1 · texto 12.5px #131313
 *              calendario 18 × 18 a 6px del borde derecho
 *   grupo      gap-[8px]
 *   dropzone   border-[1.5px] DASHED #d1d1d1 · rounded-[9px] · px-[17.5px] py-[15.5px]
 *              gap-[12px] · caja de icono 34 × 34 · glifo nube 17.5 × 14
 *              rótulo Inter Semi Bold 10px #646464 · ayuda Inter Regular 9.5px #acacac
 *              → `WasteSidrepFileDropzone` en variante `row`, sin un solo cambio
 *   bloqueados fila gap-[14px] · dos cajas al 50%
 *              bg #f7f7f7 · border #e3e3e3 · rounded-[8px] · px-[17px] py-[17.5px]
 *              rótulo Inter Semi Bold 11.5px #646464 · mensaje Inter Regular 10.5px, a la
 *              derecha, mismo color
 *   pie        "Cancelar" + "Confirmar cierre" con su glifo de 15 × 12
 *
 * LOS ANCHOS DE TEXTO DE LAS CAJAS BLOQUEADAS NO SE REPRODUCEN. El nodo mide el rótulo en
 * 87 y 75 y el mensaje en 110 y 99: son anchos MEDIDOS de texto que hugea, no cajas del
 * diseño —de hecho el mismo mensaje mide distinto en las dos cajas—. Van los dos textos al
 * tamaño de su contenido con `justify-between`, que es lo que el nodo hace, y cada uno se
 * parte en dos líneas como ahí; el alto de 63px se conserva.
 */

/** Texto del nodo `4230:13277`. */
export const WASTE_FOLIO_CLOSE_TITLE = 'Registrar cierre de folio';

/**
 * Aviso azul del nodo `4230:13287`.
 *
 * OJO: el NOMBRE DE CAPA de este nodo está obsoleto —dice "Registra estos datos una vez
 * que confirmes que el…"— y el texto real es el de abajo. Manda el design context.
 */
export const WASTE_FOLIO_CLOSE_NOTICE =
  'Llena los siguientes campos una vez que confirmes que el destinatario cerró el SIDREP en la plataforma oficial y te haya hecho llegar el certificado de disposición final.';

/** Rótulos de los nodos `4230:13291`, `4230:13434`, `4230:13439` y `4230:13442`. */
export const WASTE_FOLIO_CLOSE_DATE_LABEL = 'Fecha de disposición final';
export const WASTE_FOLIO_CLOSE_DECLARATION_LABEL = 'Declaración SIDREP';
export const WASTE_FOLIO_CLOSE_TICKET_LABEL = 'Nº de ticket de recepción';
export const WASTE_FOLIO_CLOSE_RECEIVED_LABEL = 'Kg recibidos en destino';

/**
 * Ayuda de la dropzone — nodo `4230:13435`.
 *
 * Se reproduce TAL CUAL, con el punto pegado a "Pdf" y sin espacio antes del separador:
 * es el texto del diseño y corregirlo acá lo dejaría distinto del resto de las dropzonas
 * del flujo SIDREP, que lo escriben igual.
 */
export const WASTE_FOLIO_CLOSE_DECLARATION_HINT = 'Pdf· Máx. 10 MB';

/** Mensaje de las dos cajas bloqueadas — nodos `4230:13440` y `4230:13443`. */
export const WASTE_FOLIO_CLOSE_LOCKED_HINT = 'Se requiere declaración SIDREP';

/** Rótulo del primario del pie — nodo `4230:13317`. */
export const WASTE_FOLIO_CLOSE_CONFIRM = 'Confirmar cierre';

/**
 * Tope de la declaración, el mismo que anuncia la ayuda de la dropzone.
 *
 * Se valida en el cliente porque es el único lugar donde se puede validar hoy: sin
 * endpoint, un PDF de 40 MB se aceptaría en silencio y el error aparecería recién el día
 * que exista el envío.
 */
const DECLARATION_MAX_BYTES = 10 * 1024 * 1024;

const DECLARATION_TOO_LARGE = 'La declaración SIDREP supera los 10 MB.';

export interface WasteFolioCloseSubmit {
  /** Fecha de disposición final en ISO `yyyy-mm-dd`, tal como la entrega el `<input type="date">`. */
  disposedOn: string;
  /** PDF de la declaración SIDREP cerrada en la plataforma del Ministerio. */
  declaration: File;
  /** N° de ticket de recepción en destino, ya sin espacios en los extremos. */
  receptionTicket: string;
  /** Kg recibidos en destino, tal como se tipearon. */
  receivedKg: string;
}

interface WasteFolioCloseModalProps {
  open: boolean;
  /** "Folio SIDREP 2026-SD-04812 · Baterías de plomo-ácido · Resiter S.A." Nodo `4230:13279`. */
  subtitle: string;
  onClose: () => void;
  /**
   * Registra el cierre del folio. SIN ESTO EL PRIMARIO QUEDA DESHABILITADO en vez de
   * simular el registro: cerrar un folio SIDREP es un acto de fiscalización, y un botón
   * que dice "Confirmar cierre" y no confirma nada es peor que uno visiblemente apagado.
   * Es el mismo criterio que `onDownload` en `WasteFolioSupportModal`.
   */
  onConfirm?: (input: WasteFolioCloseSubmit) => void;
  /** Bloquea el pie mientras la API responde. */
  isSubmitting?: boolean;
  /** Mensaje del último intento fallido. */
  errorMessage?: string | null;
  /** Explicación del bloqueo cuando no hay `onConfirm`, como `title` del botón. */
  disabledHint?: string;
}

export function WasteFolioCloseModal({
  open,
  subtitle,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
  disabledHint,
}: WasteFolioCloseModalProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [disposedOn, setDisposedOn] = useState('');
  const [declaration, setDeclaration] = useState<File | null>(null);
  const [receptionTicket, setReceptionTicket] = useState('');
  const [receivedKg, setReceivedKg] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  /*
   * Cada apertura arranca en blanco, el mismo criterio que `WasteSinaderDeclareModal`: un
   * modal que recuerda lo tipeado la vez anterior invita a confirmar datos de OTRO folio
   * sin releerlos, y acá esos datos cierran un traslado.
   *
   * LA FECHA ARRANCA VACÍA aunque el nodo `4230:13293` dibuje "17/07/2026". Ese valor es
   * la muestra del diseño, no un default: la fecha de disposición final es la del
   * certificado que emite el destinatario, no la de hoy, así que prellenarla dejaría una
   * fecha que nadie verificó dentro de un registro de fiscalización.
   */
  useEffect(() => {
    if (!open) return undefined;

    setDisposedOn('');
    setDeclaration(null);
    setReceptionTicket('');
    setReceivedKg('');
    setFileError(null);
    dateRef.current?.focus();
    return undefined;
  }, [open]);

  function handleDeclarationChange(file: File | null) {
    if (file && file.size > DECLARATION_MAX_BYTES) {
      setFileError(DECLARATION_TOO_LARGE);
      return;
    }

    setFileError(null);
    setDeclaration(file);
    /*
     * Quitar el documento vuelve a bloquear los dos campos, así que lo que se haya
     * tipeado se descarta: si el respaldo se fue, el ticket y los kilos que salían de él
     * dejan de tener de dónde venir.
     */
    if (!file) {
      setReceptionTicket('');
      setReceivedKg('');
    }
  }

  const trimmedTicket = receptionTicket.trim();
  const trimmedReceivedKg = receivedKg.trim();
  const isComplete =
    disposedOn.length > 0 &&
    declaration !== null &&
    trimmedTicket.length > 0 &&
    trimmedReceivedKg.length > 0;
  const canConfirm = Boolean(onConfirm) && isComplete && !isSubmitting;

  function handleSubmit() {
    if (!onConfirm || !canConfirm || !declaration) return;

    onConfirm({
      disposedOn,
      declaration,
      receptionTicket: trimmedTicket,
      receivedKg: trimmedReceivedKg,
    });
  }

  return (
    <WasteFormModal
      open={open}
      width="lg"
      title={WASTE_FOLIO_CLOSE_TITLE}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      initialFocusRef={dateRef}
      actions={
        <>
          <WasteFormModalCancelButton onClick={onClose} />
          <WasteFolioFooterActionButton
            label={isSubmitting ? 'Confirmando…' : WASTE_FOLIO_CLOSE_CONFIRM}
            type="submit"
            fullWidth={false}
            icon={(className) => <WarehouseFormLotIcon className={className} />}
            disabled={!canConfirm}
            disabledHint={onConfirm ? undefined : disabledHint}
          />
        </>
      }
    >
      <WasteFormModalNotice>{WASTE_FOLIO_CLOSE_NOTICE}</WasteFormModalNotice>

      <WasteFormModalField label={WASTE_FOLIO_CLOSE_DATE_LABEL}>
        {(fieldId) => (
          <WasteFormModalDateInput
            id={fieldId}
            value={disposedOn}
            onChange={setDisposedOn}
            inputRef={dateRef}
          />
        )}
      </WasteFormModalField>

      {/* Grupo `4230:13428`: el documento y los dos datos que dependen de él. */}
      <div className="flex w-full flex-col items-start gap-[8px]">
        <WasteSidrepFileDropzone
          label={WASTE_FOLIO_CLOSE_DECLARATION_LABEL}
          hint={WASTE_FOLIO_CLOSE_DECLARATION_HINT}
          accept="application/pdf"
          file={declaration}
          onChange={handleDeclarationChange}
          confirmed={declaration !== null}
        />

        {fileError ? (
          <p
            role="alert"
            className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
          >
            {fileError}
          </p>
        ) : null}

        {/* Fila `4230:13437`: las dos mitades, bloqueadas o no según el documento. */}
        <div className="flex w-full items-start gap-[14px]">
          {declaration ? (
            <>
              <WasteFormModalField label={WASTE_FOLIO_CLOSE_TICKET_LABEL}>
                {(fieldId) => (
                  <input
                    id={fieldId}
                    value={receptionTicket}
                    onChange={(event) => setReceptionTicket(event.target.value)}
                    type="text"
                    autoComplete="off"
                    className={WASTE_FORM_MODAL_INPUT_CLASS}
                  />
                )}
              </WasteFormModalField>
              <WasteFormModalField label={WASTE_FOLIO_CLOSE_RECEIVED_LABEL}>
                {(fieldId) => (
                  <input
                    id={fieldId}
                    value={receivedKg}
                    onChange={(event) => setReceivedKg(event.target.value)}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className={WASTE_FORM_MODAL_INPUT_CLASS}
                  />
                )}
              </WasteFormModalField>
            </>
          ) : (
            <>
              <WasteFolioCloseLockedField label={WASTE_FOLIO_CLOSE_TICKET_LABEL} />
              <WasteFolioCloseLockedField label={WASTE_FOLIO_CLOSE_RECEIVED_LABEL} />
            </>
          )}
        </div>
      </div>

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

/**
 * Una de las dos cajas grises de los nodos `4230:13438` y `4230:13441`: el dato que
 * todavía no se puede pedir, con el motivo escrito al lado.
 *
 * NO es un `<input disabled>` y es a propósito: no hay nada que escribir ahí todavía, así
 * que un campo apagado se leería como "esto se llena después" en vez de "esto necesita el
 * documento". El rótulo va como `<p>` y no como `<label>` porque no hay control que
 * rotular.
 */
function WasteFolioCloseLockedField({ label }: { label: string }) {
  return (
    <div className="flex min-w-px flex-1 items-center justify-between gap-[8px] rounded-[8px] border border-solid border-[#e3e3e3] bg-[#f7f7f7] px-[17px] py-[17.5px]">
      <p className="font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold not-italic leading-[normal] text-[#646464]">
        {label}
      </p>
      <p className="text-right font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
        {WASTE_FOLIO_CLOSE_LOCKED_HINT}
      </p>
    </div>
  );
}
