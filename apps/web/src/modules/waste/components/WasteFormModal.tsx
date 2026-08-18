import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { WarehouseFormCalendarIcon } from '../icons/WarehouseIntakeFormIcons';
import { WasteFolioVerifiedIcon } from '../icons/WasteSidrepPendingFolioIcons';
import {
  WasteSinaderModalCloseIcon,
  WasteSinaderNoticeIcon,
} from '../icons/WasteSinaderReportIcons';

/**
 * Armazón de los modales CENTRADOS de formulario del módulo — DOS NODOS, una sola
 * tarjeta:
 *
 *   `4319:34781`  "Marcar período como declarado"  480 de ancho, en `4319:34428`
 *   `4230:13273`  "Registrar cierre de folio"      520 de ancho
 *
 * LOS DOS NODOS DIBUJAN EXACTAMENTE LA MISMA TARJETA y se diferencian sólo en el ancho
 * y en el contenido del cuerpo. Se verificó midiendo el design context de los dos:
 * cabecera, tipografías, caja de cierre, padding del cuerpo, pie y los dos botones del
 * pie coinciden píxel a píxel. Por eso el armazón vive acá y no copiado en cada modal:
 * con dos copias, el próximo modal del módulo hereda la que encuentre primero.
 *
 * ESTÁ CENTRADO EN LOS DOS EJES, y eso sale del emplazamiento. El nodo `4319:34428`
 * pone su tarjeta de 480 × 471.25 en x=400, y=124 sobre un viewport de 1280 × 720, que
 * es el centro exacto. El nodo `4230:13273` mide 520 × 479 en x=380, y=120.875 sobre
 * 1320 × 720: el eje vertical es el centro exacto (120.875 + 479 + 120.125 = 720) y el
 * horizontal queda 20px a la izquierda del centro (380 contra 400), un empujón de Figma
 * y no una intención. Por eso se centra en vez de fijar coordenadas.
 *
 * Geometría del design context:
 *
 *   velo      fixed inset-0 · bg rgba(19,19,19,0.75) · p-[20px] · centrado
 *   tarjeta   bg white · rounded-[12px] · shadow-[0_24px_60px_rgba(0,0,0,0.35)]
 *   cabecera  border-b #e3e3e3 · px-[22px] pt-[18px] pb-[19px] · justify-between
 *             título    Inter Bold    15px   · #131313
 *             subtítulo pt-[3px] Inter Regular 11.5px · #646464
 *             cierre    caja 29.5 × 19 con la "X" de 17.5 × 14 · #acacac
 *   cuerpo    px-[22px] py-[20px] · gap-[16px]
 *   pie       border-t #e3e3e3 · px-[22px] pt-[17px] pb-[16px] · gap-[10px] · justify-end
 *
 * LOS ANCHOS SÍ SE FIJAN —son anchos de diálogo y no de layout— pero con `max-w-full` y
 * el `p-[20px]` del velo, para que en una ventana angosta la tarjeta se encoja en vez de
 * salirse. Y el CUERPO es el único que scrollea (`min-h-0 flex-1 overflow-y-auto` bajo un
 * `max-h-full`): en una ventana baja la cabecera y el pie quedan quietos en vez de que el
 * pie se vaya fuera de la pantalla.
 *
 * DOS MEDIDAS CAMBIAN RESPECTO DE CÓMO ESTABA CODIFICADO `WasteSinaderDeclareModal`, y
 * las dos van hacia el nodo, no en contra:
 *
 *   1. LA "X" DE CIERRE VA CENTRADA en su caja y no pegada a la derecha. El nodo
 *      `4230:13281` la pone en left=6 dentro de una caja de 29.5 con un glifo de 17.5:
 *      (29.5 − 17.5) / 2 = 6, o sea centrada. `justify-end` la dejaba 6px más a la
 *      derecha.
 *   2. EL GLIFO DEL AVISO AZUL ARRANCA EN EL TOPE del texto, sin los 2px de `mt`. El
 *      nodo `4230:13284` pone el icono y el párrafo los dos en y=12.
 *
 * El `gap-[12px]` de la cabecera NO es del nodo —ahí sobran 70px entre el bloque de
 * textos y el botón—: es un canal de seguridad para que un subtítulo largo no llegue a
 * tocar la "X".
 */

/** Ancho de la tarjeta. Un valor por nodo; no hay medidas intermedias en el diseño. */
export type WasteFormModalWidth = 'md' | 'lg';

const CARD_WIDTH: Record<WasteFormModalWidth, string> = {
  /** `4319:34781` — "Marcar período como declarado". */
  md: 'w-[480px]',
  /** `4230:13273` — "Registrar cierre de folio". */
  lg: 'w-[520px]',
};

interface WasteFormModalProps {
  open: boolean;
  /** Título de la cabecera. Es el que nombra el diálogo por `aria-labelledby`. */
  title: string;
  /** Segunda línea de la cabecera: el período, el folio, el residuo. */
  subtitle: string;
  width?: WasteFormModalWidth;
  onClose: () => void;
  /**
   * Con esto la tarjeta se monta como `<form>` en vez de `<div>`, así Enter en cualquier
   * campo confirma —que es lo que espera quien viene tipeando— y el botón del pie puede
   * ser `type="submit"`. Sin esto la tarjeta es un `<div>`: un `<form>` sin envío es un
   * contenedor que promete algo que no hace.
   */
  onSubmit?: () => void;
  /**
   * Control que recibe el foco al abrir. Sin esto lo recibe la tarjeta, que tiene
   * `tabIndex={-1}`: en los dos casos Escape y el Tab arrancan dentro del diálogo, pero
   * enfocar el primer campo le ahorra un Tab a quien viene a llenarlo.
   */
  initialFocusRef?: RefObject<HTMLElement>;
  children: ReactNode;
  /** Botones del pie, de izquierda a derecha. */
  actions: ReactNode;
}

export function WasteFormModal({
  open,
  title,
  subtitle,
  width = 'md',
  onClose,
  onSubmit,
  initialFocusRef,
  children,
  actions,
}: WasteFormModalProps) {
  const titleId = useId();
  /*
   * La raíz cambia de etiqueta según `onSubmit`, así que la referencia se toma por
   * callback y se tipa como `HTMLElement`: sirve para el `<form>` y para el `<div>`.
   */
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    (initialFocusRef?.current ?? cardRef.current)?.focus();
    return undefined;
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const cardClassName = `flex ${CARD_WIDTH[width]} max-h-full max-w-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] outline-none`;

  const cardContent = (
    <>
      <div className="flex w-full shrink-0 items-start justify-between gap-[12px] border-b border-solid border-[#e3e3e3] px-[22px] pb-[19px] pt-[18px]">
        <div className="flex min-w-px flex-1 flex-col items-start">
          <h2
            id={titleId}
            className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[#131313]"
          >
            {title}
          </h2>
          <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#646464]">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-[19px] w-[29.5px] shrink-0 items-center justify-center text-[#acacac] transition-colors hover:text-[#646464]"
        >
          <WasteSinaderModalCloseIcon className="block h-[14px] w-[17.5px] shrink-0" />
        </button>
      </div>

      {/* El `min-h-0` es lo que deja al cuerpo encogerse por debajo de su contenido. */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-[16px] overflow-y-auto px-[22px] py-[20px]">
        {children}
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-[10px] border-t border-solid border-[#e3e3e3] px-[22px] pb-[16px] pt-[17px]">
        {actions}
      </div>
    </>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onMouseDown={(event) => {
        // Solo el click en el velo cierra; uno que empieza dentro de la tarjeta no.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form
          ref={(node) => {
            cardRef.current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className={cardClassName}
        >
          {cardContent}
        </form>
      ) : (
        <div
          ref={(node) => {
            cardRef.current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cardClassName}
        >
          {cardContent}
        </div>
      )}
    </div>,
    document.body,
  );
}

/**
 * Aviso del cuerpo — nodos `4319:34792`, `4230:13284` y `3087:17249` en azul, `3087:17710`
 * en verde.
 *
 * NO es `WasteNoticeBanner`: aquél va `px-[17px]` y es el aviso a todo el ancho de una
 * VISTA; éste va `px-[15px]`, la medida del modal.
 *
 * EL TEXTO ES UN `<div>` Y NO UN `<p>`, y es por el modal de aprobación: sus dos avisos
 * dibujan varios párrafos —el `3087:17252` tres líneas con la del medio en Inter Bold— así
 * que el aviso tiene que poder recibirlos. Un `<p>` no puede contener otro `<p>` —el
 * navegador lo cierra solo y el bloque termina fuera de la caja—, así que la etiqueta cambia
 * y las clases se quedan donde están: los avisos de una sola frase salen idénticos, porque
 * `leading-[17.25px]` se hereda igual.
 */

/**
 * Qué dice el aviso. Cada tono sale de nodos concretos y trae SU PROPIO GLIFO BAKEADO, no
 * uno por prop: dejarlo abierto era la forma de que el próximo modal pusiera otro dibujo en
 * la misma caja.
 *
 *   `info`     `4319:34792` · `4230:13284` · `3087:17249`
 *              bg #e6f3ff · borde #c5d8f0 · tinta #0d3862 · "i" en círculo · gap 10
 *   `success`  `3087:17710`
 *              bg #e0ffd3 · borde #a8dfa8 · tinta #2a5c16 · tilde en círculo · gap 8
 *
 * EL GAP CAMBIA ENTRE LOS DOS Y NO ES UN DESCUIDO DE ESTE ARCHIVO: es lo que miden los
 * nodos. El azul pone el glifo en x=15 y el texto en x=36.5 —15 + 11.5 + 10—, y el verde
 * mete los dos en un grupo con `gap-[8px]` declarado. Dos píxeles de diferencia que el
 * diseño escribió; unificarlos habría sido corregir el diseño desde el código.
 *
 * El par verde es el MISMO que el aviso de verificación del panel de pendientes
 * (`3073:6018`) y que la dropzone cargada del flujo SIDREP: es el verde de confirmación del
 * módulo, no un color nuevo. De ahí sale también el glifo, `WasteFolioVerifiedIcon`, que a
 * `size-[11.5px]` da exactamente el asset de 11.5 de este nodo —verificado token a token: es
 * el mismo trazado por 11.5/11, 96 números con 4.09e-5 de desviación máxima—.
 */
export type WasteFormModalNoticeTone = 'info' | 'success';

const NOTICE_TONE: Record<
  WasteFormModalNoticeTone,
  { box: string; gap: string; ink: string; icon: (className: string) => ReactNode }
> = {
  info: {
    box: 'border-[#c5d8f0] bg-[#e6f3ff]',
    gap: 'gap-[10px]',
    ink: 'text-[#0d3862]',
    icon: (className) => <WasteSinaderNoticeIcon className={className} />,
  },
  success: {
    box: 'border-[#a8dfa8] bg-[#e0ffd3]',
    gap: 'gap-[8px]',
    ink: 'text-[#2a5c16]',
    icon: (className) => <WasteFolioVerifiedIcon className={className} />,
  },
};

export function WasteFormModalNotice({
  tone = 'info',
  children,
}: {
  /** Por defecto `info`, que fue el primero y es el mayoritario en los modales del módulo. */
  tone?: WasteFormModalNoticeTone;
  children: ReactNode;
}) {
  const skin = NOTICE_TONE[tone];

  return (
    <div className={`w-full rounded-[8px] border border-solid ${skin.box}`}>
      <div className={`flex w-full items-start px-[15px] py-[12px] ${skin.gap}`}>
        {skin.icon(`block size-[11.5px] shrink-0 ${skin.ink}`)}
        <div
          className={`min-w-px flex-1 font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] ${skin.ink}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Rótulo + control, con el `gap-[5px]` de los nodos `4319:34807`, `4319:34828` y
 * `4230:13289`.
 *
 * Pasa el `id` al hijo por render prop para que el `<label>` quede asociado al control de
 * verdad: sin eso, un click en el rótulo no enfoca el campo y el lector de pantalla no lo
 * anuncia.
 */
export function WasteFormModalField({
  label,
  children,
}: {
  label: string;
  children: (fieldId: string) => ReactNode;
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

/** Caja del campo, sin padding horizontal: cada control pone el suyo. */
const FIELD_SHELL =
  "h-[36px] w-full rounded-[7px] border border-solid border-[#d1d1d1] bg-white font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac] focus:border-[#00b398]";

/**
 * Campo de texto del modal — nodo `4319:34811`. Se expone como clase y no como
 * componente para no tener que reenviar `inputMode`, `autoComplete`, `ref` y compañía.
 */
export const WASTE_FORM_MODAL_INPUT_CLASS = `${FIELD_SHELL} px-[12px]`;

/**
 * Selector de fecha — nodos `4319:34832` y `4230:13292`.
 *
 * `<input type="date">` nativo y no el `WarehouseMonthPicker` del módulo: aquél elige un
 * MES y acá hace falta un día concreto. El calendario de 18 × 18 es el mismo glifo que
 * `WarehouseFormCalendarIcon` —verificado por firma de trazado, los dos nodos traen el
 * mismo `d`—, así que se reutiliza en vez de versionar otro.
 *
 * El icono va DETRÁS del input con `pointer-events-none`, porque el indicador nativo de
 * Chrome se esconde con `opacity-0` pero sigue siendo el que abre el calendario al hacer
 * click.
 */
export function WasteFormModalDateInput({
  id,
  value,
  onChange,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
}) {
  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        className={`${FIELD_SHELL} pl-[9px] pr-[32px] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-[32px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
      />
      <WarehouseFormCalendarIcon className="pointer-events-none absolute right-[6px] top-1/2 block size-[18px] -translate-y-1/2 text-[#131313]" />
    </div>
  );
}

/**
 * Botón de descarte del pie — nodos `4319:34840` y `4230:13312`.
 *
 * NO es `WasteSecondaryActionButton`: aquél va `px-[19px] py-[10px]` y al tamaño de su
 * texto; éste tiene el alto fijo de 34.5 del pie y `px-[17px]`, para quedar a la misma
 * altura que el primario que lo acompaña.
 */
export function WasteFormModalCancelButton({
  label = 'Cancelar',
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[34.5px] shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#d1d1d1] px-[17px] transition-colors hover:bg-[#f7f7f7]"
    >
      <span className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#646464]">
        {label}
      </span>
    </button>
  );
}
