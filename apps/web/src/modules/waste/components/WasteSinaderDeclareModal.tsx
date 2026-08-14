import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WarehouseFormCalendarIcon } from '../icons/WarehouseIntakeFormIcons';
import {
  WasteSinaderMarkDeclaredIcon,
  WasteSinaderModalCloseIcon,
  WasteSinaderNoticeIcon,
} from '../icons/WasteSinaderReportIcons';

/**
 * Modal "Marcar período como declarado" — nodo Figma `4319:34781`, emplazado en
 * `4319:34428`. Lo abre el botón `3830:65730` del pie de "Reporte SINADER".
 *
 * Emplazamiento del nodo `4319:34428`: velo sobre TODO el viewport —el rectángulo
 * `4319:34778` mide 1280 × 720, o sea que tapa también el sidebar— y la tarjeta de
 * 480 × 471.25 en x=400, y=124. Sobre 1280 × 720 eso es el centro exacto en los
 * dos ejes ((1280−480)/2 = 400; (720−471.25)/2 = 124.4), así que se resuelve
 * centrando en vez de fijar coordenadas.
 *
 * Geometría, del design context:
 *
 *   tarjeta   bg white · rounded-[12px] · shadow-[0_24px_60px_rgba(0,0,0,0.35)]
 *   cabecera  border-b #e3e3e3 · px-[22px] pt-[18px] pb-[19px] · justify-between
 *             título Inter Bold 15px #131313 · subtítulo pt-[3px] 11.5px #646464
 *             cierre caja 29.5 × 19 con la "X" de 17.5 × 14
 *   cuerpo    px-[22px] py-[20px] · gap-[16px]
 *   pie       border-t #e3e3e3 · px-[22px] pt-[17px] pb-[16px] · gap-[10px] · justify-end
 *
 * El ancho de 480px SÍ se fija —es el ancho de la tarjeta, no del layout— pero con
 * `max-w-full` y el `p-[20px]` del velo para que en una ventana angosta se encoja
 * en vez de salirse. Los 436px de los campos NO se fijan: son 480 menos los
 * `px-[22px]`, así que `w-full` los reproduce y además acompaña al ancho.
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
  const titleId = useId();
  const folioRef = useRef<HTMLInputElement>(null);
  const [folio, setFolio] = useState('');
  const [declaredOn, setDeclaredOn] = useState('');

  /*
   * Cada apertura arranca en blanco y con el foco en el folio, el mismo criterio
   * que `WasteRcaThresholdsModal`: un modal que recuerda lo tipeado la vez
   * anterior invita a confirmar un dato viejo sin releerlo, y acá ese dato cierra
   * un período.
   */
  useEffect(() => {
    if (!open) return undefined;

    setFolio('');
    setDeclaredOn('');
    folioRef.current?.focus();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const trimmedFolio = folio.trim();
  const canConfirm = trimmedFolio.length > 0 && declaredOn.length > 0 && !isSubmitting;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canConfirm) return;
    onConfirm({ folio: trimmedFolio, declaredOn });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onMouseDown={(event) => {
        // Solo el click en el velo cierra; uno que empieza dentro de la tarjeta no.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/*
        `<form>` y no `<div>`: así Enter en cualquiera de los dos campos confirma,
        que es lo que espera quien viene tipeando un folio.
      */}
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="flex w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="flex w-full shrink-0 items-start justify-between border-b border-solid border-[#e3e3e3] px-[22px] pb-[19px] pt-[18px]">
          <div className="flex min-w-px flex-1 flex-col items-start">
            <h2
              id={titleId}
              className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[#131313]"
            >
              {WASTE_SINADER_DECLARE_TITLE}
            </h2>
            <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#646464]">
              {periodLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-[19px] w-[29.5px] shrink-0 items-center justify-end text-[#acacac] transition-colors hover:text-[#646464]"
          >
            <WasteSinaderModalCloseIcon className="block h-[14px] w-[17.5px] shrink-0" />
          </button>
        </div>

        <div className="flex w-full flex-col items-start gap-[16px] px-[22px] py-[20px]">
          {/*
            Aviso `4319:34792`. Misma paleta que `WasteNoticeBanner`, pero con
            `px-[15px]` en vez de `px-[17px]`: es la medida del modal, más angosto.
            No se reutiliza aquel componente por esos 2px y porque acá el texto no
            necesita el `flex-1` que aquél da por sentado.
          */}
          <div className="w-full rounded-[8px] border border-solid border-[#c5d8f0] bg-[#e6f3ff]">
            <div className="flex w-full items-start gap-[10px] px-[15px] py-[12px]">
              <WasteSinaderNoticeIcon className="mt-[2px] block size-[11.5px] shrink-0 text-[#0d3862]" />
              <p className="min-w-px flex-1 font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#0d3862]">
                Ingresa el N° de folio SINADER una vez que hayas completado la declaración en la
                Ventanilla Única del RETC. Esto cerrará el período y no admitirá más movimientos.
              </p>
            </div>
          </div>

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

          <WasteSinaderField label="N° de Folio SINADER">
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
                className="h-[36px] w-full rounded-[7px] border border-solid border-[#d1d1d1] bg-white px-[12px] font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac] focus:border-[#00b398]"
              />
            )}
          </WasteSinaderField>

          <WasteSinaderField label="Fecha de declaración">
            {(fieldId) => (
              /*
               * `<input type="date">` nativo y no el `WarehouseMonthPicker` del
               * módulo: aquél elige un MES y acá hace falta un día concreto. El
               * calendario del nodo (`4319:34833`) es el mismo glifo que
               * `WarehouseFormCalendarIcon` —verificado por firma normalizada por
               * escala—, así que se reutiliza en vez de versionar otro.
               *
               * El icono va detrás del input, con `pointer-events-none`, porque el
               * indicador nativo de Chrome se esconde con
               * `[&::-webkit-calendar-picker-indicator]:opacity-0` pero sigue
               * siendo el que abre el calendario al hacer click.
               */
              <div className="relative w-full">
                <input
                  id={fieldId}
                  value={declaredOn}
                  onChange={(event) => setDeclaredOn(event.target.value)}
                  type="date"
                  className="h-[36px] w-full rounded-[7px] border border-solid border-[#d1d1d1] bg-white pl-[9px] pr-[32px] font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[normal] text-[#131313] outline-none focus:border-[#00b398] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-[32px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <WarehouseFormCalendarIcon className="pointer-events-none absolute right-[6px] top-1/2 block size-[18px] -translate-y-1/2 text-[#131313]" />
              </div>
            )}
          </WasteSinaderField>

          {errorMessage ? (
            <p
              role="alert"
              className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 items-center justify-end gap-[10px] border-t border-solid border-[#e3e3e3] px-[22px] pb-[16px] pt-[17px]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[34.5px] shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#d1d1d1] px-[17px] transition-colors hover:bg-[#f7f7f7]"
          >
            <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#646464]">
              Cancelar
            </span>
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            className={`flex h-[34.5px] shrink-0 items-center gap-[6px] rounded-[8px] px-[16px] transition-colors ${
              canConfirm ? 'bg-[#c8a064] hover:bg-[#bb9057]' : 'cursor-not-allowed bg-[#e2e2e2]'
            }`}
          >
            <WasteSinaderMarkDeclaredIcon
              className={`block h-[12px] w-[15px] shrink-0 ${canConfirm ? 'text-white' : 'text-[#acacac]'}`}
            />
            <span
              className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
                canConfirm ? 'text-white' : 'text-[#acacac]'
              }`}
            >
              {isSubmitting ? 'Confirmando…' : 'Confirmar declaración'}
            </span>
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

/**
 * Rótulo + control, con el `gap-[5px]` de los nodos `4319:34807` y `4319:34828`.
 *
 * Pasa el `id` al hijo por render prop para que el `<label>` quede asociado al
 * control de verdad: sin eso, un click en "N° de Folio SINADER" no enfoca el campo
 * y el lector de pantalla no anuncia el rótulo.
 */
function WasteSinaderField({
  label,
  children,
}: {
  label: string;
  children: (fieldId: string) => React.ReactNode;
}) {
  const fieldId = useId();

  return (
    <div className="flex w-full flex-col items-start gap-[5px]">
      <label
        htmlFor={fieldId}
        className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold not-italic leading-[normal] text-[#333333]"
      >
        {label}
      </label>
      {children(fieldId)}
    </div>
  );
}
