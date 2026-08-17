import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de la pestaña "Abiertos" de "Folios SIDREP" — nodo Figma `3081:7463` del
 * archivo Medio-Ambiente-Core.
 *
 * Misma convención que el resto del módulo: el `.svg` crudo queda versionado al
 * lado de este archivo con el id del nodo en el nombre, y acá el `fill` original se
 * reemplaza por `currentColor` para que el color lo decida quien lo usa.
 *
 * EL NODO DIBUJA CINCO GLIFOS Y SÓLO UNO ES NUEVO. Los otros cuatro ya estaban
 * versionados en el módulo; se comprobó por firma del path NORMALIZADA POR ESCALA
 * —cada coordenada dividida por el ancho de la caja— contra los 54 assets del
 * módulo, no por parecido:
 *
 *   `3081:7886`  chevron 13.75 × 11 de la fila     → `WarehousePageNextIcon`
 *                (12.5 × 10, el mismo path por 1.1)
 *   `3081:7924`  triángulo 11 × 11 de la alerta    → `WastePerformanceCriticalNoteIcon`
 *                (10.5 × 10.5, por 1.047619)
 *   `3081:7969`  "i" en círculo 11 × 11 del aviso  → `WasteSinaderNoticeIcon`
 *                (11.5 × 11.5, por 0.956522)
 *   `3081:7978`  portapapeles 15 × 12 del botón    → `WarehouseFormLotIcon`
 *                (16.875 × 13.5, por 0.888889)
 *
 * El `viewBox` escala solo, así que pedirles la caja de este nodo no los deforma.
 * Por eso esta vista no agrega un archivo de iconos por cada pieza: agrega uno.
 */

/**
 * Camión de reparto de la casilla de cada folio ABIERTO — nodo `3081:7874`. Fill
 * original: #E8720C, sobre casilla `#fff0e6`.
 *
 * ES EL GLIFO QUE DISTINGUE LA PESTAÑA. Los dos tonos que ya tenía
 * `WasteFolioListCard` cuentan cómo CERRÓ el folio —tilde para el cierre limpio,
 * balanza para el que cerró con diferencia de peso—; éste cuenta que el traslado
 * TODAVÍA ESTÁ EN CURSO, que es lo que un folio abierto significa: el residuo salió
 * de faena y la recepción en destino no está confirmada.
 *
 * No coincide con ningún asset del módulo. Se diffeó contra los 54 por firma
 * normalizada por escala; el más cercano en intención —`WasteNonHazardousWithdrawalsIcon`,
 * el camión del dashboard— tiene otra gramática de path y otra caja.
 */
export function WasteFolioInTransitIcon(props: IconProps) {
  return (
    <svg
      width="17.5"
      height="14"
      viewBox="0 0 17.5 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1.75 2.625C1.75 1.65977 2.53477 0.875 3.5 0.875H11.375C12.3402 0.875 13.125 1.65977 13.125 2.625V3.5H14.5113C14.9762 3.5 15.4219 3.6832 15.75 4.01133L16.9887 5.25C17.3168 5.57812 17.5 6.02383 17.5 6.48867V10.5C17.5 11.4652 16.7152 12.25 15.75 12.25H15.6598C15.3754 13.259 14.4457 14 13.3438 14C12.2418 14 11.3148 13.259 11.0277 12.25H8.22227C7.93789 13.259 7.0082 14 5.90625 14C4.8043 14 3.87734 13.259 3.59023 12.25H3.5C2.53477 12.25 1.75 11.4652 1.75 10.5V9.1875H0.65625C0.292578 9.1875 0 8.89492 0 8.53125C0 8.16758 0.292578 7.875 0.65625 7.875H3.71875C4.08242 7.875 4.375 7.58242 4.375 7.21875C4.375 6.85508 4.08242 6.5625 3.71875 6.5625H0.65625C0.292578 6.5625 0 6.26992 0 5.90625C0 5.54258 0.292578 5.25 0.65625 5.25H5.46875C5.83242 5.25 6.125 4.95742 6.125 4.59375C6.125 4.23008 5.83242 3.9375 5.46875 3.9375H0.65625C0.292578 3.9375 0 3.64492 0 3.28125C0 2.91758 0.292578 2.625 0.65625 2.625H1.75ZM15.75 7.875V6.48867L14.5113 5.25H13.125V7.875H15.75ZM7 11.5938C7 11.3037 6.88477 11.0255 6.67965 10.8204C6.47453 10.6152 6.19633 10.5 5.90625 10.5C5.61617 10.5 5.33797 10.6152 5.13285 10.8204C4.92773 11.0255 4.8125 11.3037 4.8125 11.5938C4.8125 11.8838 4.92773 12.162 5.13285 12.3671C5.33797 12.5723 5.61617 12.6875 5.90625 12.6875C6.19633 12.6875 6.47453 12.5723 6.67965 12.3671C6.88477 12.162 7 11.8838 7 11.5938ZM13.3438 12.6875C13.6338 12.6875 13.912 12.5723 14.1171 12.3671C14.3223 12.162 14.4375 11.8838 14.4375 11.5938C14.4375 11.3037 14.3223 11.0255 14.1171 10.8204C13.912 10.6152 13.6338 10.5 13.3438 10.5C13.0537 10.5 12.7755 10.6152 12.5704 10.8204C12.3652 11.0255 12.25 11.3037 12.25 11.5938C12.25 11.8838 12.3652 12.162 12.5704 12.3671C12.7755 12.5723 13.0537 12.6875 13.3438 12.6875Z"
        fill="currentColor"
      />
    </svg>
  );
}
