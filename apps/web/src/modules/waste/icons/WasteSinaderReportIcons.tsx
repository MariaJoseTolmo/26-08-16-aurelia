import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de la vista "Reporte SINADER", exportados del nodo Figma `3830:65385`
 * del archivo Medio-Ambiente-Core.
 *
 * Misma convención que `WasteDashboardIcons`: el `.svg` crudo queda versionado al
 * lado de este archivo y el `fill` original se reemplaza por `currentColor`, para
 * que el color lo decida quien lo usa. El valor que traía el asset se anota en su
 * comentario.
 *
 * SÓLO HAY DOS GLIFOS NUEVOS. El nodo dibuja cinco assets y los otros tres ya
 * estaban versionados; se comprobó por checksum SHA-1 del `.svg` exportado contra
 * el archivo del repo, no por parecido:
 *
 *   `3830:65725`  flecha de "Exportar"   → `figma-3817-58611-export.svg`
 *   `3830:65728`  caret de "Exportar"    → `figma-3817-58614-export-caret.svg`
 *   `3830:65611`  caret del selector     → `figma-650-141-tbl-caret.svg`
 *
 * Por eso la barra inferior reutiliza `WarehouseExportButton` y el selector de
 * período reutiliza `WarehouseMonthFilterField` en vez de rehacerlos.
 */

/**
 * Flechas circulares del banner "el período sigue en curso". Figma node
 * `3830:65737`. Fill original: #24588B.
 *
 * NO es ninguno de los iconos de aviso que ya tiene el módulo: los tres que
 * existen son un triángulo (`WarehouseOverdueBadgeIcon`), un reloj (`ClockIcon`) y
 * una "i" en círculo (`figma-3564-1405-footer-info.svg`). Éste es un par de
 * flechas de recarga, que es justo lo que dice el mensaje —el consolidado se
 * recalcula solo—, así que se versiona.
 */
export function WasteSinaderNoticeInfoIcon(props: IconProps) {
  return (
    <svg
      width="13.5078"
      height="11.5"
      viewBox="0 0 13.5078 11.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.48408 5.13232C2.78281 3.04346 4.58193 1.4375 6.7539 1.4375C7.94433 1.4375 9.02245 1.92041 9.80409 2.6998C9.80859 2.7043 9.81308 2.70879 9.81757 2.71328L9.98827 2.875H8.9124C8.51484 2.875 8.19365 3.19619 8.19365 3.59375C8.19365 3.99131 8.51484 4.3125 8.9124 4.3125H11.7874C12.185 4.3125 12.5061 3.99131 12.5061 3.59375V0.71875C12.5061 0.321191 12.185 0 11.7874 0C11.3898 0 11.0686 0.321191 11.0686 0.71875V1.91816L10.8148 1.67783C9.7749 0.642383 8.3374 0 6.7539 0C3.85644 0 1.45986 2.14277 1.0623 4.93018C1.00615 5.32324 1.27792 5.68711 1.67099 5.74326C2.06406 5.79941 2.42792 5.52539 2.48408 5.13457V5.13232ZM12.4455 6.56982C12.5017 6.17676 12.2276 5.81289 11.8368 5.75674C11.446 5.70059 11.0799 5.97461 11.0237 6.36543C10.725 8.4543 8.92587 10.0603 6.7539 10.0603C5.56347 10.0603 4.48535 9.57734 3.7037 8.79795C3.69921 8.79346 3.69472 8.78896 3.69023 8.78447L3.51952 8.62275H4.5954C4.99296 8.62275 5.31415 8.30156 5.31415 7.904C5.31415 7.50645 4.99296 7.18525 4.5954 7.18525L1.72265 7.1875C1.53173 7.1875 1.34755 7.26387 1.21279 7.40088C1.07802 7.53789 1.00165 7.71982 1.0039 7.91299L1.02636 10.7655C1.02861 11.1631 1.35429 11.482 1.75185 11.4775C2.14941 11.473 2.46835 11.1496 2.46386 10.7521L2.45488 9.59531L2.69521 9.82217C3.73515 10.8576 5.1704 11.5 6.7539 11.5C9.65136 11.5 12.0479 9.35723 12.4455 6.56982Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Círculo de información del recuadro azul del modal "Marcar período como
 * declarado". Figma node `4319:34793`. Fill original: #0D3862.
 *
 * NO es `WasteSinaderNoticeInfoIcon`: aquél son dos flechas de recarga en caja de
 * 13.508 × 11.5 y éste es una "i" en círculo de 11.5 × 11.5. Se diffearon los
 * paths contra los iconos del módulo y contra los del set del sidebar; no coincide
 * con ninguno.
 *
 * ES EL MISMO GLIFO que usa el correo `4304:31336`, versionado allá en
 * `apps/api/src/modules/messaging/assets/waste-sinader-notice-icon.svg` —
 * verificado por checksum SHA-1—. Son dos copias a propósito: la web no puede
 * importar de la API, y el correo necesita el `.svg` crudo para embeberlo como
 * data URI.
 */
export function WasteSinaderNoticeIcon(props: IconProps) {
  return (
    <svg
      width="11.5"
      height="11.5"
      viewBox="0 0 11.5 11.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5.75 11.5C7.27499 11.5 8.73753 10.8942 9.81586 9.81586C10.8942 8.73753 11.5 7.27499 11.5 5.75C11.5 4.22501 10.8942 2.76247 9.81586 1.68414C8.73753 0.605802 7.27499 0 5.75 0C4.22501 0 2.76247 0.605802 1.68414 1.68414C0.605802 2.76247 0 4.22501 0 5.75C0 7.27499 0.605802 8.73753 1.68414 9.81586C2.76247 10.8942 4.22501 11.5 5.75 11.5ZM5.03125 3.59375C5.03125 3.40313 5.10698 3.22031 5.24177 3.08552C5.37656 2.95073 5.55938 2.875 5.75 2.875C5.94062 2.875 6.12344 2.95073 6.25823 3.08552C6.39302 3.22031 6.46875 3.40313 6.46875 3.59375C6.46875 3.78437 6.39302 3.96719 6.25823 4.10198C6.12344 4.23677 5.94062 4.3125 5.75 4.3125C5.55938 4.3125 5.37656 4.23677 5.24177 4.10198C5.10698 3.96719 5.03125 3.78437 5.03125 3.59375ZM4.85156 5.03125H5.92969C6.22842 5.03125 6.46875 5.27158 6.46875 5.57031V7.54688H6.64844C6.94717 7.54688 7.1875 7.78721 7.1875 8.08594C7.1875 8.38467 6.94717 8.625 6.64844 8.625H4.85156C4.55283 8.625 4.3125 8.38467 4.3125 8.08594C4.3125 7.78721 4.55283 7.54688 4.85156 7.54688H5.39062V6.10938H4.85156C4.55283 6.10938 4.3125 5.86904 4.3125 5.57031C4.3125 5.27158 4.55283 5.03125 4.85156 5.03125Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * "X" de cierre del modal. Figma node `4319:34789`. Fill original: #ACACAC.
 *
 * El módulo ya tiene dos cierres y NINGUNO sirve: `figma-432-6691-close.svg` y
 * `figma-3765-40593-modal-close.svg` van en caja de 32 × 32 y con otro trazo. Éste
 * es 17.5 × 14, y se comprobó por firma normalizada por escala antes de
 * versionarlo.
 */
export function WasteSinaderModalCloseIcon(props: IconProps) {
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
        d="M5.00664 2.00703C4.66484 1.66523 4.10977 1.66523 3.76797 2.00703C3.42617 2.34883 3.42617 2.90391 3.76797 3.2457L7.525 7L3.7707 10.757C3.42891 11.0988 3.42891 11.6539 3.7707 11.9957C4.1125 12.3375 4.66758 12.3375 5.00938 11.9957L8.76367 8.23867L12.5207 11.993C12.8625 12.3348 13.4176 12.3348 13.7594 11.993C14.1012 11.6512 14.1012 11.0961 13.7594 10.7543L10.0023 7L13.7566 3.24297C14.0984 2.90117 14.0984 2.34609 13.7566 2.0043C13.4148 1.6625 12.8598 1.6625 12.518 2.0043L8.76367 5.76133L5.00664 2.00703Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Tilde del botón "Marcar como declarado". Figma node `3830:65731`. Fill original:
 * #ACACAC, que es el gris del botón DESHABILITADO —el único estado que dibuja el
 * nodo, correcto con el período todavía en curso—.
 *
 * El asset se versiona con ese gris, pero el componente emite `currentColor`: el
 * botón habilitado lo pinta blanco sobre `#c8a064`, el mismo par que usan el resto
 * de los primarios del módulo.
 *
 * No coincide con `figma-3713-27396-attached-check.svg`, el otro tilde del módulo:
 * aquél va en caja de 12.5 × 10 y con otro trazo.
 */
export function WasteSinaderMarkDeclaredIcon(props: IconProps) {
  return (
    <svg
      width="15"
      height="12"
      viewBox="0 0 15 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12.4406 1.64297C12.7758 1.88672 12.8508 2.35547 12.607 2.69063L6.60703 10.9406C6.47813 11.1188 6.27891 11.2289 6.05859 11.2477C5.83828 11.2664 5.625 11.1844 5.47031 11.0297L2.47031 8.02969C2.17734 7.73672 2.17734 7.26094 2.47031 6.96797C2.76328 6.675 3.23906 6.675 3.53203 6.96797L5.91094 9.34688L11.3953 1.80703C11.6391 1.47187 12.1078 1.39688 12.443 1.64063L12.4406 1.64297Z"
        fill="currentColor"
      />
    </svg>
  );
}
