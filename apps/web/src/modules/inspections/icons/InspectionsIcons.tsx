import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de los diálogos y avisos de inspecciones.
 *
 * ESTABAN ESCRITOS OCHO VECES, en línea, dentro de tres archivos:
 *
 *   `FindingRejectDialog`                  InfoIcon · CloseIcon · CheckIcon
 *   `ApproveCloseConfirmBridge`            InfoIcon · CloseIcon · CheckIcon
 *   `ManualExecutionCancelConfirmBridge`   InfoIcon · CloseIcon
 *
 * Los seis primeros eran copias EXACTAS carácter a carácter —mismo `viewBox`, mismos
 * `strokeWidth`, mismo `strokeLinecap`—, así que se unifican acá. El check no está en
 * este archivo: era el mismo dibujo que el snackbar del UI Kit y los dos avisos ahora
 * usan `SnackbarCheckIcon` de `shared/`.
 *
 * NO SON ASSETS DE FIGMA, y esa es la diferencia con `WarehouseIntakeIcons` o
 * `SprIcons`. Están dibujados a mano con primitivas (`<circle>` y trazos rectos) por
 * quien escribió esos diálogos: el `viewBox` es redondo, los radios son enteros y el
 * relleno es `stroke` y no `path`. Se conservan tal cual —mover un glifo no es momento
 * de rediseñarlo— pero conviene saberlo antes de compararlos con un nodo.
 *
 * LA X TIENE PARIENTES EN EL PROYECTO Y NO SE UNIFICÓ. `modules/waste` tiene dos
 * cierres exportados de Figma (`figma-432-6691-close.svg` y
 * `figma-3765-40593-modal-close.svg`), pero son otro dibujo: `path` relleno contra
 * estos dos trazos de 1.8px. Cambiarlo altera el render de tres diálogos de
 * inspecciones, así que es una decisión de esas pantallas y queda anotada.
 */

/** Círculo con "i" del encabezado de los diálogos de confirmación. 32 × 32. */
export function InspectionInfoIcon(props: IconProps) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
      <path d="M16 14.5v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="10.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** X de cerrar, de los diálogos y de los avisos. 16 × 16. */
export function InspectionCloseIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
