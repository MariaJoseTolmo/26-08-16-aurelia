import type { ComponentType, SVGProps } from 'react';
import {
  WastePerformanceAlertIcon,
  WastePerformanceAlertNoteIcon,
  WastePerformanceCriticalIcon,
  WastePerformanceCriticalNoteIcon,
  WastePerformanceNoDataIcon,
  WastePerformanceNoDataNoteIcon,
  WastePerformanceNormalIcon,
  WastePerformanceNormalNoteIcon,
} from '../icons/WasteCompanyPerformanceIcons';
import {
  WASTE_COMPANY_STATUS_LABELS,
  WASTE_TREND_ALERT_DAYS,
  type WasteCompanyMetric,
  type WasteCompanyPerformance,
  type WasteCompanyStatus,
  type WasteCompanyTrendPoint,
} from '../wasteCompanyPerformance';

/**
 * Ficha de desempeño de una empresa — nodos `3830:63741` (Empresa 1),
 * `3830:63803`, `3830:63865` y `3830:63927`, que son la misma tarjeta con
 * distinto estado.
 *
 * Geometría del design context:
 *
 *   tarjeta    bg white · border #e3e3e3 · rounded-[10px] · px-[19px] py-[17px]
 *              flex flex-col items-start justify-between
 *   cabecera   flex flex-col gap-[4px]
 *              nombre Inter Bold 13.5px #131313
 *              chip   rounded-[20px] · gap-[4px] · px-[8px] py-[3px]
 *                     icono 11.875 × 9.5 · texto Inter Bold 9.5px
 *   métricas   grid 2 columnas · gap-x-[10px] gap-y-[12px]
 *              valor  Inter Bold 16px
 *              rótulo Inter Regular 10px #646464 · leading-[14px] · pt-[2px]
 *   nota       rounded-[7px] · gap-[7px] items-start · px-[11px] py-[9px]
 *              icono 10.5 · texto Inter Regular 10.5px · leading-[15.75px]
 *   tendencia  border-t #e3e3e3 · pt-[11px]
 *              barras flex gap-[6px] items-end h-[56px] · rounded-t-[3px]
 *
 * El `justify-between` de la tarjeta es lo que alinea los gráficos de todas las
 * columnas a la misma altura aunque las notas midan distinto: el bloque superior
 * crece y la tendencia queda pegada abajo. Por eso la tarjeta ocupa el alto que
 * le da la tira (`items-stretch`) en vez de encogerse a su contenido.
 *
 * La tarjeta NO decide su ancho: lo fija la tira de `WasteHistoryPage`, que la
 * mantiene en los 248.688px del diseño y desborda hacia la derecha cuando hay
 * muchas empresas. Acá se declara `w-full` para llenar ese hueco.
 *
 * DOS DESVÍOS deliberados respecto del design context:
 *
 * 1. Los anchos fijos de la grilla de métricas (`grid-cols-[100.34px_100.34px]`)
 *    y de cada rótulo (`w-[101px]`) se descartan: son el reparto INTERNO del
 *    ancho de la tarjeta en Figma. Dos columnas iguales dan la misma medida y
 *    siguen al contenedor, así que un cambio de ancho de tarjeta no obliga a
 *    recalcular nada acá.
 * 2. Los valores de la tendencia van posicionados en el nodo (`top-[-15px]`
 *    sobre cada barra). Acá la barra y su valor viven en una columna flex, que da
 *    la misma lectura sin anclar píxeles y además no se solapan si el número
 *    crece.
 */

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface StatusStyle {
  /** Fondo del chip y de la caja de nota: el nodo usa el mismo en los dos. */
  surface: string;
  /** Color del texto del chip, de la nota y de los valores no neutros. */
  ink: string;
  /** Sólo "Datos insuficientes" lleva borde en el chip. */
  chipBorder?: string;
  /** El chip de "Datos insuficientes" respira un poco más que el resto. */
  chipPadding: string;
  /** La nota de "Datos insuficientes" NO usa `ink`, va en el gris de cuerpo. */
  noteInk: string;
  chipIcon: IconComponent;
  noteIcon: IconComponent;
}

const STATUS_STYLES: Record<WasteCompanyStatus, StatusStyle> = {
  critical: {
    surface: '#ffd0db',
    ink: '#570b1d',
    chipPadding: 'px-[8px] py-[3px]',
    noteInk: '#570b1d',
    chipIcon: WastePerformanceCriticalIcon,
    noteIcon: WastePerformanceCriticalNoteIcon,
  },
  alert: {
    surface: '#fff0e6',
    ink: '#6b3a1f',
    chipPadding: 'px-[8px] py-[3px]',
    noteInk: '#6b3a1f',
    chipIcon: WastePerformanceAlertIcon,
    noteIcon: WastePerformanceAlertNoteIcon,
  },
  normal: {
    surface: '#e0ffd3',
    ink: '#2a5c16',
    chipPadding: 'px-[8px] py-[3px]',
    noteInk: '#2a5c16',
    chipIcon: WastePerformanceNormalIcon,
    noteIcon: WastePerformanceNormalNoteIcon,
  },
  insufficient: {
    surface: '#f7f7f7',
    ink: '#acacac',
    chipBorder: '#e3e3e3',
    chipPadding: 'px-[9px] py-[4px]',
    // El nodo `3830:63961` pinta la nota en #646464 y no en el #acacac del chip.
    noteInk: '#646464',
    chipIcon: WastePerformanceNoDataIcon,
    noteIcon: WastePerformanceNoDataNoteIcon,
  },
};

/** Gris de los valores que no toman el tono del estado. */
const NEUTRAL_VALUE_INK = '#131313';

/**
 * Los valores de "Datos insuficientes" van neutros y NO en el gris del chip: el
 * nodo `3830:63940` dibuja el "—" en #131313. Es coherente —el guion no es una
 * señal, es la ausencia de dato— y por eso el tono del estado no se aplica ahí.
 */
function resolveValueInk(status: WasteCompanyStatus, metric: WasteCompanyMetric): string {
  if (metric.neutral || status === 'insufficient') return NEUTRAL_VALUE_INK;
  return STATUS_STYLES[status].ink;
}

export function WasteCompanyPerformanceCard({ company }: { company: WasteCompanyPerformance }) {
  const style = STATUS_STYLES[company.status];
  const ChipIcon = style.chipIcon;
  const NoteIcon = style.noteIcon;

  return (
    <div className="flex h-full w-full flex-col items-start justify-between rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]">
      <div className="flex w-full flex-col gap-[12px]">
        <div className="flex w-full flex-col items-start gap-[4px]">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13.5px] font-bold not-italic leading-[normal] text-[#131313]">
            {company.name}
          </p>
          <span
            className={`flex shrink-0 items-center gap-[4px] rounded-[20px] ${style.chipPadding} ${
              style.chipBorder ? 'border border-solid' : ''
            }`}
            style={{
              backgroundColor: style.surface,
              color: style.ink,
              borderColor: style.chipBorder,
            }}
          >
            <ChipIcon className="block h-[9.5px] w-[11.875px] shrink-0" />
            <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal]">
              {WASTE_COMPANY_STATUS_LABELS[company.status]}
            </span>
          </span>
        </div>

        <div className="flex w-full flex-col gap-[12px]">
          <div className="grid w-full grid-cols-2 gap-x-[10px] gap-y-[12px]">
            {company.metrics.map((metric) => (
              <WasteCompanyMetricCell
                key={metric.label}
                metric={metric}
                ink={resolveValueInk(company.status, metric)}
              />
            ))}
          </div>

          <div
            className="flex w-full items-start gap-[7px] rounded-[7px] px-[11px] py-[9px]"
            style={{ backgroundColor: style.surface, color: style.noteInk }}
          >
            <NoteIcon className="mt-[2px] block size-[10.5px] shrink-0" />
            <p className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[15.75px]">
              {company.note}
            </p>
          </div>
        </div>
      </div>

      {/*
        La Empresa 4 no trae tendencia. El separador y el titulo viven DENTRO de
        este bloque, así que al faltar la serie no queda una línea suelta al pie.
      */}
      {company.trend ? <WasteCompanyTrend trend={company.trend} /> : null}
    </div>
  );
}

function WasteCompanyMetricCell({ metric, ink }: { metric: WasteCompanyMetric; ink: string }) {
  return (
    <div className="flex flex-col items-start">
      <p
        className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[normal]"
        style={{ color: ink }}
      >
        {/* Guion largo del nodo `3830:63940`, no un guion corto. */}
        {metric.value ?? '—'}
      </p>
      <p className="w-full pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] font-normal not-italic leading-[14px] text-[#646464]">
        {metric.label}
        {metric.hint ? (
          <>
            {' '}
            {/*
              La aclaración va en el MISMO párrafo y no en uno aparte: en el nodo
              comparte caja e interlineado con el rótulo, y separarlos rompería el
              salto de línea cuando el texto envuelve.
            */}
            <span className="text-[#acacac]">{metric.hint}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

/** Naranja de las barras sobre el umbral y teal de las que están dentro. */
const TREND_ALERT_COLOR = '#e8720c';
const TREND_OK_COLOR = '#00b398';

function WasteCompanyTrend({ trend }: { trend: WasteCompanyTrendPoint[] }) {
  /*
   * Las alturas del nodo (30.797, 35.836, 40.875…) son proporcionales al valor
   * dentro de una caja de 56px. Se reproducen como porcentaje del máximo de la
   * serie en vez de copiar los píxeles: así el gráfico sigue siendo correcto con
   * datos reales, que es lo que va a recibir.
   */
  const max = Math.max(...trend.map((point) => point.days), 1);

  return (
    <div className="w-full border-t border-solid border-[#e3e3e3] pt-[11px]">
      <p className="w-full pt-[6.5px] font-['Inter:Regular',sans-serif] text-[9.5px] font-normal uppercase not-italic leading-[normal] tracking-[0.19px] text-[#acacac]">
        Tendencia de cierre (días) — últimos 5 meses
      </p>
      <div className="flex h-[56px] w-full items-end gap-[6px] pt-[8px]">
        {trend.map((point) => (
          <div key={point.month} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <span className="pb-[4px] text-center font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold not-italic leading-[normal] text-[#646464]">
              {point.days.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <div
              className="w-full rounded-t-[3px]"
              style={{
                height: `${(point.days / max) * 100}%`,
                backgroundColor: point.days >= WASTE_TREND_ALERT_DAYS ? TREND_ALERT_COLOR : TREND_OK_COLOR,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex w-full items-start justify-between pt-[4px]">
        {trend.map((point) => (
          <span
            key={point.month}
            className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9.5px] font-normal uppercase not-italic leading-[normal] tracking-[0.19px] text-[#acacac]"
          >
            {point.month}
          </span>
        ))}
      </div>
    </div>
  );
}
