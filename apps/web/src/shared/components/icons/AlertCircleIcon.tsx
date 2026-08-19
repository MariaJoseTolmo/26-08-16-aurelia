import type { SVGProps } from 'react';

/**
 * Círculo con exclamación, compartido entre módulos.
 *
 * ES EL MISMO GLIFO que Figma exportó tres veces en tres cajas distintas, y la única
 * diferencia entre las tres exportaciones es DÓNDE queda centrado el dibujo:
 *
 *   `1395:4782`   16    × 16   `SprHistoricalAlertIcon`        path desde x=0
 *   `1672:6075`   16.25 × 16   `SprProcessStatusRejectedIcon`  el mismo, +0.124 en x
 *   `4295:24659`  20    × 16   la franja de rechazo de residuos, el mismo, +2 en x
 *
 * Se comparó token a token contra la exportación de 20 × 16: los 160 números coinciden
 * con un desvío máximo de 5e-5 —el redondeo a cinco cifras del exportador— con las Y
 * IDÉNTICAS y las X desplazadas exactamente 2. O sea que NO hay escala: el glifo mide 16
 * × 16 en las tres, y las cajas más anchas sólo lo centran con aire a los costados.
 *
 * POR ESO ACÁ VA LA CAJA DE 16 × 16 Y NO LA DEL NODO. Reproducir el `viewBox` de 20 con
 * el path corrido sería el mismo dibujo escrito una cuarta vez; quien necesite el aire de
 * los costados lo pide con su contenedor —`w-[20px]` centrando un glifo de 16—, que da el
 * mismo píxel y no duplica el path.
 *
 * NO SE PUEDE ESCALAR A CUALQUIER CAJA: el `viewBox` es cuadrado, así que pedirle una
 * caja de otra proporción lo achica o lo deforma según el `preserveAspectRatio`. Se pasa
 * `size-[…]` y el aire se resuelve afuera.
 *
 * VIVE EN `shared/` por lo mismo que `ClockIcon`: lo dibujan `modules/spr` y
 * `modules/waste`, y dejarlo en uno obligaría al otro a importar de un módulo hermano.
 *
 * Los dos componentes de SPR siguen existiendo con su path propio: son nodos verificados
 * uno por uno en su iteración y no se tocan desde acá. Cuando SPR vuelva a pasar por
 * ellos, delegar en este es el movimiento —igual que hicieron los cuatro relojes—.
 */
export function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16ZM8 10C7.73478 10 7.48043 10.1054 7.29289 10.2929C7.10536 10.4804 7 10.7348 7 11C7 11.2652 7.10536 11.5196 7.29289 11.7071C7.48043 11.8946 7.73478 12 8 12C8.26522 12 8.51957 11.8946 8.70711 11.7071C8.89464 11.5196 9 11.2652 9 11C9 10.7348 8.89464 10.4804 8.70711 10.2929C8.51957 10.1054 8.26522 10 8 10ZM8 4C7.43125 4 6.97813 4.48437 7.01875 5.05312L7.25 8.30313C7.27812 8.69688 7.60625 9 7.99687 9C8.39062 9 8.71562 8.69688 8.74375 8.30313L8.975 5.05312C9.01563 4.48437 8.56563 4 7.99375 4H8Z" fill="currentColor" />
    </svg>
  );
}
