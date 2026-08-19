import { WasteKpiTrendUpIcon } from '../icons/WasteDashboardIcons';
import { WastePill, type WastePillTone } from './WastePill';

/**
 * Tarjeta de KPI del módulo de residuos.
 *
 * El mismo bloque aparece con geometría IDÉNTICA en cuatro vistas:
 *
 *   `3686:25708`  Control de bodega     (fila `3686:25707`, gap 16)
 *   `3086:13812`  Dashboard Residuos    (fila `3086:13811`, gap 14)
 *   `3430:2299`   Histórico de retiros  (fila `3430:2298`,  gap 14)
 *   `3830:65742`  Reporte SINADER       (fila `3830:65741`, gap 14)
 *
 *   tarjeta   bg white · border #e3e3e3 · rounded-[10px]
 *             interior flex flex-col items-start px-[19px] py-[17px]
 *   rótulo    Inter Semi Bold 11px · #646464 · whitespace-nowrap
 *   valor     Inter Bold 24px · wrapper pt-[6px] · fila h-[29.5px]
 *   nota      Inter Semi Bold 11px
 *
 * Vive en su propio archivo —y no dentro de `WarehouseControlKpis`— desde que la
 * segunda vista la necesitó: lo único que cambia entre las filas es el gap de la
 * grilla, y eso lo resuelve `WasteKpiRow` con un parámetro.
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
  /**
   * Cifra grande. Va vacío en las tarjetas cuyo valor es una pastilla —"Estado del
   * período" de Reporte SINADER (`3830:65742`)—, donde el número lo reemplaza
   * `badge`.
   */
  value: string;
  /** Segundo valor, para la tarjeta "Ingresos vs. retiros (mes)": 9 / 7. */
  secondaryValue?: string;
  /**
   * Unidad detrás de la cifra — el "kg" de "Total acumulado (parcial)"
   * (`3830:65755`).
   *
   * NO es `note`: el nodo la dibuja en Inter Regular 14px #646464, mientras que la
   * nota es Semi Bold 11px y toma el color del KPI. Son dos textos distintos que
   * pueden convivir, así que son dos campos.
   *
   * En Figma va con posición absoluta (`left-[78.01px] top-[10px]`). Acá la
   * resuelve el `items-baseline` de la fila, que reproduce esa alineación sin
   * anclar píxeles: el `top-[10px]` sobre un cuerpo de 24px es, justamente, dejar
   * las dos líneas base juntas.
   */
  unit?: string;
  /** Texto secundario junto al valor. Ausente en la primera tarjeta de bodega. */
  note?: string;
  /** Flecha delante de la nota. Solo la usa "Retiros peligrosos (mes)". */
  trend?: WasteKpiTrend;
  /** Color de los números. Por defecto el gris del diseño. */
  valueTone?: string;
  /** Color de la nota. Por defecto hereda el de los números. */
  noteTone?: string;
  /**
   * Pastilla EN LUGAR de la cifra — "En curso" en `3830:65747`.
   *
   * Reemplaza al número y no lo acompaña: la tarjeta "Estado del período" no tiene
   * ninguna cifra que mostrar, su valor ES el estado. Usa `WastePill`, la misma
   * caja que las pastillas de las tablas del módulo.
   *
   * Es un objeto plano y no un `ReactNode` por lo mismo que `trend`: `WasteKpi`
   * viaja al body de las exportaciones a PDF/Excel, y un nodo de React ahí
   * ensuciaría el payload.
   */
  badge?: { label: string; tone: WastePillTone };
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
        {kpi.badge ? (
          <WastePill tone={kpi.badge.tone}>{kpi.badge.label}</WastePill>
        ) : (
          <span
            className="font-['Inter:Bold',sans-serif] text-[24px] font-bold not-italic leading-[normal]"
            style={{ color: valueColor }}
          >
            {kpi.value}
          </span>
        )}
        {kpi.unit ? (
          <span className="font-['Inter:Regular',sans-serif] text-[14px] font-normal not-italic leading-[normal] text-[#646464]">
            {kpi.unit}
          </span>
        ) : null}
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

/**
 * Clases literales y no `gap-[${n}px]`: Tailwind no puede generar una clase a
 * partir de un valor de runtime. Las dos son las únicas que dibuja el diseño.
 */
const ROW_GAP_CLASS = {
  14: 'gap-[14px]',
  16: 'gap-[16px]',
} as const;

export type WasteKpiRowGap = keyof typeof ROW_GAP_CLASS;

interface WasteKpiRowProps {
  kpis: readonly WasteKpi[];
  /** Separación de la grilla en el nodo: 16 en "Control de bodega", 14 en el resto. */
  gap?: WasteKpiRowGap;
}

/**
 * Fila de tarjetas de KPI — nodos `3686:25707` (Control de bodega, gap 16),
 * `3086:13811` (Dashboard Residuos, gap 14) y `3430:2298` (Histórico de retiros,
 * gap 14).
 *
 * Dos desvíos deliberados respecto del design context, comunes a las tres filas:
 *
 * 1. `grid-cols-[250.5px_250.5px_250.5px_250.5px]` se reemplaza por cuatro
 *    columnas de igual fracción: el brief prohíbe anchos fijos de layout. Los
 *    250.5px son el reparto de los 1044px del cuerpo menos los tres gaps
 *    (1044 − 42 = 1002; 1002 / 4 = 250.5), así que cuatro columnas iguales lo
 *    reproducen y además siguen al viewport.
 * 2. `grid-rows-[82.5px]` tampoco se fija: los 82.5px son alto DERIVADO
 *    (17 + 13 + 6 + 29.5 + 17 = 82.5) y el contenido los produce solo. Fijarlo
 *    recortaría el rótulo el día que un KPI necesite dos líneas.
 *
 * Colapsa a dos columnas y a una en pantallas angostas.
 */
export function WasteKpiRow({ kpis, gap = 14 }: WasteKpiRowProps) {
  return (
    <div className={`grid w-full grid-cols-1 ${ROW_GAP_CLASS[gap]} sm:grid-cols-2 xl:grid-cols-4`}>
      {kpis.map((kpi) => (
        <WasteKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
