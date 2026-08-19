import { useEffect } from 'react';
import { SnackbarCheckIcon } from './icons/SnackbarCheckIcon';
import { SnackbarCloseIcon } from './icons/SnackbarCloseIcon';

/**
 * Snackbar de confirmación — nodos Figma `3785:45722` (Solicitud de retiro) y
 * `3083:9723` (Folios SIDREP), instancias del componente "Snackbar" del UI Kit.
 *
 *   caja    bg #54a036 · rounded-[8px] · flex gap-[8px] items-center · p-[12px]
 *   icono   caja 24 × 24 con el glifo en `inset-[8.33%]`, o sea 20 × 20
 *   texto   Inter Bold 14px · leading-[22.7px] · tracking-[0.28px] · white
 *   cerrar  caja 16 × 16 con el glifo en `inset-[8.33%]`, o sea 13.333 × 13.333
 *
 * La segunda línea (`416:355`) sigue OCULTA en las dos instancias, así que este
 * componente dibuja sólo el título. La X de cerrar (`416:356`) estaba oculta en
 * `3785:45722` y VISIBLE en `3083:9723`, así que se agrega como el `dismissible` que
 * quedó anotado acá, en vez de inventarla.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTE PATRÓN YA EXISTÍA INLINE, DOS VECES
 *
 * `modules/inspections/components/FindingRejectDialog` y
 * `ApproveCloseConfirmBridge` traen el mismo snackbar escrito a mano, con el mismo
 * `bg-[#54a036]`, `p-[12px]`, `rounded-[8px]`, `gap-[8px]` y la misma tipografía
 * (14px bold, `leading-[22.7px]`, `tracking-[0.28px]`). O sea es el mismo componente
 * del UI Kit copiado. Se extrae acá, en `shared/`, porque lo van a usar dos módulos.
 *
 * DE ESAS DOS COPIAS YA SE UNIFICÓ EL CHECK: las dos usan `SnackbarCheckIcon` en la
 * misma caja de 24 con el glifo en 20, así que el dibujo del anillo con el check dejó
 * de estar aproximado a mano con `stroke`.
 *
 * LO QUE FALTA ES LA `shadow`. La X de cerrar ya está —`dismissible`—, así que de las
 * dos cosas que impedían migrar esas copias queda una, más el temporizador propio de
 * 3200ms de una de ellas. Migrarlas sigue siendo tocar flujos de inspecciones y sigue
 * anotado.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `role="status"` con `aria-live="polite"` para que el lector de pantalla lo anuncie
 * sin interrumpir, que es lo que corresponde a una confirmación. Es el mismo par que
 * ya usan las dos copias de inspecciones.
 */
interface SnackbarProps {
  open: boolean;
  message: string;
  /**
   * Milisegundos hasta que se oculta solo. El nodo no define duración —Figma no
   * dibuja el tiempo—, pero un aviso que no se va nunca tapa la paginación de la
   * tabla, que es justo lo que queda debajo.
   */
  autoHideMs?: number;
  onClose: () => void;
  /**
   * Dibuja la X de cerrar del nodo `3083:9723`, que llama al mismo `onClose` que el
   * temporizador: cerrar a mano y cerrarse solo son el mismo efecto, así que no lleva
   * su propia prop. Sin esto no se dibuja, como en `3785:45722`.
   */
  dismissible?: boolean;
  /**
   * Clases de posición. Se pasan desde afuera porque el nodo lo emplaza dentro de
   * la columna de contenido y no de la ventana, y cada pantalla sabe cuál es su
   * columna.
   */
  className?: string;
}

export function Snackbar({
  open,
  message,
  autoHideMs = 6000,
  onClose,
  dismissible = false,
  className = '',
}: SnackbarProps) {
  useEffect(() => {
    if (!open) return undefined;

    const timer = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(timer);
  }, [open, autoHideMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-[8px] rounded-[8px] bg-[#54a036] p-[12px] ${className}`}
    >
      <span className="flex size-[24px] shrink-0 items-center justify-center">
        <SnackbarCheckIcon className="block size-[20px] shrink-0 text-white" />
      </span>
      <p className="font-['Inter:Bold',sans-serif] text-[14px] font-bold not-italic leading-[22.7px] tracking-[0.28px] text-white">
        {message}
      </p>
      {dismissible ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar el aviso"
          className="flex size-[16px] shrink-0 items-center justify-center"
        >
          <SnackbarCloseIcon className="block size-[13.333px] shrink-0 text-white" />
        </button>
      ) : null}
    </div>
  );
}
