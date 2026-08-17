/**
 * Recuadro "Diferencia de peso" del panel de detalle de un folio SIDREP — nodo
 * `3437:3362`.
 *
 * Aparece SÓLO cuando el peso recibido en destino no coincide con el despachado:
 * pone la brecha adelante —en kilos y en porcentaje— y al lado la tolerancia
 * esperada para ese tipo de residuo, que es el dato con el que se decide si la
 * diferencia es normal o hay que reclamarla.
 *
 * Geometría del design context:
 *
 *   caja       bg #fff0e6 · border #f5c4a0 · rounded-[8px]
 *              flex gap-[8px] items-start · px-[17px] py-[13px]
 *   columna    w-[62px] · flex flex-col gap-[4px] items-start
 *   rótulo     Inter Semi Bold 11.5px · #6b3a1f · dos líneas
 *   brecha     Inter Bold 18px · #6b3a1f · text-right
 *   porcentaje Inter Bold 10px · negro · text-right
 *   línea      `3437:3370` · 1px vertical · stroke #f5c4a0 · 66px de alto
 *   despachado Inter Regular 10.5px · negro · opacity-80
 *   tolerancia pt-[3px] · Inter Regular 10px · negro · opacity-85
 *
 * EL `w-[62px]` DE LA COLUMNA SÍ SE REPRODUCE, y es la excepción a la regla del
 * brief. No es la caja de texto de Figma: es el ancho que hace que "Diferencia de
 * peso" caiga en DOS líneas, y el nodo lo confirma dándole 28px de alto al rótulo
 * —dos líneas de 11.5px— y 66 a la columna entera. Sin ese ancho el rótulo se
 * estira a una línea, la columna se ensancha y la línea vertical se corre.
 *
 * LA LÍNEA VERTICAL NO ES UN ASSET. El nodo la exporta como un `<line>` de 1px con
 * `stroke #f5c4a0` rotado 90°, que es el MISMO color del borde de la caja. Va como
 * un `div` de `w-px` con `self-stretch`: en un contenedor `items-start` eso le da
 * exactamente los 66px de la columna, sin rotaciones ni `containerType`.
 *
 * La caja de valores va `w-fit` en vez de los 46px del nodo: 46 es el ancho del
 * texto "20kg" en Inter Bold 18px, y es lo que hace que el porcentaje se alinee a
 * la derecha de la BRECHA y no del borde de la columna. Con `w-fit` el ancho lo da
 * el hijo más ancho y el alineado sale igual con cualquier cifra.
 *
 * Los `opacity-80` / `opacity-85` son del nodo (`3437:3372` y `3437:3375`) y se
 * conservan tal cual en vez de resolverlos a un color plano: es lo que declara el
 * diseño, igual que en `WasteSidrepReviewWeightSection`.
 */

/** Texto del nodo `3437:3364`. */
export const WASTE_WEIGHT_DIFFERENCE_LABEL = 'Diferencia de peso';

interface WasteWeightDifferenceNoticeProps {
  /** Brecha ya formateada, como la escribe el nodo `3437:3367`: "20kg". */
  difference: string;
  /** Brecha en porcentaje, con coma decimal: "3,3%". Nodo `3437:3369`. */
  percentage: string;
  /** Peso de salida: "Despachado 610 kg". Nodo `3437:3373`. */
  dispatched: string;
  /**
   * Tolerancia esperada para el tipo de residuo, con su procedencia — el nodo
   * `3437:3376` cierra con "· histórico general por tipo de residuo" para que se
   * sepa que el umbral no es de este folio.
   */
  tolerance: string;
}

export function WasteWeightDifferenceNotice({
  difference,
  percentage,
  dispatched,
  tolerance,
}: WasteWeightDifferenceNoticeProps) {
  return (
    <div
      className="flex w-full items-start gap-[8px] rounded-[8px] border border-solid border-[#f5c4a0] bg-[#fff0e6] px-[17px] py-[13px]"
      data-name="Container"
    >
      <div className="flex w-[62px] shrink-0 flex-col items-start gap-[4px]">
        <p className="w-full font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold not-italic leading-[normal] text-[#6b3a1f]">
          {WASTE_WEIGHT_DIFFERENCE_LABEL}
        </p>
        <div className="flex w-fit flex-col items-end">
          <p className="whitespace-nowrap text-right font-['Inter:Bold',sans-serif] text-[18px] font-bold not-italic leading-[normal] text-[#6b3a1f]">
            {difference}
          </p>
          <p className="whitespace-nowrap text-right font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] text-black">
            {percentage}
          </p>
        </div>
      </div>

      <div aria-hidden className="w-px shrink-0 self-stretch bg-[#f5c4a0]" data-name="Line 875" />

      <div className="flex min-w-px flex-1 flex-col items-start gap-[4px]">
        <p className="w-full font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-black opacity-80">
          {dispatched}
        </p>
        <div className="w-full pt-[3px]">
          <p className="w-full font-['Inter:Regular',sans-serif] text-[10px] font-normal not-italic leading-[normal] text-black opacity-85">
            {tolerance}
          </p>
        </div>
      </div>
    </div>
  );
}
