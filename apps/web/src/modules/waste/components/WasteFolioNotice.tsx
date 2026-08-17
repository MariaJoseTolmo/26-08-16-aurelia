import type { ReactNode } from 'react';

/**
 * Aviso de una sola frase DENTRO del panel de detalle de un folio SIDREP — nodos
 * `3081:7923` (la alerta de SLA, arriba de la cabecera) y `3081:7968` (el aviso de
 * cierre no confirmado, al pie del cuerpo), los dos de la pestaña "Abiertos".
 *
 * Geometría del design context:
 *
 *   caja   border · rounded-[8px] · w-full
 *   icono  size-[11px], recibe el color por `currentColor`
 *   texto  Inter Regular 11px · flex-1
 *
 * NO ES `WasteNoticeBanner`, y la diferencia no es de gusto: aquél es el banner de
 * ANCHO DE VISTA —`px-[17px] py-[12px]` con texto de 11.5/17.25, o `px-[15px]
 * py-[13px]` con 13/20.15 en su tono `danger`— y éste vive dentro de un panel de
 * 474px, con `px-[13px]` y texto de 11px. Meter estas medidas allá como un cuarto
 * tono habría dejado un componente donde el tono decide tres geometrías distintas y
 * ninguna se lee en el nombre.
 *
 * TAMPOCO ES `WasteWeightDifferenceNotice`, que comparte el ámbar y ocupa el mismo
 * hueco: aquél es un bloque con columna de cifras, línea vertical y tolerancia. Esto
 * es un icono y una frase.
 *
 * EL TONO TRAE SUS MEDIDAS, igual que en `WasteNoticeBanner`, porque los dos nodos
 * difieren de verdad y se preservan tal cual en vez de promediarlos:
 *
 *   `danger`  `3081:7923`  bg #ffd0db · borde #f0a0b0 · texto #570b1d
 *                          gap-[8px] · items-center · px-[13px] py-[10px]
 *                          texto leading-[normal]
 *   `warning` `3081:7968`  bg #fff0e6 · borde #f5c4a0 · texto #6b3a1f
 *                          gap-[9px] · items-start · px-[13px] py-[11px]
 *                          texto leading-[16.5px]
 *
 * EL ALINEADO VERTICAL ES PARTE DEL TONO Y SALE DE LOS NODOS, no de una preferencia.
 * En `3081:7923` el icono cae en `y=17.5` contra un texto de dos líneas que arranca
 * en `y=10`: está centrado. En `3081:7968` icono y texto arrancan los dos en `y=11`,
 * con el texto en tres líneas: va arriba. Con `items-center` en los dos, el aviso
 * ámbar dejaba el glifo flotando a media altura de un párrafo largo.
 *
 * Los anchos de texto de los nodos (390px y 389px) no se reproducen: son la caja de
 * Figma. Con `flex-1` el párrafo ocupa lo que le deja el icono, que es la misma
 * medida y además tolera mensajes más largos.
 *
 * Ninguno de los dos pares es un color nuevo del módulo: el rojo es el de
 * `WasteNoticeBanner` en tono `danger` y el ámbar el de `WasteWeightDifferenceNotice`.
 */

export type WasteFolioNoticeTone = 'danger' | 'warning';

interface WasteFolioNoticeStyles {
  box: string;
  row: string;
  text: string;
}

const TONE_STYLES: Record<WasteFolioNoticeTone, WasteFolioNoticeStyles> = {
  danger: {
    box: 'border-[#f0a0b0] bg-[#ffd0db]',
    row: 'items-center gap-[8px] px-[13px] py-[10px]',
    text: 'leading-[normal] text-[#570b1d]',
  },
  warning: {
    box: 'border-[#f5c4a0] bg-[#fff0e6]',
    row: 'items-start gap-[9px] px-[13px] py-[11px]',
    text: 'leading-[16.5px] text-[#6b3a1f]',
  },
};

interface WasteFolioNoticeProps {
  tone: WasteFolioNoticeTone;
  /**
   * Glifo de la izquierda, ya con su caja de 11 × 11. Recibe el color por
   * `currentColor`: el nodo lo pinta con el MISMO hex que el texto de su tono, así
   * que quien lo pasa repite el color del tono y no introduce uno nuevo.
   */
  icon: ReactNode;
  children: ReactNode;
}

export function WasteFolioNotice({ tone, icon, children }: WasteFolioNoticeProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`w-full rounded-[8px] border border-solid ${styles.box}`}
      data-name="Container"
    >
      <div className={`flex w-full ${styles.row}`}>
        <span className="flex shrink-0">{icon}</span>
        <p
          className={`min-w-px flex-1 font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic ${styles.text}`}
        >
          {children}
        </p>
      </div>
    </div>
  );
}
