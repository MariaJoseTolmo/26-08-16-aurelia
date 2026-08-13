import { WasteKpiTrendUpIcon } from '../icons/WasteDashboardIcons';

/**
 * Tarjeta de KPI del módulo de residuos.
 *
 * El mismo bloque aparece con geometría IDÉNTICA en dos vistas:
 *
 *   `3686:25708`  Control de bodega   (fila `3686:25707`, gap 16)
 *   `3086:13812`  Dashboard Residuos  (fila `3086:13811`, gap 14)
 *
 *   tarjeta   bg white · border #e3e3e3 · rounded-[10px]
 *             interior flex flex-col items-start px-[19px] py-[17px]
 *   rótulo    Inter Semi Bold 11px · #646464 · whitespace-nowrap
 *   valor     Inter Bold 24px · wrapper pt-[6px] · fila h-[29.5px]
 *   nota      Inter Semi Bold 11px
 *
 * Vive en su propio archivo —y no dentro de `WarehouseControlKpis`— desde que la
 * segunda vista la necesitó: lo único que cambia entre las dos filas es el gap de
 * la grilla, así que cada fila declara su grilla y las dos comparten ESTA tarjeta.
 *
 * El número y la nota llevan colores INDEPENDIENTES, y no siempre coinciden:
 *
 *   Lotes en bodega             valor #131313
 *   Cerca del límite (5 meses)  valor #e8720c · nota #e8720c
 *   Vencidos (6 meses)          valor #bd3b5b · nota #570b1d   (red/500 vs red/900)
 *   Ingresos vs. retiros (mes)  valor #131313 · separador #acacac · nota #e8720c
 *   Retiros peligrosos (mes)    valor #131313 · nota #006153 con flecha
 *
 * En Figma el valor y la nota van con posición absoluta (`left-0 top-0` y
 * `left-[23.12px] top-[13px]`). Acá se resuelven con `flex items-baseline`, que
 * reproduce la misma alineación sin anclar píxeles.
 */

const NEUTRAL_VALUE_COLOR = '#131313';
/** `gray/500` del nodo `3686:25733`, para el separador "/". */
const SEPARATOR_COLOR = '#acacac';

/**
 * Dirección de la flecha que precede a la nota (nodo `3086:13818`).
 *
 * Es un valor y NO un `ReactNode` a propósito: `WasteKpi` viaja dentro de
 * `WarehouseControlView` al body de la exportación a PDF/Excel, y un nodo de
 * React ahí ensuciaría el payload. La tarjeta traduce el valor a su icono.
 *
 * `down` NO está dibujado en el diseño: el nodo solo muestra la flecha hacia
 * arriba. Se resuelve rotando 180° ESE mismo asset en lugar de traer un segundo
 * SVG, así que no hay glifo inventado ni dos archivos que puedan divergir.
 */
export type WasteKpiTrend = 'up' | 'down';

export interface WasteKpi {
  label: string;
  value: string;
  /** Segundo valor, para la tarjeta "Ingresos vs. retiros (mes)": 9 / 7. */
  secondaryValue?: string;
  /** Texto secundario junto al valor. Ausente en la primera tarjeta de bodega. */
  note?: string;
  /** Flecha delante de la nota. Solo la usa "Retiros peligrosos (mes)". */
  trend?: WasteKpiTrend;
  /** Color de los números. Por defecto el gris del diseño. */
  valueTone?: string;
  /** Color de la nota. Por defecto hereda el de los números. */
  noteTone?: string;
}

export function WasteKpiCard({ kpi }: { kpi: WasteKpi }) {
  const valueColor = kpi.valueTone ?? NEUTRAL_VALUE_COLOR;
  const noteColor = kpi.noteTone ?? valueColor;

  return (
    <div className="flex flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]">
      <p className="w-full whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#646464]">
        {kpi.label}
      </p>
      <div className="flex w-full flex-wrap items-baseline gap-[6px] pt-[6px]">
        <span
          className="font-['Inter:Bold',sans-serif] text-[24px] font-bold not-italic leading-[normal]"
          style={{ color: valueColor }}
        >
          {kpi.value}
        </span>
        {kpi.secondaryValue ? (
          <>
            <span
              className="font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[normal]"
              style={{ color: SEPARATOR_COLOR }}
            >
              /
            </span>
            <span
              className="font-['Inter:Bold',sans-serif] text-[24px] font-bold not-italic leading-[normal]"
              style={{ color: valueColor }}
            >
              {kpi.secondaryValue}
            </span>
          </>
        ) : null}
        {kpi.note ? (
          /*
           * Flecha y nota van en UN grupo con `gap-[3px]`, y el `gap-[6px]` de
           * la fila separa el valor de ese grupo. En el nodo la separación entre
           * icono y texto no es un gap: el string arranca con un espacio
           * (`" 3 vs. junio"`). Se resuelve con el gap para que la copy quede
           * limpia —un espacio inicial se pierde en el primer `trim()` que le
           * pase por encima— y `items-center` alinea el icono con la caja del
           * texto, que es lo que hacen los `top-[13.88px]` / `top-[13px]` del nodo.
           */
          <span className="flex items-center gap-[3px]">
            {kpi.trend ? (
              <WasteKpiTrendUpIcon
                className={`block h-[11px] w-[13.75px] shrink-0 ${kpi.trend === 'down' ? 'rotate-180' : ''}`}
                style={{ color: noteColor }}
              />
            ) : null}
            <span
              className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal]"
              style={{ color: noteColor }}
            >
              {kpi.note}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
