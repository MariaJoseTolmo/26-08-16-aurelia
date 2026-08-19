import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de la vista "Ingresos a bodega", exportados desde el nodo Figma
 * `3729:27632` del archivo Medio-Ambiente-Core.
 *
 * Misma convención que `WarehouseControlIcons`: el `.svg` crudo queda versionado
 * junto a este archivo con el id del nodo en el nombre, y acá el `fill` original
 * se reemplaza por `currentColor` para que el color lo defina quien lo usa.
 *
 * Los iconos que la vista comparte con "Control de bodega" —orden de columna,
 * peligrosidad, exportar, caret de selector— NO se duplican: se importan de
 * `WarehouseTableIcons` / `WarehouseControlIcons`. Se verificó byte a byte que
 * los assets de este nodo son los mismos glifos.
 *
 * OJO con el design context de este nodo: intercambia dos assets. Le asigna el
 * glifo "+" (15 × 12, `fill` blanco) a los encabezados de la tabla y las flechas
 * de ordenamiento (12.5 × 10.001, blanco 0.7) al botón "Nueva recepción a
 * bodega". Las cajas de cada nodo (`3817:57415` es 12.5 × 10 y `3817:57824` es
 * 15 × 12) y el asset ya versionado `figma-3765-42715-tbl-sort.svg` confirman
 * que va al revés, y así quedó implementado.
 */

// "+" del botón "Nueva recepción a bodega". Figma node 3817:57824. Fill original: white.
export function WarehouseIntakeNewIcon(props: IconProps) {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M8.25 1.5C8.25 1.08516 7.91484 0.75 7.5 0.75C7.08516 0.75 6.75 1.08516 6.75 1.5V5.25H3C2.58516 5.25 2.25 5.58516 2.25 6C2.25 6.41484 2.58516 6.75 3 6.75H6.75V10.5C6.75 10.9148 7.08516 11.25 7.5 11.25C7.91484 11.25 8.25 10.9148 8.25 10.5V6.75H12C12.4148 6.75 12.75 6.41484 12.75 6C12.75 5.58516 12.4148 5.25 12 5.25H8.25V1.5Z" fill="currentColor" />
    </svg>
  );
}

// Embudo de la barra "Filtros activos". Figma node 3817:57804. Fill original: #24588B.
export function WarehouseActiveFiltersIcon(props: IconProps) {
  return (
    <svg width="12.5" height="10" viewBox="0 0 12.5 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M1.875 1.25C1.62305 1.25 1.39453 1.40234 1.29688 1.63672C1.19922 1.87109 1.25391 2.13867 1.43359 2.31641L5 5.88477V8.125C5 8.29102 5.06641 8.44922 5.18359 8.56641L6.43359 9.81641C6.61328 9.99609 6.88086 10.0488 7.11523 9.95117C7.34961 9.85352 7.5 9.62695 7.5 9.375V5.88477L11.0664 2.31836C11.2461 2.13867 11.2988 1.87109 11.2012 1.63672C11.1035 1.40234 10.877 1.25 10.625 1.25H1.875Z" fill="currentColor" />
    </svg>
  );
}

// Calendario del filtro "Fecha de ingreso". Figma node 3817:57425. Fill original: #646464.
export function WarehouseDateFilterIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M6 1.59375C5.44687 1.59375 5 2.04062 5 2.59375V3.59375H4C2.89688 3.59375 2 4.49063 2 5.59375V7.09375H16V5.59375C16 4.49063 15.1031 3.59375 14 3.59375H13V2.59375C13 2.04062 12.5531 1.59375 12 1.59375C11.4469 1.59375 11 2.04062 11 2.59375V3.59375H7V2.59375C7 2.04062 6.55313 1.59375 6 1.59375ZM2 8.59375V14.5938C2 15.6969 2.89688 16.5938 4 16.5938H14C15.1031 16.5938 16 15.6969 16 14.5938V8.59375H2Z" fill="currentColor" />
    </svg>
  );
}

// Flecha "página anterior" del pie de tabla. Figma node 3734:28528. Fill original: #646464.
export function WarehousePagePrevIcon(props: IconProps) {
  return (
    <svg width="12.5" height="10" viewBox="0 0 12.5 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.30811 4.5581C3.06396 4.80225 3.06396 5.19873 3.30811 5.44287L7.05811 9.19287C7.30225 9.43701 7.69873 9.43701 7.94287 9.19287C8.18701 8.94873 8.18701 8.55225 7.94287 8.3081L4.63428 4.99951L7.94092 1.69092C8.18506 1.44678 8.18506 1.05029 7.94092 0.806152C7.69678 0.562012 7.30029 0.562012 7.05615 0.806152L3.30615 4.55615L3.30811 4.5581Z" fill="currentColor" />
    </svg>
  );
}

// Flecha "página siguiente" del pie de tabla. Figma node 3734:28533. Fill original: #646464.
export function WarehousePageNextIcon(props: IconProps) {
  return (
    <svg width="12.5" height="10" viewBox="0 0 12.5 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M9.20068 4.5581C9.44482 4.80225 9.44482 5.19873 9.20068 5.44287L5.45068 9.19287C5.20654 9.43701 4.81006 9.43701 4.56592 9.19287C4.32178 8.94873 4.32178 8.55225 4.56592 8.3081L7.87451 4.99951L4.56787 1.69092C4.32373 1.44678 4.32373 1.05029 4.56787 0.806152C4.81201 0.562012 5.2085 0.562012 5.45264 0.806152L9.20264 4.55615L9.20068 4.5581Z" fill="currentColor" />
    </svg>
  );
}

