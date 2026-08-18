import { useEffect, useRef, useState } from 'react';
import { WarehouseFormLotIcon } from '../icons/WarehouseIntakeFormIcons';
import type { WasteSidrepOpenFolioDeclarationReading } from '../wasteSidrepOpenFolios';
import { WasteDerivedValueField } from './WasteDerivedValueField';
import { WasteFolioFooterActionButton } from './WasteFolioFooterActionButton';
import { WasteSidrepFileDropzone } from './WasteSidrepFileDropzone';
import { WasteWeightDifferenceNotice } from './WasteWeightDifferenceNotice';
import {
  WasteFormModal,
  WasteFormModalCancelButton,
  WasteFormModalDateInput,
  WasteFormModalField,
  WasteFormModalNotice,
} from './WasteFormModal';

/**
 * Modal "Registrar cierre de folio" — TRES NODOS, un solo formulario en dos variantes:
 *
 *   `4230:13273`  peligroso     vacío     520 × 479
 *   `4230:13614`  peligroso     completo  520 × 587
 *   `4230:14038`  no peligroso  vacío     520 × 479
 *
 * Lo abre "Registrar cierre" (`3081:7977`), el pie del panel de detalle de un folio SIDREP
 * ABIERTO, y lo abre SIEMPRE. La peligrosidad NO decide si el folio se cierra con este
 * formulario, decide QUÉ DOCUMENTO lo respalda: el `4230:14038` es el mismo formulario
 * pidiendo el ticket de recepción final en vez de la declaración SIDREP. Ver
 * `WASTE_FOLIO_CLOSE_DOCUMENT_LABELS` y `WasteSidrepFoliosPage`.
 *
 * LAS DOS VARIANTES DIFIEREN EN EXACTAMENTE UNA COSA, el rótulo de la dropzone. Medido nodo a
 * nodo contra el `4230:13273` —cabecera, aviso azul, fecha, grupo del documento, las dos
 * cajas derivadas y el pie— el `4230:14038` no cambia UN valor: mismo ancho 520, mismos
 * `px-[22px] py-[20px]`, mismo `gap-[16px]`, mismas cajas `#f7f7f7`/`#e3e3e3` de
 * `px-[17px] py-[17.5px]`, mismo primario `#e2e2e2` de `149.641 × 34.5`. Por eso la variante
 * es una prop y no un segundo componente.
 *
 * EL "SE REQUIERE DECLARACIÓN SIDREP" DE LAS DOS CAJAS NO ES UN RESTO DE LA COPIA: el nodo no
 * peligroso lo escribe igual (`4230:14073` y `4230:14076`), y cierra con su propio aviso azul,
 * que en las dos variantes habla de que "el destinatario cerró el SIDREP en la plataforma
 * oficial". El ticket y los kilos salen de ESA declaración; lo que cambia es el documento que
 * el aprobador adjunta para transcribirla.
 *
 * ES EL PASO QUE CIERRA EL TRASLADO. Un folio abierto es un residuo que salió de faena y
 * cuya recepción en destino todavía no está confirmada; este formulario registra la
 * confirmación: cuándo se dispuso finalmente y con qué declaración SIDREP.
 *
 * EL TICKET Y LOS KILOS NO SE TIPEAN: LOS TRANSCRIBE EL DOCUMENTO. Es lo que dicen los dos
 * nodos leídos juntos. El vacío los dibuja como dos cajas grises con el motivo escrito al
 * lado —"Se requiere declaración SIDREP"— y el completo los muestra ya escritos en azul, en
 * Inter Bold 19px, sin ningún control de edición. Los dos datos salen de la declaración,
 * exactamente igual que los tres pesos de "Peso del residuo" salen del ticket de pesaje;
 * pedirlos a mano habría sido invitar a transcribir de memoria un informe reglamentario. Las
 * dos cajas son `WasteDerivedValueField`, el mismo campo de aquella tarjeta.
 *
 * EL RECUADRO DE DIFERENCIA DE PESO APARECE CON LA LECTURA, no antes: sin peso recibido no
 * hay brecha que medir. Es `WasteWeightDifferenceNotice` —nodo `4230:13658`, idéntico al
 * `3437:3362` del panel de detalle— y viene en DOS TONOS según la tolerancia: ámbar fuera
 * (`3524:544`) y verde dentro (`3524:560`).
 *
 * SE MUESTRA EN LOS DOS CASOS, y ahí este modal se separa del panel de detalle, que sólo
 * dibuja el recuadro cuando la brecha se pasa. Acá no es una alerta, es el número que se
 * está por registrar: el modal no tiene grilla donde leerlo —el panel lo trae en
 * `folioFacts`—, así que esconderlo en el caso conforme dejaba confirmar un cierre sin
 * haber visto nunca la diferencia. El tono es el que dice si hay que reclamarla.
 *
 * "CONFIRMAR CIERRE" ENTRA DESHABILITADO, y no es una desviación: el nodo `4230:13314` lo
 * pinta `#e2e2e2` con el texto en `#acacac`, que es lo correcto con el formulario recién
 * abierto, y el `4230:13676` lo pinta `#c8a064` con el formulario completo. Se habilita
 * cuando hay fecha Y declaración leída, y hay a quién confirmarle —ver `onConfirm`—.
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
 *   dropzone   vacía    border-[1.5px] DASHED #d1d1d1 · bg white · glifo nube 17.5 × 14
 *              cargada  border-[1.5px] SÓLIDO #a8dfa8 · bg #e0ffd3 · glifo check
 *                       segunda línea = nombre del archivo, 10.5px #2a5c16
 *                       botón de quitar 24 × 24 · rounded-[5px] · X de 16 × 16
 *              rounded-[9px] · px-[17.5px] py-[15.5px] · gap-[12px] · caja de icono 34 × 34
 *              → `WasteSidrepFileDropzone` en variante `row`, sin un solo cambio
 *   derivados  fila gap-[14px] · dos cajas al 50% · → `WasteDerivedValueField`
 *   brecha     bg #fff0e6 · border #f5c4a0 · rounded-[8px] · px-[17px] py-[13px]
 *   pie        "Cancelar" + "Confirmar cierre" con su glifo de 15 × 12
 */

/** Texto de los nodos `4230:13277` y `4230:13618`. */
export const WASTE_FOLIO_CLOSE_TITLE = 'Registrar cierre de folio';

/**
 * Aviso azul de los nodos `4230:13287` y `4230:13628`.
 *
 * OJO: el NOMBRE DE CAPA de los dos está obsoleto —dice "Registra estos datos una vez que
 * confirmes que el…"— y el texto real es el de abajo. Manda el design context.
 */
export const WASTE_FOLIO_CLOSE_NOTICE =
  'Llena los siguientes campos una vez que confirmes que el destinatario cerró el SIDREP en la plataforma oficial y te haya hecho llegar el certificado de disposición final.';

/** Rótulos de los nodos `4230:13291`, `4230:13439` y `4230:13442`. */
export const WASTE_FOLIO_CLOSE_DATE_LABEL = 'Fecha de disposición final';
export const WASTE_FOLIO_CLOSE_TICKET_LABEL = 'Nº de ticket de recepción';
export const WASTE_FOLIO_CLOSE_RECEIVED_LABEL = 'Kg recibidos en destino';

/** Con qué documento se respalda el cierre, que es lo único que la peligrosidad cambia acá. */
export type WasteFolioCloseVariant = 'hazardous' | 'nonHazardous';

/**
 * Rótulo de la dropzone por variante — nodos `4230:13434` (peligroso) y `4230:14067` (no
 * peligroso).
 *
 * SON DOS `Record` Y NO CUATRO CONSTANTES SUELTAS —éste y `DOCUMENT_TOO_LARGE`— porque los
 * dos textos nombran el MISMO documento: con constantes sueltas se podía sumar una variante,
 * o cambiar un rótulo, y dejar el formulario pidiendo un archivo y rechazándolo por tamaño con
 * el nombre del otro. Indexados por la variante, el compilador exige el par completo.
 */
export const WASTE_FOLIO_CLOSE_DOCUMENT_LABELS: Record<WasteFolioCloseVariant, string> = {
  hazardous: 'Declaración SIDREP',
  nonHazardous: 'Ticket de recepción final',
};

/**
 * Ayuda de la dropzone vacía — nodos `4230:13435` y `4230:14068`, idénticos.
 *
 * Se reproduce TAL CUAL, con el punto pegado a "Pdf" y sin espacio antes del separador: es el
 * texto del diseño y corregirlo acá lo dejaría distinto del resto de las dropzonas del flujo
 * SIDREP, que lo escriben igual.
 */
export const WASTE_FOLIO_CLOSE_DECLARATION_HINT = 'Pdf· Máx. 10 MB';

/** Mensaje de las dos cajas sin lectura — nodos `4230:13440` y `4230:13443`. */
export const WASTE_FOLIO_CLOSE_PENDING_HINT = 'Se requiere declaración SIDREP';

/** Rótulo del primario del pie — nodos `4230:13317` y `4230:13679`. */
export const WASTE_FOLIO_CLOSE_CONFIRM = 'Confirmar cierre';

/**
 * Tope del documento, el mismo que anuncia la ayuda de la dropzone en las dos variantes.
 *
 * Se valida en el cliente porque es el único lugar donde se puede validar hoy: sin endpoint,
 * un PDF de 40 MB se aceptaría en silencio y el error aparecería recién el día que exista el
 * envío.
 */
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** El rechazo por tamaño nombra el documento que se pidió. Ver `WASTE_FOLIO_CLOSE_DOCUMENT_LABELS`. */
const DOCUMENT_TOO_LARGE: Record<WasteFolioCloseVariant, string> = {
  hazardous: 'La declaración SIDREP supera los 10 MB.',
  nonHazardous: 'El ticket de recepción final supera los 10 MB.',
};

export interface WasteFolioCloseSubmit {
  /** Fecha de disposición final en ISO `yyyy-mm-dd`, tal como la entrega el `<input type="date">`. */
  disposedOn: string;
  /**
   * El PDF que respalda el cierre: la declaración SIDREP cerrada en la plataforma del
   * Ministerio, o el ticket de recepción final si el traslado no es peligroso.
   */
  document: File;
  /** N° de ticket de recepción, tal como lo transcribió la declaración. */
  receptionTicket: string;
  /** Kg recibidos en destino, tal como los transcribió la declaración. */
  receivedKg: string;
}

interface WasteFolioCloseModalProps {
  open: boolean;
  /**
   * Con qué documento se cierra este folio. SIN DEFAULT: el peligroso era el único caso
   * integrado y por eso podía ser el implícito, pero ahora los dos folios llegan a este
   * formulario, y un default habría dejado un cierre no peligroso pidiendo la declaración
   * SIDREP con sólo olvidar la prop.
   */
  variant: WasteFolioCloseVariant;
  /** "Folio SIDREP 2026-SD-04812 · Baterías de plomo-ácido · Resiter S.A." Nodo `4230:13620`. */
  subtitle: string;
  /** Peso neto despachado, sólo el número: "610". Lo escribe el recuadro de la brecha. */
  dispatchedKg: string;
  /**
   * Lo que la declaración transcribe. Hoy es la maqueta del folio y se muestra en cuanto hay
   * archivo; cuando exista el parser esto pasa a ser la respuesta de la API y esta prop se
   * vuelve `| null` para cubrir el análisis en curso y el fallo de lectura, como ya hace
   * `WasteSidrepWeightSection`.
   */
  declarationReading: WasteSidrepOpenFolioDeclarationReading;
  onClose: () => void;
  /**
   * Registra el cierre del folio. SIN ESTO EL PRIMARIO QUEDA DESHABILITADO en vez de simular
   * el registro: cerrar un folio SIDREP es un acto de fiscalización, y un botón que dice
   * "Confirmar cierre" y no confirma nada es peor que uno visiblemente apagado. Es el mismo
   * criterio que `onDownload` en `WasteFolioSupportModal`.
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
  variant,
  subtitle,
  dispatchedKg,
  declarationReading,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
  disabledHint,
}: WasteFolioCloseModalProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [disposedOn, setDisposedOn] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  /*
   * Cada apertura arranca en blanco, el mismo criterio que `WasteSinaderDeclareModal`: un
   * modal que recuerda lo cargado la vez anterior invita a confirmar datos de OTRO folio sin
   * releerlos, y acá esos datos cierran un traslado.
   *
   * LA FECHA ARRANCA VACÍA aunque los dos nodos dibujen "17/07/2026". Ese valor es la muestra
   * del diseño, no un default: la fecha de disposición final es la del certificado que emite el
   * destinatario, no la de hoy, así que prellenarla dejaría una fecha que nadie verificó dentro
   * de un registro de fiscalización.
   */
  useEffect(() => {
    if (!open) return undefined;

    setDisposedOn('');
    setDocumentFile(null);
    setFileError(null);
    dateRef.current?.focus();
    return undefined;
  }, [open]);

  function handleDocumentChange(file: File | null) {
    if (file && file.size > DOCUMENT_MAX_BYTES) {
      setFileError(DOCUMENT_TOO_LARGE[variant]);
      return;
    }

    setFileError(null);
    setDocumentFile(file);
  }

  /*
   * La lectura depende del ARCHIVO, no de la fecha: es el documento el que la produce. El día
   * que exista el parser, acá va el resultado de la mutación y no la maqueta del folio.
   *
   * SE NORMALIZA A `null` EN UN SOLO LUGAR, y no es defensa de más. Los tres consumidores
   * —el verde de la dropzone, los dos campos y el recuadro de la brecha— tienen que estar de
   * acuerdo sobre si hay lectura o no; con la comprobación repetida en cada uno, una lectura
   * `undefined` daba `undefined !== null` y pintaba la dropzone en verde con los campos
   * todavía pendientes, un estado que el diseño no tiene. Además, cuando `declarationReading`
   * pase a ser `| null` para cubrir el análisis en curso, esta línea ya está bien.
   */
  const reading = documentFile && declarationReading ? declarationReading : null;
  const canConfirm =
    Boolean(onConfirm) && disposedOn.length > 0 && reading !== null && !isSubmitting;

  function handleSubmit() {
    if (!onConfirm || !canConfirm || !documentFile || !reading) return;

    onConfirm({
      disposedOn,
      document: documentFile,
      receptionTicket: reading.receptionTicket,
      receivedKg: reading.receivedKg,
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

      {/* Grupo `4230:13428` / `4230:13637` / `4230:14061`: el documento y los dos datos que transcribe. */}
      <div className="flex w-full flex-col items-start gap-[8px]">
        <WasteSidrepFileDropzone
          label={WASTE_FOLIO_CLOSE_DOCUMENT_LABELS[variant]}
          hint={WASTE_FOLIO_CLOSE_DECLARATION_HINT}
          accept="application/pdf"
          file={documentFile}
          onChange={handleDocumentChange}
          /*
           * El verde depende de la LECTURA y no del archivo, igual que en
           * `WasteSidrepWeightSection`: con el PDF subido pero la lectura fallada, mostrarlo
           * validado diría algo que no es.
           */
          confirmed={reading !== null}
        />

        {fileError ? (
          <p
            role="alert"
            className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
          >
            {fileError}
          </p>
        ) : null}

        {/* Fila `4230:13437` / `4230:13649` / `4230:14070`: las dos mitades, con lectura o sin ella. */}
        <div className="flex w-full items-start gap-[14px]">
          <WasteDerivedValueField
            label={WASTE_FOLIO_CLOSE_TICKET_LABEL}
            value={reading?.receptionTicket ?? null}
            pendingLabel={WASTE_FOLIO_CLOSE_PENDING_HINT}
          />
          <WasteDerivedValueField
            label={WASTE_FOLIO_CLOSE_RECEIVED_LABEL}
            /* El nodo `4230:13657` la escribe PEGADA: "590kg". */
            value={reading ? `${reading.receivedKg}kg` : null}
            pendingLabel={WASTE_FOLIO_CLOSE_PENDING_HINT}
          />
        </div>
      </div>

      {/*
        Recuadro `4230:13658`, en sus dos tonos: `3524:544` fuera de tolerancia y
        `3524:560` dentro. Mismos formatos que el panel de detalle de un folio cerrado:
        la brecha pegada ("20kg"), el despachado separado ("Despachado 610 kg").

        APARECE SIEMPRE QUE HAY LECTURA, conforme o no. Acá no es una alerta, es el
        número que se está por registrar: el modal no tiene grilla donde leer la brecha
        —a diferencia del panel de detalle, que la trae en `folioFacts`—, así que
        esconderla en el caso conforme dejaba confirmar un cierre sin haberla visto
        nunca. El tono es el que dice si hay que reclamarla.
      */}
      {reading ? (
        <WasteWeightDifferenceNotice
          exceedsTolerance={reading.gap.exceedsTolerance}
          difference={`${reading.gap.kg}kg`}
          percentage={reading.gap.percentage}
          dispatched={`Despachado ${dispatchedKg} kg`}
          tolerance={reading.gap.tolerance}
        />
      ) : null}

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
