import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos del modal "Respaldo de Traslado de Residuo Peligroso" — nodo Figma
 * `3085:13254`, emplazado en `3085:12902`.
 *
 * Misma convención que el resto del módulo: el `.svg` crudo queda versionado junto
 * a este archivo con el id del nodo en el nombre, y acá el `fill` original se
 * reemplaza por `currentColor` para que el color lo defina quien lo usa.
 *
 * EL MODAL TRAE SEIS GLIFOS Y SÓLO TRES SON NUEVOS. Los otros tres ya estaban en el
 * módulo y se importan de donde viven, en vez de duplicarlos:
 *
 *   `3085:13266`  "X" de cierre 32 × 32
 *                 → `WasteWithdrawalModalCloseIcon`, IDÉNTICO byte a byte
 *   `3085:13263`  tilde en círculo 13.75 × 11 de la pastilla "Estado: Cerrado"
 *                 → `WastePerformanceNormalIcon` (11.875 × 9.5), el MISMO glifo:
 *                   su path por 13.75/11.875 = 1.15789 da este, coordenada por
 *                   coordenada
 *   `3085:13323`  flecha "→" 17.5 × 14 entre despachado y recibido
 *                 → `WasteWithdrawalContinueArrowIcon` (15 × 12), el MISMO glifo
 *                   por 17.5/15 = 1.16667
 *
 * El `viewBox` escala solo, así que reusarlos en la caja de este nodo no deforma
 * nada: basta pedirles las dimensiones de acá.
 *
 * Los tres de abajo se diffearon contra los 54 assets del módulo —por path exacto y
 * por firma normalizada por escala— antes de versionarlos.
 */

/**
 * "=" entre el peso recibido y la diferencia, en la banda de pesos. Figma node
 * `3085:13330`. Fill original: #ACACAC.
 *
 * NO es un carácter de texto: el nodo lo dibuja como un vector en caja de 17.5 × 14,
 * la misma que la flecha que tiene al lado, y por eso los dos separadores de la
 * banda miden igual. Escribirlo como "=" lo dejaría con la métrica de la fuente y
 * desalineado respecto de la flecha.
 */
export function WasteFolioSupportEqualsIcon(props: IconProps) {
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
        d="M3.5 3.5C3.01602 3.5 2.625 3.89102 2.625 4.375C2.625 4.85898 3.01602 5.25 3.5 5.25H14C14.484 5.25 14.875 4.85898 14.875 4.375C14.875 3.89102 14.484 3.5 14 3.5H3.5ZM3.5 8.75C3.01602 8.75 2.625 9.14102 2.625 9.625C2.625 10.109 3.01602 10.5 3.5 10.5H14C14.484 10.5 14.875 10.109 14.875 9.625C14.875 9.14102 14.484 8.75 14 8.75H3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Documento de cada fila de "Documentos incluidos en este paquete". Figma node
 * `3085:13344`. Fill original: #24588B.
 *
 * Es una hoja con la esquina doblada, en caja de 13.75 × 11. NO coincide con
 * `figma-4278-15657-draft-form.svg`, el otro documento del módulo: aquél va en
 * 22.5 × 19.125 y su relación de aspecto es distinta (13.75/22.5 = 0.611 contra
 * 11/19.125 = 0.575), así que no es el mismo dibujo reescalado.
 */
export function WasteFolioSupportDocIcon(props: IconProps) {
  return (
    <svg
      width="13.75"
      height="11"
      viewBox="0 0 13.75 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4.20833 0C3.47292 0 2.875 0.616602 2.875 1.375V9.625C2.875 10.3834 3.47292 11 4.20833 11H9.54167C10.2771 11 10.875 10.3834 10.875 9.625V3.66309C10.875 3.29785 10.7354 2.94766 10.4854 2.68984L8.26458 0.401758C8.01458 0.143945 7.67708 0 7.32292 0H4.20833ZM9.65625 3.78125H7.70833C7.43125 3.78125 7.20833 3.55137 7.20833 3.26562V1.25684L9.65625 3.78125Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Glifo del botón "Descargar PDF". Figma node `3085:13419`. Fill original: #333333.
 *
 * Es la misma hoja con esquina doblada del icono de arriba pero con las letras "PDF"
 * recortadas en el borde inferior, y en otra caja (16.25 × 13.9141). Se comprobó que
 * no es el mismo path escalado: el documento de las filas no lleva las letras.
 *
 * El nodo lo emite con `inset-[0_0_-7.03%_0]`, o sea que el dibujo se desborda 7% por
 * abajo de su caja: son las letras, que en el asset quedan fuera del alto declarado.
 * Se conserva con `overflow-visible` en vez de recortarlo, igual que
 * `WasteSidrepWeightIcon`.
 */
export function WasteFolioSupportPdfIcon(props: IconProps) {
  return (
    <svg
      width="16.25"
      height="13.9141"
      viewBox="0 0 16.25 13.9141"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3.25 0C2.35371 0 1.625 0.728711 1.625 1.625V11.375C1.625 12.2713 2.35371 13 3.25 13H5.28125V10.1562C5.28125 9.25996 6.00996 8.53125 6.90625 8.53125H11.375V4.3291C11.375 3.89746 11.2049 3.48359 10.9002 3.17891L8.19355 0.474805C7.88887 0.170117 7.47754 0 7.0459 0H3.25ZM9.88965 4.46875H7.51562C7.17793 4.46875 6.90625 4.19707 6.90625 3.85938V1.48535L9.88965 4.46875ZM6.90625 9.64844C6.62695 9.64844 6.39844 9.87695 6.39844 10.1562V13.4062C6.39844 13.6855 6.62695 13.9141 6.90625 13.9141C7.18555 13.9141 7.41406 13.6855 7.41406 13.4062V12.6953H7.71875C8.55918 12.6953 9.24219 12.0123 9.24219 11.1719C9.24219 10.3314 8.55918 9.64844 7.71875 9.64844H6.90625ZM7.71875 11.6797H7.41406V10.6641H7.71875C7.99805 10.6641 8.22656 10.8926 8.22656 11.1719C8.22656 11.4512 7.99805 11.6797 7.71875 11.6797ZM10.1562 9.64844C9.87695 9.64844 9.64844 9.87695 9.64844 10.1562V13.4062C9.64844 13.6855 9.87695 13.9141 10.1562 13.9141H10.9688C11.6975 13.9141 12.2891 13.3225 12.2891 12.5938V10.9688C12.2891 10.24 11.6975 9.64844 10.9688 9.64844H10.1562ZM10.6641 12.8984V10.6641H10.9688C11.1363 10.6641 11.2734 10.8012 11.2734 10.9688V12.5938C11.2734 12.7613 11.1363 12.8984 10.9688 12.8984H10.6641ZM12.8984 10.1562V13.4062C12.8984 13.6855 13.127 13.9141 13.4062 13.9141C13.6855 13.9141 13.9141 13.6855 13.9141 13.4062V12.2891H14.625C14.9043 12.2891 15.1328 12.0605 15.1328 11.7812C15.1328 11.502 14.9043 11.2734 14.625 11.2734H13.9141V10.6641H14.625C14.9043 10.6641 15.1328 10.4355 15.1328 10.1562C15.1328 9.87695 14.9043 9.64844 14.625 9.64844H13.4062C13.127 9.64844 12.8984 9.87695 12.8984 10.1562Z"
        fill="currentColor"
      />
    </svg>
  );
}
