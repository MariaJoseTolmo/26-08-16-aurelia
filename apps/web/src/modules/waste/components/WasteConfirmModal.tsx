import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { WasteSidrepSendIcon } from '../icons/WasteSidrepDocumentsIcons';

/**
 * Armazón de los modales de DECISIÓN del módulo — tarjeta compacta, centrada en los dos
 * ejes, sin cabecera ni pie con borde. Nodo Figma `4295:24214` ("Rechazar solicitud").
 *
 * NO ES `WasteFormModal` CON OTRA PROP, y la diferencia no es de piel sino de anatomía.
 * Aquél es el modal de FORMULARIO —cabecera con título, subtítulo y "X" de cierre sobre
 * una línea, cuerpo con `gap-[16px]` que scrollea, pie sobre otra línea, `px-[22px]`—.
 * Éste es una tarjeta de una sola pieza: `p-[24px]` parejo, sin líneas, sin botón de
 * cierre, y el título en `#001e39` en vez de `#131313`. Hacerlo variante pedía condicionar
 * los bordes, el padding, los dos colores y la existencia misma de la "X": la prop habría
 * decidido la tarjeta entera.
 *
 * ESTÁ CENTRADO EN LOS DOS EJES Y ESO SALE DEL EMPLAZAMIENTO, no de un pedido suelto: el
 * nodo pone su tarjeta de 440 × 295 en x=440, y=212.25 sobre un viewport de 1320 × 720.
 * En horizontal es el centro exacto —(1320 − 440) / 2 = 440— y en vertical queda a 0.25px
 * del centro —(720 − 295) / 2 = 212.5—, o sea un empujón de Figma. Por eso se centra en
 * vez de fijar coordenadas.
 *
 * Geometría del design context:
 *
 *   velo       fixed inset-0 · bg rgba(19,19,19,0.75) · p-[20px] · centrado
 *   tarjeta    `4295:24214`  bg white · rounded-[12px] · p-[24px] · w-[440px]
 *                            shadow 0 20px 30px rgba(0,0,0,0.25)
 *   título     `4295:24216`  Inter Bold 15px · #001e39
 *   bajada     `4295:24217`  pt-[6px] · Inter Regular 11px · #646464 · leading-[16.5px]
 *   rótulo     `4295:24219`  pt-[18px] pb-[6px] · Inter Bold 10px · #131313
 *                            el asterisco en #bd3b5b
 *   campo      `4295:24222`  h-[100px] · bg #e6f3ff · border #d1d1d1 · rounded-[8px]
 *                            px-[13px] py-[11px] · Inter Regular 11px · leading-[16.5px]
 *   pie        `4295:24230`  pt-[16px] · gap-[10px] · justify-end
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTE MISMO DIÁLOGO YA ESTÁ IMPLEMENTADO EN `modules/spr`
 *
 * `SprAreaRejectModal` (nodo `1399:14360`, "Rechazar formulario") dibuja EXACTAMENTE
 * esta tarjeta: mismos 440 de ancho, mismo `p-[24px]`, misma sombra, mismo título de
 * 15px en `#001e39`, misma bajada de 11px, mismo rótulo con asterisco rojo, mismo campo
 * azul de 100px y los mismos dos botones. El nodo de residuos es esa pantalla duplicada:
 * los NOMBRES DE CAPA lo prueban —`4295:24218` se llama "El Responsable de Área recibirá
 * una notificación c" y `4295:24223` "Describe qué debe corregir Felipe Núñez González.",
 * que son literalmente los textos de `SPR_AREA_REJECT_MODAL`— aunque el contenido después
 * se reescribió para residuos.
 *
 * NO SE IMPORTA AQUÉL: cruzar de módulo ata dos pantallas que se editan por separado, y
 * además aquél trae bakeado un aviso rojo de plazo que este nodo no dibuja. Se escribe el
 * armazón acá, del lado de residuos, y queda anotado que el día que aparezca un tercero
 * el lugar de esto es `shared/components` y no un tercer módulo.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LOS 440px SE FIJAN pero con `max-w-full` bajo el `p-[20px]` del velo: es un ancho de
 * diálogo y no de layout, y en una ventana angosta la tarjeta se encoge en vez de salirse.
 */

interface WasteConfirmModalProps {
  open: boolean;
  /** Título de la tarjeta. Es el que nombra el diálogo por `aria-labelledby`. */
  title: string;
  /** Bajada: qué va a pasar cuando se confirme. */
  description: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  /** Botones del pie, de izquierda a derecha. */
  actions: ReactNode;
}

export function WasteConfirmModal({
  open,
  title,
  description,
  onClose,
  onSubmit,
  children,
  actions,
}: WasteConfirmModalProps): ReactNode {
  const titleId = useId();
  const cardRef = useRef<HTMLFormElement | null>(null);

  /*
   * Al abrir, el foco entra en la tarjeta —que lleva `tabIndex={-1}`— y no en el campo.
   * Es deliberado y distinto de `WasteFormModal`: acá el primer control es el motivo del
   * rechazo, y saltar directo a escribirlo se saltea la bajada, que es la que dice que el
   * texto se le va a notificar a otra persona. Con el foco en la tarjeta, Escape y el Tab
   * arrancan igual dentro del diálogo.
   */
  useEffect(() => {
    if (!open) return undefined;

    cardRef.current?.focus();
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

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] p-[20px]"
      onMouseDown={(event) => {
        // Solo el click en el velo cierra; uno que empieza dentro de la tarjeta no.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/*
        VA COMO `<form>` aunque el campo sea un `<textarea>`, donde Enter escribe una
        línea en vez de enviar. Lo que aporta es que el botón del pie sea `type="submit"`
        y que el navegador aplique la validación nativa del campo requerido antes de
        llamar al `onSubmit`.
      */}
      <form
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="flex w-[440px] max-w-full flex-col items-start rounded-[12px] bg-white p-[24px] shadow-[0_20px_30px_rgba(0,0,0,0.25)] outline-none"
      >
        <h2
          id={titleId}
          className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[#001e39]"
        >
          {title}
        </h2>
        <p className="w-full pt-[6px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[16.5px] text-[#646464]">
          {description}
        </p>
        {children}
        <div className="flex w-full items-center justify-end gap-[10px] pt-[16px]">{actions}</div>
      </form>
    </div>,
    document.body,
  );
}

/**
 * Campo de texto largo con su rótulo — nodos `4295:24219` (rótulo) y `4295:24222` (caja).
 *
 * EL ASTERISCO ROJO NO ES DECORACIÓN: el nodo lo dibuja en `#bd3b5b` porque el campo es
 * obligatorio, así que va junto con el `required` del control. Se marca `aria-hidden` y
 * la obligatoriedad se anuncia por `required`, para que el lector de pantalla no lea
 * "asterisco" en medio del rótulo.
 *
 * LOS 4px QUE SOBRAN ABAJO SON DEL NODO. El contenedor `4295:24221` mide 104 y la caja
 * 100, y el pie arranca justo después: son 20px entre el campo y los botones, no los 16
 * del `pt` del pie. Se reproducen como `pb-[4px]` en vez de subir el `pt` del pie, que es
 * del armazón y lo comparten todos los cuerpos.
 *
 * `resize-none` porque el nodo declara la caja `overflow-clip` con alto fijo: el tirador
 * nativo dejaría estirar el campo hasta romper la tarjeta. El alto de 100 es de control,
 * no de layout.
 */
export function WasteConfirmModalTextArea({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const fieldId = useId();

  return (
    <>
      <label
        htmlFor={fieldId}
        className="whitespace-nowrap pb-[6px] pt-[18px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] text-[#131313]"
      >
        {label}{' '}
        <span aria-hidden="true" className="text-[#bd3b5b]">
          *
        </span>
      </label>
      <div className="w-full pb-[4px]">
        <textarea
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required
          rows={4}
          className="h-[100px] w-full resize-none rounded-[8px] border border-solid border-[#d1d1d1] bg-[#e6f3ff] px-[13px] py-[11px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[16.5px] text-[#131313] outline-none placeholder:text-[#646464] focus:border-[#00b398] disabled:opacity-60"
        />
      </div>
    </>
  );
}

/**
 * "Cancelar" del pie — nodo `4295:24231`.
 *
 * NO ES `WasteFormModalCancelButton`, y las cuatro medidas que los separan son todas del
 * nodo: aquél mide 34.5 de alto con `rounded-[8px]`, borde `#d1d1d1` y rótulo Inter BOLD;
 * éste mide 34 con `rounded-[7px]`, borde `#e3e3e3` y rótulo Inter SEMI BOLD. Es el
 * botón de descarte de ESTA familia de tarjeta, igual que aquél lo es de la suya.
 *
 * Los 86px del nodo salen de `px-[17px]` más los 52 del texto: no se fijan.
 */
export function WasteConfirmModalCancelButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[34px] shrink-0 items-center justify-center rounded-[7px] border border-solid border-[#e3e3e3] bg-white px-[17px] transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#646464]">
        {label}
      </span>
    </button>
  );
}

/**
 * Acción destructiva del pie — nodo `4295:24233`.
 *
 * NO ES `WasteFolioFooterActionButton` en tono `danger`: aquél es el botón del PIE DEL
 * PANEL de detalle —34.5 de alto, `rounded-[8px]`, sin fondo y con borde `#ffd0db`—, y
 * éste es el rojo MACIZO `#bd3b5b` de 34 con `rounded-[7px]`. Son dos pesos distintos de
 * la misma decisión: en el panel "Rechazar" sólo ABRE este diálogo, y acá adentro el rojo
 * lleno es el que la ejecuta.
 *
 * EL GLIFO NO ES NUEVO. El nodo `4295:24234` exporta el mismo avión que `4278:21432`, o
 * sea `WasteSidrepSendIcon`, escalado por 15/13.75 = 1.0909: verificado coordenada por
 * coordenada (13.3219 → 12.2117, 12.4866 → 11.4461, 4.97724 → 4.56247). Va bakeado y no
 * como prop porque el botón dice "enviar" y el avión es esa palabra dibujada.
 *
 * SE LE PIDE SU CAJA NATURAL —13.75 × 11.9424— y no los 13.75 × 11 que declara el nodo.
 * Es lo mismo: el nodo pone el dibujo con `inset-[-5.44%_0_-3.13%_0]`, o sea desbordando
 * 0.598 arriba y 0.344 abajo de una caja de 11, que da esos mismos 11.9424 de dibujo. Con
 * la caja de 11 el `preserveAspectRatio` por defecto encogería el avión a 12.66 de ancho,
 * un 8% más chico que el diseño. Centrado en la fila, el desvío contra el nodo es de
 * 0.127px.
 *
 * DESHABILITADO: `#e3e3e3` con tinta `#acacac`, el par que el módulo ya usa para el
 * inactivo. El nodo no lo dibuja —entra con el formulario vacío pero el botón pintado—,
 * y un "Enviar rechazo" activo sin motivo escrito mandaría una devolución vacía.
 */
export function WasteConfirmModalDangerButton({
  label,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
}) {
  const ink = disabled ? 'text-[#acacac]' : 'text-white';

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`flex h-[34px] shrink-0 items-center gap-[6px] rounded-[7px] px-[16px] transition-colors ${
        disabled ? 'cursor-not-allowed bg-[#e3e3e3]' : 'bg-[#bd3b5b] hover:bg-[#a83350]'
      }`}
    >
      <WasteSidrepSendIcon className={`block h-[11.9424px] w-[13.75px] shrink-0 ${ink}`} />
      <span
        className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${ink}`}
      >
        {label}
      </span>
    </button>
  );
}
