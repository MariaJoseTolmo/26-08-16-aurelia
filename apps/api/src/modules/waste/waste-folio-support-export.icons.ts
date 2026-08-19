/**
 * Glifos del "Respaldo de Traslado de Residuo Peligroso" — nodo Figma `3084:11044`.
 *
 * Se dibujan con `doc.path()` sobre un `save()/translate()/scale()/restore()`, el mismo
 * patrón que `inspection-periodic-report-pdf-alert-icon-fidelity.service.ts` usa para
 * los iconos de sus tarjetas. Por eso cada entrada trae su caja de origen: el path está
 * en las coordenadas de su `viewBox`, y la escala sale de dividir la caja del nodo por
 * esa caja de origen.
 *
 * LOS CUATRO YA EXISTEN EN EL FRONT, versionados como `.svg` junto a los componentes del
 * módulo, y se compararon path por path —normalizando por escala— antes de copiarlos acá:
 *
 *   `check`   `3084:11067`  13.75 × 11     pastilla "Estado: Cerrado"
 *                           = `figma-3830-63871-status-normal.svg` (11.875 × 9.5)
 *   `arrow`   `3084:11140`  17.5 × 14      despachado → recibido
 *                           = `figma-3765-39070-continue-arrow.svg` (15 × 12)
 *   `equals`  `3084:11150`  17.5 × 14      recibido = diferencia
 *                           = `figma-3085-13330-weights-equals.svg` (17.5 × 14), idéntico
 *   `tick`    `3084:11174`  15.625 × 12.5  viñeta de cada documento del paquete
 *                           = `figma-3830-65731-mark-declared.svg` (15 × 12)
 *
 * ESTÁN DUPLICADOS A PROPÓSITO y no importados: la API no puede importar de la web, y
 * cargarlos como `.svg` desde `assets/` obligaría a parsear el archivo para sacar el
 * `d`. Con el path como constante, el documento no depende de leer disco.
 *
 * OJO CON LA VIÑETA DEL PAQUETE: en el PDF es un TILDE, no la hoja de papel que usa el
 * modal en pantalla. Se verificó contra el asset del nodo, no se asumió por analogía.
 */

export interface FolioSupportIcon {
  /** Datos del `d` del path, en las coordenadas de `box`. */
  path: string;
  /** Caja de origen del path, en px. La escala se calcula contra la caja de destino. */
  box: { width: number; height: number };
}

export const FOLIO_SUPPORT_ICONS = {
  check: {
    path: 'M6.875 11C5.41631 11 4.01736 10.4205 2.98591 9.38909C1.95446 8.35764 1.375 6.95869 1.375 5.5C1.375 4.04131 1.95446 2.64236 2.98591 1.61091C4.01736 0.579463 5.41631 0 6.875 0C8.33369 0 9.73264 0.579463 10.7641 1.61091C11.7955 2.64236 12.375 4.04131 12.375 5.5C12.375 6.95869 11.7955 8.35764 10.7641 9.38909C9.73264 10.4205 8.33369 11 6.875 11ZM9.41016 3.13027C9.18027 2.9627 8.85801 3.01426 8.69043 3.24414L6.1252 6.77188L5.00586 5.65254C4.80391 5.45059 4.47734 5.45059 4.27754 5.65254C4.07773 5.85449 4.07559 6.18105 4.27754 6.38086L5.82441 7.92773C5.93184 8.03516 6.07793 8.08887 6.22832 8.07812C6.37871 8.06738 6.51621 7.99004 6.6043 7.86758L9.52402 3.85C9.6916 3.62012 9.64004 3.29785 9.41016 3.13027Z',
    box: { width: 13.75, height: 11 },
  },
  arrow: {
    path: 'M15.493 7.61797C15.8348 7.27617 15.8348 6.72109 15.493 6.3793L11.118 2.0043C10.7762 1.6625 10.2211 1.6625 9.8793 2.0043C9.5375 2.34609 9.5375 2.90117 9.8793 3.24297L12.7613 6.125H2.625C2.14102 6.125 1.75 6.51602 1.75 7C1.75 7.48398 2.14102 7.875 2.625 7.875H12.7613L9.8793 10.757C9.5375 11.0988 9.5375 11.6539 9.8793 11.9957C10.2211 12.3375 10.7762 12.3375 11.118 11.9957L15.493 7.6207V7.61797Z',
    box: { width: 17.5, height: 14 },
  },
  equals: {
    path: 'M3.5 3.5C3.01602 3.5 2.625 3.89102 2.625 4.375C2.625 4.85898 3.01602 5.25 3.5 5.25H14C14.484 5.25 14.875 4.85898 14.875 4.375C14.875 3.89102 14.484 3.5 14 3.5H3.5ZM3.5 8.75C3.01602 8.75 2.625 9.14102 2.625 9.625C2.625 10.109 3.01602 10.5 3.5 10.5H14C14.484 10.5 14.875 10.109 14.875 9.625C14.875 9.14102 14.484 8.75 14 8.75H3.5Z',
    box: { width: 17.5, height: 14 },
  },
  tick: {
    path: 'M12.959 1.71143C13.3081 1.96533 13.3862 2.45361 13.1323 2.80273L6.88232 11.3965C6.74805 11.582 6.54053 11.6968 6.31104 11.7163C6.08154 11.7358 5.85938 11.6504 5.69824 11.4893L2.57324 8.36426C2.26807 8.05908 2.26807 7.56348 2.57324 7.2583C2.87842 6.95312 3.37402 6.95312 3.6792 7.2583L6.15723 9.73633L11.8701 1.88232C12.124 1.5332 12.6123 1.45508 12.9614 1.70898L12.959 1.71143Z',
    box: { width: 15.625, height: 12.5 },
  },
} as const satisfies Record<string, FolioSupportIcon>;
