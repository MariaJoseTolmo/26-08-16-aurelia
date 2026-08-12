import { useEffect } from 'react';
import { SnackbarCheckIcon } from './icons/SnackbarCheckIcon';

/**
 * Snackbar de confirmación — nodo Figma `3785:45722`, instancia del componente
 * "Snackbar" del UI Kit.
 *
 *   caja    bg #54a036 · rounded-[8px] · flex gap-[8px] items-center · p-[12px]
 *   icono   caja 24 × 24 con el glifo en `inset-[8.33%]`, o sea 20 × 20
 *   texto   Inter Bold 14px · leading-[22.7px] · tracking-[0.28px] · white
 *
 * La instancia del nodo tiene OCULTAS la segunda línea (`416:355`) y la X de cerrar
 * (`416:356`), asi que este componente dibuja solo el título. Cuando aparezca un
 * nodo que las use, se agregan como props en vez de inventarlas ahora.
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
 * LO QUE FALTA ES EL CASCARÓN, y no es un olvido. Esas dos copias llevan dos cosas que
 * este componente no tiene porque su nodo las trae OCULTAS: una X de cerrar y una
 * `shadow`. Migrarlas entero pide sumarle esas props —y en un caso reacomodar su
 * temporizador propio de 3200ms—, que es tocar flujos de inspecciones. Queda anotado.
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
   * Clases de posición. Se pasan desde afuera porque el nodo lo emplaza dentro de
   * la columna de contenido y no de la ventana, y cada pantalla sabe cuál es su
   * columna.
   */
  className?: string;
}

export function Snackbar({ open, message, autoHideMs = 6000, onClose, className = '' }: SnackbarProps) {
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
    </div>
  );
}
