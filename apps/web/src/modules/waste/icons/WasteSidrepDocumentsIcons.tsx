import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de "Solicitud de retiro de residuo peligroso" — nodo Figma `3765:39360`.
 *
 * Misma convención que el resto de `modules/waste/icons`: el `.svg` crudo queda
 * versionado al lado con el id del nodo en el nombre y acá el `fill` original se
 * reemplaza por `currentColor`.
 *
 * CUATRO ASSETS DE ESTAS PANTALLAS NO ESTÁN ACÁ porque ya existían. Los dos
 * primeros se detectaron por checksum; los dos últimos NO —son el mismo dibujo
 * exportado en otra caja, así que hubo que comparar los `path` módulo escala—:
 *
 *   `3765:39416`  encabezado "Datos del traslado" → `WarehouseFormOriginIcon`
 *                 (el mismo camión de "Origen del ingreso", `3564:1363`)
 *   `3765:39468`  flecha de "Continuar" → `WasteWithdrawalContinueArrowIcon`
 *                 (mismo archivo que `3765:39070`; solo cambia el `fill`)
 *   `3765:39886`  nube de las fotos del vehículo → `WarehouseFormUploadIcon`
 *                 (el mismo glifo que `3564:1389`, escalado 20/17.5)
 *   `4085:77267`  check del aviso de validación → `WasteWithdrawalSelectedLotIcon`
 *                 (el mismo glifo que `3765:39026`, escalado 14.375/16.875)
 *
 * OJO: `4230:10651`, la nube del ticket de pesaje, SÍ es propia. Mide lo mismo que
 * `3564:1389` (17.5 × 14) pero es otro dibujo — mismo tamaño no implica mismo glifo.
 */

// Encabezado "Peso del residuo". Figma node 4230:10643. Fill original: #131313.
// El `path` se sale del viewBox de 16.875 (llega a 16.89) porque en Figma el nodo
// tiene `overflow: visible`; se conserva con `overflow-visible` para no recortarlo.
export function WasteSidrepWeightIcon(props: IconProps) {
  return (
    <svg width="16.875" height="13.5" viewBox="0 0 16.875 13.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M10.125 0.84375H13.5C13.9667 0.84375 14.3438 1.2208 14.3438 1.6875C14.3438 2.1542 13.9667 2.53125 13.5 2.53125H10.5047C10.3676 3.21152 9.90088 3.77314 9.28125 4.04209V11.8125H13.5C13.9667 11.8125 14.3438 12.1896 14.3438 12.6562C14.3438 13.1229 13.9667 13.5 13.5 13.5H3.375C2.9083 13.5 2.53125 13.1229 2.53125 12.6562C2.53125 12.1896 2.9083 11.8125 3.375 11.8125H7.59375V4.04209C6.97412 3.77051 6.50742 3.20889 6.37031 2.53125H3.375C2.9083 2.53125 2.53125 2.1542 2.53125 1.6875C2.53125 1.2208 2.9083 0.84375 3.375 0.84375H6.75C7.13496 0.332227 7.74668 0 8.4375 0C9.12832 0 9.74004 0.332227 10.125 0.84375ZM11.591 8.4375H15.409L13.5 5.1627L11.591 8.4375ZM13.5 10.9688C11.8415 10.9688 10.4625 10.0723 10.1777 8.88838C10.1092 8.59834 10.2041 8.30039 10.3544 8.04199L12.8646 3.73887C12.9964 3.51211 13.239 3.375 13.5 3.375C13.761 3.375 14.0036 3.51475 14.1354 3.73887L16.6456 8.04199C16.7959 8.30039 16.8908 8.59834 16.8223 8.88838C16.5375 10.0696 15.1585 10.9688 13.5 10.9688ZM3.34336 5.1627L1.43438 8.4375H5.25498L3.34336 5.1627ZM0.0237305 8.88838C-0.0448242 8.59834 0.0500977 8.30039 0.200391 8.04199L2.71055 3.73887C2.84238 3.51211 3.08496 3.375 3.346 3.375C3.60703 3.375 3.84961 3.51475 3.98145 3.73887L6.4916 8.04199C6.64189 8.30039 6.73682 8.59834 6.66826 8.88838C6.3835 10.0696 5.00449 10.9688 3.346 10.9688C1.6875 10.9688 0.308496 10.0723 0.0237305 8.88838Z" fill="currentColor" />
    </svg>
  );
}

// Nube de carga del ticket de pesaje. Figma node 4230:10651. Fill original: #ACACAC.
// Es un glifo NUEVO: se comparó contra todos los `figma-*.svg` del módulo, incluido
// `figma-3564-1389-upload.svg` del formulario de ingreso, también escalado, y
// ninguno coincide.
export function WasteSidrepUploadIcon(props: IconProps) {
  return (
    <svg width="17.5" height="14" viewBox="0 0 17.5 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M4.75 13C2.54167 13 0.75 11.2723 0.75 9.14286C0.75 7.44464 1.88889 6.00357 3.46944 5.48661C3.43333 5.28036 3.41667 5.07143 3.41667 4.85714C3.41667 2.72768 5.20833 1 7.41667 1C8.95556 1 10.2917 1.83839 10.9611 3.06518C11.3556 2.84286 11.8167 2.71429 12.3056 2.71429C13.7778 2.71429 14.9722 3.86607 14.9722 5.28571C14.9722 5.70625 14.8667 6.10536 14.6806 6.45625C15.9028 7 16.75 8.18929 16.75 9.57143C16.75 11.4652 15.1583 13 13.1944 13H4.75ZM9.22222 5.25893C8.96111 5.00714 8.53889 5.00714 8.28056 5.25893L6.28056 7.1875C6.01944 7.43929 6.01944 7.84643 6.28056 8.09554C6.54167 8.34464 6.96389 8.34732 7.22222 8.09554L8.08333 7.26518V10C8.08333 10.3563 8.38056 10.6429 8.75 10.6429C9.11944 10.6429 9.41667 10.3563 9.41667 10V7.26518L10.2778 8.09554C10.5389 8.34732 10.9611 8.34732 11.2194 8.09554C11.4778 7.84375 11.4806 7.43661 11.2194 7.1875L9.21944 5.25893H9.22222Z" fill="currentColor" />
    </svg>
  );
}

// Encabezado "Documentos obligatorios". Figma node 3765:39847. Fill original: #131313.
export function WasteSidrepRequiredDocsIcon(props: IconProps) {
  return (
    <svg width="16.875" height="13.5" viewBox="0 0 16.875 13.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.375 1.6875C3.375 0.756738 4.13174 0 5.0625 0H9.00439C9.45264 0 9.88242 0.17666 10.1988 0.493066L13.0069 3.30381C13.3233 3.62021 13.5 4.05 13.5 4.49824V11.8125C13.5 12.7433 12.7433 13.5 11.8125 13.5H5.0625C4.13174 13.5 3.375 12.7433 3.375 11.8125V1.6875ZM8.85938 1.54248V4.00781C8.85938 4.3585 9.1415 4.64062 9.49219 4.64062H11.9575L8.85938 1.54248ZM6.53906 6.75C6.18838 6.75 5.90625 7.03213 5.90625 7.38281C5.90625 7.7335 6.18838 8.01562 6.53906 8.01562H10.3359C10.6866 8.01562 10.9688 7.7335 10.9688 7.38281C10.9688 7.03213 10.6866 6.75 10.3359 6.75H6.53906ZM6.53906 9.28125C6.18838 9.28125 5.90625 9.56338 5.90625 9.91406C5.90625 10.2647 6.18838 10.5469 6.53906 10.5469H10.3359C10.6866 10.5469 10.9688 10.2647 10.9688 9.91406C10.9688 9.56338 10.6866 9.28125 10.3359 9.28125H6.53906Z" fill="currentColor" />
    </svg>
  );
}
