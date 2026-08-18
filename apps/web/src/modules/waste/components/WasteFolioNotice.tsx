import type { ReactNode } from 'react';

/**
 * Aviso de una sola frase DENTRO del panel de detalle de un folio SIDREP — nodos
 * `3081:7923` (la alerta de SLA, arriba de la cabecera) y `3081:7968` (el aviso de
 * cierre no confirmado, al pie del cuerpo) de la pestaña "Abiertos", más
 * `3073:5973` (la alerta de SLA) y `3073:6018` (la verificación contra la
 * resolución sanitaria) de "Pendientes de revisión".
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
 * EL COLOR Y LA GEOMETRÍA SON DOS EJES Y NO UNO, y eso lo obligaron los nodos. Con
 * los dos primeros —`3081:7923` rojo y compacto, `3081:7968` ámbar y holgado— un
 * solo eje alcanzaba; `3073:5973` rompe la coincidencia: es ÁMBAR con la geometría
 * COMPACTA del rojo. Un tercer valor de `tone` habría dejado dos entradas con el
 * mismo color y distinto padding, o sea el mismo tono nombrado dos veces.
 *
 * Los tres pares de color salen de nodos concretos y ninguno es nuevo en el módulo:
 *
 *   `danger`   `3081:7923`  bg #ffd0db · borde #f0a0b0 · texto #570b1d
 *                           el mismo rojo de `WasteNoticeBanner` en tono `danger`
 *   `warning`  `3081:7968`  bg #fff0e6 · borde #f5c4a0 · texto #6b3a1f
 *              `3073:5973`  el mismo ámbar de `WasteWeightDifferenceNotice`
 *   `success`  `3073:6018`  bg #e0ffd3 · borde #a8dfa8 · texto #2a5c16
 *                           el mismo verde de `WastePerformanceNormalIcon` y de las
 *                           notas "normal" del panel de desempeño de empresas
 *
 * LA DENSIDAD ES CUÁNTAS LÍNEAS ESCRIBE EL AVISO, y también sale de los nodos:
 *
 *   `single`     `3081:7923` · `3073:5973`  gap-[8px] · items-center
 *                px-[13px] py-[10px] · texto leading-[normal]
 *   `multiline`  `3081:7968` · `3073:6018`  gap-[9px] · items-start
 *                px-[13px] py-[11px] · texto leading-[16.5px]
 *
 * EL ALINEADO VERTICAL VA CON LA DENSIDAD Y NO ES UNA PREFERENCIA. En `3081:7923` el
 * icono cae en `y=17.5` contra un texto que arranca en `y=10`: está centrado. En
 * `3081:7968` icono y texto arrancan los dos en `y=11`, con el texto en tres líneas:
 * va arriba. Con `items-center` en un párrafo largo el glifo queda flotando a media
 * altura, y con `items-start` en una sola línea queda alto.
 *
 * Los anchos de texto de los nodos (390px, 389px, 343px) no se reproducen: son la
 * caja de Figma. Con `flex-1` el párrafo ocupa lo que le deja el icono, que es la
 * misma medida y además tolera mensajes más largos.
 */

export type WasteFolioNoticeTone = 'danger' | 'warning' | 'success';

const TONE_STYLES: Record<WasteFolioNoticeTone, { box: string; text: string }> = {
  danger: { box: 'border-[#f0a0b0] bg-[#ffd0db]', text: 'text-[#570b1d]' },
  warning: { box: 'border-[#f5c4a0] bg-[#fff0e6]', text: 'text-[#6b3a1f]' },
  success: { box: 'border-[#a8dfa8] bg-[#e0ffd3]', text: 'text-[#2a5c16]' },
};

/** Ver el bloque de arriba: `single` es el aviso de una línea; `multiline`, el de varias. */
export type WasteFolioNoticeDensity = 'single' | 'multiline';

const DENSITY_STYLES: Record<WasteFolioNoticeDensity, { row: string; text: string }> = {
  single: { row: 'items-center gap-[8px] px-[13px] py-[10px]', text: 'leading-[normal]' },
  multiline: { row: 'items-start gap-[9px] px-[13px] py-[11px]', text: 'leading-[16.5px]' },
};

interface WasteFolioNoticeProps {
  tone: WasteFolioNoticeTone;
  /**
   * Por defecto `single`, que es la forma de la alerta que abre el panel en las dos
   * pestañas. Los avisos de párrafo la piden explícita.
   */
  density?: WasteFolioNoticeDensity;
  /**
   * Glifo de la izquierda, ya con su caja —11 × 11 en tres de los cuatro nodos,
   * 13.75 × 11 en el reloj de `3073:5974`—. Recibe el color por `currentColor`: el
   * nodo lo pinta con el MISMO hex que el texto de su tono, así que quien lo pasa
   * repite el color del tono y no introduce uno nuevo.
   */
  icon: ReactNode;
  children: ReactNode;
}

export function WasteFolioNotice({
  tone,
  density = 'single',
  icon,
  children,
}: WasteFolioNoticeProps) {
  const color = TONE_STYLES[tone];
  const geometry = DENSITY_STYLES[density];

  return (
    <div
      className={`w-full rounded-[8px] border border-solid ${color.box}`}
      data-name="Container"
    >
      <div className={`flex w-full ${geometry.row}`}>
        <span className="flex shrink-0">{icon}</span>
        <p
          className={`min-w-px flex-1 font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic ${geometry.text} ${color.text}`}
        >
          {children}
        </p>
      </div>
    </div>
  );
}
