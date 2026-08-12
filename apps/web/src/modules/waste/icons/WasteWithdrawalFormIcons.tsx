import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos del formulario "Nueva solicitud de retiro" — nodo Figma `3765:38863`.
 *
 * Misma convención que `WarehouseIntakeFormIcons`: el `.svg` crudo queda
 * versionado junto a este archivo con el id del nodo en el nombre, y acá el
 * `fill` original se reemplaza por `currentColor` para que el color lo ponga
 * quien lo usa.
 *
 * Se comparó por checksum contra los cuatro iconos de sección que ya existen
 * (`3564:1363`, `3713:26851`, `3713:26887`, `3564:1380`) y contra el resto de
 * `modules/waste/icons`: la lupa no estaba, así que se extrae. Comparte con ellos
 * la caja de 16.875 × 13.5, que es la del Heading 3 de `WarehouseFormCard`.
 *
 * TRES GLIFOS DE ESTAS PANTALLAS NO ESTÁN ACÁ PORQUE YA EXISTÍAN EN EL PROYECTO.
 * Se detectaron comparando los `path` de todos los `figma-*.svg` del repo módulo
 * escala, no por checksum —que no ve un mismo dibujo exportado en otra caja—:
 *
 *   `3765:40598`  lupa del buscador del modal  → `WasteWithdrawalSectionIcon`
 *                 (el mismo glifo que `3765:38877`, escalado 20/16.875)
 *   `3765:39062`  encabezado del aviso SIDREP  → `WarehouseHazardousIcon`
 *                 (el mismo glifo que la pastilla "Peligroso", escalado 1.35)
 *   `4085:77267`  check del aviso de validación → `WasteWithdrawalSelectedLotIcon`
 *                 (el mismo glifo que `3765:39026`, escalado 14.375/16.875)
 *
 * Todas las cajas del sistema tienen razón 1.25, así que reescalar por CSS no
 * deforma nada: alcanza con pasar otro `h-` y `w-`.
 *
 * LOS ICONOS DE FILA DEL MODAL NO ESTÁN ACÁ Y NO DEBEN ESTARLO. Los nodos
 * `3765:40606` (RESPEL) y `3765:40642` / `3765:40660` (LODOS y GRASAS, que además
 * son el mismo archivo) son EXACTAMENTE los glifos de `WarehouseHazardousIcon` y
 * `WarehouseNonHazardousIcon` escalados 1.3× —16.25 × 13 contra 12.5 × 10—. Se
 * verificó comparando los 155 y 110 coeficientes de cada `path`: la razón es
 * 1.30000 constante. El `viewBox` ya escala solo, así que se reutilizan esos dos
 * componentes con otra caja en vez de duplicar el asset.
 */

// Encabezado "Residuo a retirar". Figma node 3765:38877. Fill original: #131313.
// El alto natural es 13.502, no 13.5 como los otros cuatro iconos de sección:
// se respeta el del asset para no deformar el glifo.
export function WasteWithdrawalSectionIcon(props: IconProps) {
  return (
    <svg width="16.875" height="13.502" viewBox="0 0 16.875 13.502" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M12.6562 5.48438C12.6562 6.69463 12.2634 7.8126 11.6016 8.71963L14.9396 12.0604C15.2692 12.3899 15.2692 12.9252 14.9396 13.2548C14.6101 13.5844 14.0748 13.5844 13.7452 13.2548L10.4071 9.91406C9.5001 10.5759 8.38213 10.9688 7.17188 10.9688C4.14229 10.9688 1.6875 8.51396 1.6875 5.48438C1.6875 2.45479 4.14229 0 7.17188 0C10.2015 0 12.6562 2.45479 12.6562 5.48438ZM7.17188 9.28125C7.67049 9.28125 8.16422 9.18304 8.62488 8.99223C9.08553 8.80142 9.5041 8.52174 9.85667 8.16917C10.2092 7.8166 10.4889 7.39803 10.6797 6.93738C10.8705 6.47672 10.9688 5.98299 10.9688 5.48438C10.9688 4.98576 10.8705 4.49203 10.6797 4.03137C10.4889 3.57072 10.2092 3.15215 9.85667 2.79958C9.5041 2.44701 9.08553 2.16733 8.62488 1.97652C8.16422 1.78571 7.67049 1.6875 7.17188 1.6875C6.67326 1.6875 6.17953 1.78571 5.71887 1.97652C5.25822 2.16733 4.83965 2.44701 4.48708 2.79958C4.13451 3.15215 3.85483 3.57072 3.66402 4.03137C3.47321 4.49203 3.375 4.98576 3.375 5.48438C3.375 5.98299 3.47321 6.47672 3.66402 6.93738C3.85483 7.39803 4.13451 7.8166 4.48708 8.16917C4.83965 8.52174 5.25822 8.80142 5.71887 8.99223C6.17953 9.18304 6.67326 9.28125 7.17188 9.28125Z" fill="currentColor" />
    </svg>
  );
}

// "Close" del modal de selección. Figma node 3765:40593. Fill original: black.
// El asset viene como la caja COMPLETA de 32 × 32 con la cruz de ~13.5px
// centrada, así que se renderiza a 32 × 32 —el tamaño del botón— y no se recorta.
// No es el mismo glifo que `figma-432-6691-close.svg`: se comparó el `path` y la
// cruz de este es más fina y con otras terminaciones.
export function WasteWithdrawalModalCloseIcon(props: IconProps) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M21.5301 9.52771C21.7889 9.26898 22.2145 9.26898 22.4733 9.52771C22.732 9.78645 22.732 10.2121 22.4733 10.4709L16.9438 16.0003L22.4733 21.5298C22.732 21.7885 22.732 22.2142 22.4733 22.4729C22.2145 22.7317 21.7889 22.7317 21.5301 22.4729L16.0007 16.9435L10.4754 22.4729C10.2166 22.7317 9.79095 22.7317 9.53221 22.4729C9.27347 22.2142 9.27347 21.7885 9.53221 21.5298L15.0575 16.0003L9.52804 10.4709C9.2693 10.2121 9.2693 9.78645 9.52804 9.52771C9.78678 9.26898 10.2124 9.26898 10.4712 9.52771L16.0007 15.0572L21.5301 9.52771Z" fill="currentColor" />
    </svg>
  );
}

// Encabezado "Lote seleccionado". Figma node 3765:39026. Fill original: #131313.
export function WasteWithdrawalSelectedLotIcon(props: IconProps) {
  return (
    <svg width="16.875" height="13.5" viewBox="0 0 16.875 13.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M8.4375 13.5C6.64729 13.5 4.9304 12.7888 3.66453 11.523C2.39866 10.2571 1.6875 8.54021 1.6875 6.75C1.6875 4.95979 2.39866 3.2429 3.66453 1.97703C4.9304 0.711159 6.64729 0 8.4375 0C10.2277 0 11.9446 0.711159 13.2105 1.97703C14.4763 3.2429 15.1875 4.95979 15.1875 6.75C15.1875 8.54021 14.4763 10.2571 13.2105 11.523C11.9446 12.7888 10.2277 13.5 8.4375 13.5ZM11.5488 3.8417C11.2667 3.63604 10.8712 3.69932 10.6655 3.98145L7.51729 8.31094L6.14355 6.93721C5.8957 6.68936 5.49492 6.68936 5.24971 6.93721C5.00449 7.18506 5.00186 7.58584 5.24971 7.83105L7.14814 9.72949C7.27998 9.86133 7.45928 9.92725 7.64385 9.91406C7.82842 9.90088 7.99717 9.80596 8.10527 9.65566L11.6886 4.725C11.8942 4.44287 11.831 4.04736 11.5488 3.8417Z" fill="currentColor" />
    </svg>
  );
}

// Flecha del botón "Continuar a documentos SIDREP". Figma node 3765:39070.
// Fill original #ACACAC porque el nodo dibuja el botón DESHABILITADO; el color lo
// pone quien lo usa según el estado.
export function WasteWithdrawalContinueArrowIcon(props: IconProps) {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M13.2797 6.52969C13.5727 6.23672 13.5727 5.76094 13.2797 5.46797L9.52969 1.71797C9.23672 1.425 8.76094 1.425 8.46797 1.71797C8.175 2.01094 8.175 2.48672 8.46797 2.77969L10.9383 5.25H2.25C1.83516 5.25 1.5 5.58516 1.5 6C1.5 6.41484 1.83516 6.75 2.25 6.75H10.9383L8.46797 9.22031C8.175 9.51328 8.175 9.98906 8.46797 10.282C8.76094 10.575 9.23672 10.575 9.52969 10.282L13.2797 6.53203V6.52969Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Documento con lápiz del aviso de borrador — nodo `4278:15657`. Fill original:
 * `#463100`, el mismo marrón del rótulo "Pasos 1/3" que lo acompaña.
 *
 * Es el ÚNICO glifo nuevo del aviso `4278:15644`: la campana del encabezado y el
 * chevrón de la fila ya existían en el proyecto —ver `BellIcon` y
 * `WarehousePageNextIcon`—. Se verificó comparando los `path` de los 307 iconos del
 * repo módulo escala; este no tiene equivalente.
 *
 * SU CAJA ES 22.5 × 19.125 Y NO 22.5 × 18. El nodo dibuja la caja en 18 de alto y
 * mete el dibujo en `inset-[0_0_-6.25%_0]`, o sea desbordándola 1.125px por abajo:
 * el lápiz sobresale de la hoja. Se conserva el `viewBox` completo del asset —que es
 * el dibujo real— y quien lo usa le da los 22.5 × 18 del nodo; recortarlo a 18 le
 * comería la punta al lápiz.
 */
export function WasteWithdrawalDraftFormIcon(props: IconProps) {
  return (
    <svg width="22.5" height="19.125" viewBox="0 0 22.5 19.125" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M4.5 0C3.25898 0 2.25 1.00898 2.25 2.25V15.75C2.25 16.991 3.25898 18 4.5 18H9.63984L10.023 16.084C10.1742 15.3211 10.5504 14.6215 11.0988 14.073L15.7465 9.42539V5.99766C15.7465 5.4 15.5109 4.82695 15.0891 4.40508L11.3449 0.657422C10.923 0.235547 10.35 0 9.75586 0H4.5ZM13.6934 6.1875H10.4062C9.93867 6.1875 9.5625 5.81133 9.5625 5.34375V2.05664L13.6934 6.1875ZM11.6789 16.4145L11.2605 18.5098C11.2535 18.5414 11.25 18.5766 11.25 18.6117C11.25 18.893 11.4785 19.125 11.7633 19.125C11.7984 19.125 11.8301 19.1215 11.8652 19.1145L13.9605 18.6961C14.3965 18.6082 14.7973 18.3937 15.1102 18.0809L19.2902 13.9008L16.4777 11.0883L12.2977 15.2684C11.9848 15.5812 11.7703 15.982 11.6824 16.418L11.6789 16.4145ZM21.0938 12.0902C21.8707 11.3133 21.8707 10.0547 21.0938 9.27773C20.3168 8.50078 19.0582 8.50078 18.2812 9.27773L17.2687 10.2902L20.0812 13.1027L21.0938 12.0902Z" fill="currentColor" />
    </svg>
  );
}
