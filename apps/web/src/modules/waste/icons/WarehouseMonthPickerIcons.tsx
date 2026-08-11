import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos del selector de período, exportados desde el nodo Figma `4068:75846`
 * del archivo Medio-Ambiente-Core.
 *
 * Misma convención que `WarehouseIntakeIcons` / `WarehouseControlIcons`: el
 * `.svg` crudo queda versionado al lado con el id del nodo en el nombre, y acá
 * el `fill` original se reemplaza por `currentColor`.
 *
 * El nodo `4068:75850` exporta DOS assets: un contenedor de 32 × 32 que resulta
 * estar vacío —solo un `<g opacity="0.87">` sin contenido— y el glifo real de
 * 12 × 7.41. Se versiona únicamente el glifo; el contenedor no dibuja nada.
 */

// Chevron del encabezado del selector de período. Figma node 4068:75850. Fill original: #00082D.
export function WarehouseMonthPickerChevronIcon(props: IconProps) {
  return (
    <svg width="12" height="7.41" viewBox="0 0 12 7.41" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M10.59 0L6 4.58L1.41 0L0 1.41L6 7.41L12 1.41L10.59 0Z" fill="currentColor" />
    </svg>
  );
}
