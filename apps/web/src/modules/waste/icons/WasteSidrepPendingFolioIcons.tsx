import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de la pestaña "Pendientes de revisión" de "Folios SIDREP" — nodo Figma
 * `3073:5688` del archivo Medio-Ambiente-Core.
 *
 * Misma convención que el resto del módulo: el `.svg` crudo queda versionado al
 * lado de este archivo con el id del nodo en el nombre, y acá el `fill` original se
 * reemplaza por `currentColor` para que el color lo decida quien lo usa.
 *
 * EL NODO DIBUJA SIETE GLIFOS Y NINGUNO ES UN SÍMBOLO NUEVO. Los siete se
 * compararon contra los 61 assets versionados de `apps/web/src` por firma del path
 * NORMALIZADA POR ESCALA —cada coordenada dividida por el ancho de la caja— y no
 * por parecido visual. Seis se reusan tal cual:
 *
 *   `3073:5924`  glifo "peligroso" 17.5 × 14 de la casilla → `WarehouseHazardousIcon`
 *                (12.5 × 10, el mismo path por 1.4)
 *   `3073:5936`  chevron 13.75 × 11 de la fila            → `WarehousePageNextIcon`
 *                (12.5 × 10, por 1.1)
 *   `3073:5974`  reloj 13.75 × 11 de la alerta de SLA     → `ClockIcon` compartido
 *                (17.5 × 14, por 0.785714)
 *   `3073:6029`  documento 13.75 × 11 del adjunto         → `WasteFolioSupportDocIcon`
 *                (idéntico, misma caja)
 *   `3073:6085`  "X" 15 × 12 de "Rechazar"                → `WasteSinaderModalCloseIcon`
 *                (17.5 × 14, por 0.857143)
 *   `3073:6089`  tilde 15 × 12 de "Aprobar"               → `WasteSinaderMarkDeclaredIcon`
 *                (idéntico, misma caja)
 *
 * El `viewBox` escala solo, así que pedirles la caja de este nodo no los deforma.
 *
 * EL SÉPTIMO ES EL MISMO GLIFO QUE `WastePerformanceNormalIcon` REENCUADRADO, y por
 * eso se versiona igual: ver `WasteFolioVerifiedIcon`.
 */

/**
 * Tilde en círculo del aviso VERDE de verificación — nodo `3073:6019`. Fill
 * original: #2A5C16, sobre fondo `#e0ffd3`.
 *
 * NO ES UN SÍMBOLO NUEVO: es exactamente el mismo dibujo que
 * `WastePerformanceNormalIcon` (`3830:63871`, 11.875 × 9.5) con OTRA CAJA. Aquel
 * export deja 1.1875 de aire a cada lado y el círculo mide 9.5 de diámetro; éste lo
 * dibuja a sangre, círculo de 11 en una caja de 11 × 11. Verificado coordenada por
 * coordenada: trasladando el path de aquél en −1.1875 en x y escalándolo por
 * 11/9.5 = 1.157895 sale éste (5.9375 → 5.5, 4.67772 → 4.04131, 8.12695 → 8.03516,
 * 8.99956 → 10.4205), con el mismo `fill`.
 *
 * SE VERSIONA IGUAL EN VEZ DE REUSAR EL OTRO, y es una decisión de fidelidad, no de
 * comodidad. Los iconos del módulo van con `preserveAspectRatio="none"`, así que la
 * caja del `viewBox` se estira a la caja pedida: con `WastePerformanceNormalIcon` no
 * hay tamaño que dé un círculo REDONDO de 11px pegado al borde izquierdo —para que
 * el círculo salga redondo hace falta `w-[13.75px]`, y entonces quedan 1.375px de
 * aire a la izquierda que corren el glifo y el texto del aviso—. El nodo lo dibuja
 * a sangre en 11 × 11.
 */
export function WasteFolioVerifiedIcon(props: IconProps) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5.5 11C4.04131 11 2.64236 10.4205 1.61091 9.38909C0.579463 8.35764 0 6.95869 0 5.5C0 4.04131 0.579463 2.64236 1.61091 1.61091C2.64236 0.579463 4.04131 0 5.5 0C6.95869 0 8.35764 0.579463 9.38909 1.61091C10.4205 2.64236 11 4.04131 11 5.5C11 6.95869 10.4205 8.35764 9.38909 9.38909C8.35764 10.4205 6.95869 11 5.5 11ZM8.03516 3.13027C7.80527 2.9627 7.48301 3.01426 7.31543 3.24414L4.7502 6.77188L3.63086 5.65254C3.42891 5.45059 3.10234 5.45059 2.90254 5.65254C2.70273 5.85449 2.70059 6.18105 2.90254 6.38086L4.44941 7.92773C4.55684 8.03516 4.70293 8.08887 4.85332 8.07812C5.00371 8.06738 5.14121 7.99004 5.2293 7.86758L8.14902 3.85C8.3166 3.62012 8.26504 3.29785 8.03516 3.13027Z"
        fill="currentColor"
      />
    </svg>
  );
}
