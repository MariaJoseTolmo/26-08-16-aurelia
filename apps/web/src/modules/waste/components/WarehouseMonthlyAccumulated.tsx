import { useState } from 'react';
import { resolveWasteAccumulationTone, type WasteAccumulationTone } from '@aurelia/contracts';
import { WarehouseCalendarIcon, WarehouseGaugeIcon } from '../icons/WarehouseControlIcons';
import {
  WasteAccumulationLegendChipIcon,
  WasteAccumulationTodayLineIcon,
} from '../icons/WasteDashboardIcons';
import { getMonthProgress } from '../wasteMonthProgress';
import {
  ACCUMULATION_TONE_STYLES,
  clampPercentage,
  formatAccumulationDeviation,
} from '../wasteWarehouseThresholds';
import { WarehouseSectionTitle } from './WarehouseSectionTitle';

/**
 * "Acumulado mensual vs. umbral RCA" — nodos `3686:25738` (título),
 * `3686:25743` (recuadro del mes) y `3686:25756` (tarjeta de barras).
 *
 *   recuadro   bg white · border #e3e3e3 · rounded-[8px] · px-[15px] py-[10px] · gap-[4px]
 *              texto Inter Regular 11.5px · leading-[17.25px] · #646464
 *   tarjeta    bg white · border #e3e3e3 · rounded-[10px] · px-[21px] py-[19px]
 *              filas separadas por gap-[16px]; wrapper con pt-[22px]
 *   track      bg #f7f7f7 · h-[9px] · rounded-[5px]
 *   relleno    h-[9px] · rounded-[5px] · color según el umbral
 *   marcador   línea border-l-2 dashed #001e39 opacity-60 desde top-[22px]
 *              pastilla bg #001e39 · rounded-[5px] · px-[9px] py-[3px]
 *              texto Inter Bold 9.5px #c8a064
 *
 * El ancho de la tarjeta en Figma es `w-[558.539px]` con `h-[186.5px]`; acá va
 * `w-full` y altura automática, porque el brief prohíbe medidas fijas de layout.
 * Los porcentajes se aplican como `%` sobre el track, no como anchos en píxeles.
 */

export interface WarehouseAccumulationBar {
  label: string;
  /**
   * Porcentaje consumido del umbral. Comparado contra la barra de día del mes,
   * define el color de la barra Y el texto de la pastilla de desvío.
   */
  percentage: number;
  /** Lectura completa a la derecha, p. ej. "98 / 140 ton (70%)". */
  valueLabel: string;
}

/**
 * Segunda línea del recuadro del mes en Control de bodega (nodo `3686:25748`). Se
 * exporta para que la exportación a PDF/Excel use LA MISMA copy en vez de una
 * versión paralela.
 */
export const WAREHOUSE_MONTH_ADVICE =
  'Si una barra va muy adelantada, considera diferir retiros o usar el margen de 6 meses de almacenaje.';

/**
 * Segunda línea del recuadro del mes en el Dashboard Residuos (nodo `3430:2296`).
 *
 * El dashboard NO repite el consejo de bodega: su recuadro explica cómo leer el
 * gráfico, que es lo mismo que hace la leyenda de tonos que solo él trae.
 */
export const WASTE_DASHBOARD_MONTH_ADVICE =
  'Compara dónde está cada barra respecto a la línea "Hoy" para saber si va más adelantada de lo esperado.';

const MONTH_ADVICE_BY_VARIANT: Record<WarehouseMonthlyAccumulatedVariant, string> = {
  warehouse: WAREHOUSE_MONTH_ADVICE,
  dashboard: WASTE_DASHBOARD_MONTH_ADVICE,
};

/**
 * Caja de la banderilla "Hoy" (nodo `3686:25777`), compartida por la pastilla
 * visible y por la copia invisible que le reserva el alto.
 *
 * El texto va en ESTE elemento y no en un `<span>` interno, que es como estaba
 * antes. Con el `text-[9.5px]` en el span, el div heredaba el font-size del
 * contexto (~16px) y su strut —la altura mínima de línea que impone la fuente
 * heredada— dominaba la caja: la pastilla medía ~25px contra los ~17px de la
 * banda, se desbordaba hacia abajo sobre "Adelantado +51pp", y dejaba aire de
 * sobra arriba del texto.
 *
 * Al compartir las clases, las dos cajas son idénticas por construcción, no por
 * cálculo.
 */
const MARKER_PILL_BOX_CLASS =
  "whitespace-nowrap px-[9px] py-[3px] font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal]";

export const WAREHOUSE_ACCUMULATION_DEFAULTS: WarehouseAccumulationBar[] = [
  { label: 'Residuos peligrosos', percentage: 70, valueLabel: '98 / 140 ton (70%)' },
  { label: 'Industriales no peligrosos', percentage: 86, valueLabel: '112 / 130 ton (86%)' },
  { label: 'Domésticos', percentage: 10, valueLabel: '5 / 51 ton (10%)' },
];

/**
 * Los cuatro textos de la leyenda de tonos (nodos `3785:46386`, `46390`, `46394`
 * y `46398`).
 *
 * Los tres primeros describen los umbrales que aplica
 * `resolveWasteAccumulationTone`, así que se emiten en el MISMO orden en que la
 * regla los evalúa. Si el umbral cambia en contracts, este texto es lo primero que
 * hay que corregir —y por eso vive pegado a él y no suelto en el JSX—.
 */
const ACCUMULATION_LEGEND_ITEMS: { tone: WasteAccumulationTone; label: string }[] = [
  { tone: 'safe', label: 'Normal (±10pp del ritmo esperado)' },
  { tone: 'warning', label: 'Adelantado (+10 a +25pp)' },
  { tone: 'critical', label: 'Crítico (+25pp o más)' },
];

/** Nodo `3785:46398`. Explica la línea punteada, no un color. */
const ACCUMULATION_LEGEND_TODAY_LABEL = 'Línea "Hoy" = ritmo esperado si el consumo fuera parejo';

/**
 * Cuál de los dos nodos se dibuja.
 *
 * El bloque existe en dos frames con TRES diferencias geométricas, comprobadas
 * nodo por nodo:
 *
 *                          `warehouse` (3686:25738)   `dashboard` (3086:13843)
 *   título → recuadro      8px                        10px
 *   recuadro → tarjeta     10px                       10px
 *   caret bajo la pastilla no                         sí   (3785:46380)
 *   leyenda de tonos       no                         sí   (3785:46381)
 *   "Ver detalle completo" no                         sí   (4304:28838, por `onShowDetail`)
 *
 * Es un `variant` y no tres banderas sueltas porque las tres diferencias son LA
 * MISMA decisión —qué nodo se está traduciendo—, y separarlas dejaría combinaciones
 * que no existen en el diseño.
 */
export type WarehouseMonthlyAccumulatedVariant = 'warehouse' | 'dashboard';

/**
 * Recuadro del avance del mes — nodos `3686:25743` y `3430:2291`.
 *
 *   bg white · border #e3e3e3 · rounded-[8px] · px-[15px] py-[10px] · gap-[4px]
 *   texto Inter Regular 11.5px · leading-[17.25px] · #646464
 *
 * Se exporta porque NO depende de la API: el día del mes sale de la fecha del
 * navegador. Las vistas que atan este bloque a un endpoint lo muestran también
 * mientras cargan y cuando falla —es información válida en los tres casos—, y
 * ocultarlo hacía que la columna saltara de alto al llegar la respuesta.
 *
 * El margen superior lo pone ESTE componente porque es una de las diferencias de
 * espaciado entre los dos nodos: 8px en bodega, 10px en el dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * "DEL MES" DUPLICADO: bug de la copy del nodo viejo, corregido acá
 *
 * El nodo de bodega (`3686:25743`) parte la frase en dos párrafos y repite el
 * cierre:
 *
 *   línea 1   "Hoy es el día 16 de 31 del mes."
 *   línea 2   "del mes (52% transcurrido). Si una barra va muy adelantada, …"
 *              ^^^^^^^^ duplicado
 *
 * El nodo del dashboard (`3430:2291`), que es posterior, ya no lo trae. Y
 * `formatMonthProgressSentence` —la que compone esta misma frase para el PDF—
 * escribe "Hoy es el día 16 de 31 del mes (52% transcurrido). {consejo}", que es
 * la frase entera y sin repetición. Esa es la intención real: la web era la única
 * que mostraba el "del mes" dos veces.
 *
 * Acá el porcentaje va donde corresponde —cerrando la primera línea— y la segunda
 * queda solo con el consejo. La web y el PDF dicen ahora exactamente lo mismo.
 *
 * El dashboard NO muestra el porcentaje en este recuadro: su nodo no lo trae,
 * porque el dato ya está en la pastilla "Hoy · día 16 (52% del mes)" que su
 * variante dibuja sobre las barras.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function WarehouseMonthProgressNotice({
  today,
  variant = 'warehouse',
}: {
  today?: Date;
  variant?: WarehouseMonthlyAccumulatedVariant;
}) {
  const [mountedAt] = useState(() => today ?? new Date());
  const { day: currentDay, daysInMonth, elapsedPercentage } = getMonthProgress(today ?? mountedAt);

  return (
    <div
      className={`flex w-full flex-col items-start justify-center gap-[4px] rounded-[8px] border border-solid border-[#e3e3e3] bg-white px-[15px] py-[10px] ${variant === 'dashboard' ? 'mt-[10px]' : 'mt-[8px]'}`}
    >
      <div className="flex items-center gap-[6px]">
        <WarehouseCalendarIcon className="block h-[11.5px] w-[10.0625px] shrink-0 text-[#646464]" />
        <p className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#646464]">
          Hoy es el{' '}
          <span className="font-['Inter:Bold',sans-serif] font-bold">
            día {currentDay} de {daysInMonth}
          </span>{' '}
          {variant === 'dashboard' ? 'del mes.' : `del mes (${elapsedPercentage}% transcurrido).`}
        </p>
      </div>
      <p className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#646464]">
        {MONTH_ADVICE_BY_VARIANT[variant]}
      </p>
    </div>
  );
}

interface WarehouseMonthlyAccumulatedProps {
  bars?: WarehouseAccumulationBar[];
  /**
   * Fecha de referencia. Se expone como prop para poder fijarla en pruebas; en
   * la app se resuelve con la fecha real del navegador.
   */
  today?: Date;
  variant?: WarehouseMonthlyAccumulatedVariant;
  /**
   * Acción de "Ver detalle completo" (nodo `4304:28838`). Sin handler el control no
   * se emite.
   *
   * Es un `<button>` con `onClick` y NO un `<a href>`: abre el modal `4304:30640`,
   * no navega. Se había asumido que llevaba a Control de bodega y era incorrecto.
   */
  onShowDetail?: () => void;
}

export function WarehouseMonthlyAccumulated({
  bars = WAREHOUSE_ACCUMULATION_DEFAULTS,
  today,
  variant = 'warehouse',
  onShowDetail,
}: WarehouseMonthlyAccumulatedProps) {
  const isDashboard = variant === 'dashboard';
  /**
   * `new Date()` es impuro en render, así que se resuelve una sola vez al montar
   * con la inicialización lazy de `useState`. El día y la cantidad de días del
   * mes salen de ahí: el texto "día 16 de 31" del diseño es un ejemplo, no un
   * valor fijo.
   */
  const [mountedAt] = useState(() => today ?? new Date());
  // `daysInMonth` ya no se lee acá: la frase "día 16 de 31" vive en
  // `WarehouseMonthProgressNotice`, que resuelve su propio avance del mes.
  const { day: currentDay, elapsedPercentage } = getMonthProgress(today ?? mountedAt);
  /** Posición de la barra de día del mes, acotada para no salirse de la tarjeta. */
  const markerPercentage = clampPercentage(elapsedPercentage);
  /**
   * Texto de la pastilla. Se arma una sola vez porque se renderiza DOS veces: la
   * pastilla visible y la copia invisible que le reserva el alto a la banda.
   */
  const markerLabel = `Hoy · día ${currentDay} (${elapsedPercentage}% del mes)`;

  return (
    /*
     * Sin `gap` en la columna: los dos huecos NO miden lo mismo. El de
     * título → recuadro es 8px en bodega y 10px en el dashboard, y el de
     * recuadro → tarjeta es 10px en los dos —ese `Container:margin` con
     * `pt-[10px]` está en ambos nodos (`3686:25749` y `3785:46350`)—. Con un
     * `gap-[8px]` único, el segundo hueco quedaba 2px corto en las dos vistas.
     */
    <div className="flex w-full flex-col">
      <WarehouseSectionTitle icon={<WarehouseGaugeIcon className="block size-full" />}>
        Acumulado mensual vs. umbral RCA
      </WarehouseSectionTitle>

      <WarehouseMonthProgressNotice today={today ?? mountedAt} variant={variant} />
      {/* `Container:margin` con `pt-[10px]`: nodos `3686:25749` y `3785:46350`. */}
      <div className="w-full rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[21px] py-[19px] mt-[10px]">
        {/*
          La pastilla vive en SU PROPIA banda, no encima de las barras.

          Reservarle el alto con un `pt-[Npx]` no alcanzaba: si la pastilla mide
          más que ese número —fuente de fallback más alta, texto más largo— vuelve
          a pisar la primera fila, que es lo que pasaba con "Adelantado +51pp".
          Acá el alto lo fija una COPIA INVISIBLE de la pastilla en el flujo
          normal: mida lo que mida, la banda mide exactamente lo mismo. Deja de
          haber número mágico que pueda quedar corto.
        */}
        <div className="relative w-full">
          <div aria-hidden className={`invisible ${MARKER_PILL_BOX_CLASS}`}>
            {markerLabel}
          </div>
          {/*
            "Ver detalle completo" (nodo `4304:28838`): Inter Bold 12px #c8a064
            subrayado, alineado al borde derecho del contenido de la tarjeta.

            En el nodo va con `absolute right-[80.54px] top-[11.5px]
            translate-x-1/2`, que es como Figma centra su caja de texto; en píxeles
            reales su borde derecho cae a ~19.5px del borde de la tarjeta, o sea
            prácticamente sobre el `px-[21px]` del contenido. Acá se resuelve con
            `justify-end` dentro de la banda de la pastilla en vez de replicar esos
            offsets, que es exactamente el anclaje en píxeles que prohíbe el brief.
            El desvío es de ~7px hacia abajo: el nodo lo sube por encima del
            `py-[19px]`, y seguirlo obligaría a un margen negativo mágico.
          */}
          {onShowDetail ? (
            <div className="absolute right-0 top-0 flex">
              <button
                type="button"
                onClick={onShowDetail}
                className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#c8a064] underline decoration-solid [text-underline-position:from-font] transition-colors hover:text-[#bb9057]"
              >
                Ver detalle completo
              </button>
            </div>
          ) : null}
          {/*
            Horizontalmente iba con `-translate-x-1/2`, centrada en la marca, y se
            salía de la tarjeta en los extremos: el 31 de agosto la marca queda en
            100% y media pastilla terminaba afuera.

            `translateX(-marca%)` la desplaza sobre sí misma en proporción a dónde
            está la marca: en 0% queda alineada al borde izquierdo, en 100% al
            derecho, y en 50% exactamente centrada —idéntico al `-50%` original—.
            Nunca se sale. El desvío contra el diseño es de ~3px en la marca del
            nodo (52%), el precio de que no se desborde en ninguna fecha.
          */}
          <div
            className={`absolute top-0 rounded-[5px] bg-[#001e39] text-[#c8a064] ${MARKER_PILL_BOX_CLASS}`}
            style={{ left: `${markerPercentage}%`, transform: `translateX(-${markerPercentage}%)` }}
          >
            {markerLabel}
            {/*
              Caret del nodo `3785:46380`: 8 × 4, colgando bajo la pastilla y
              centrado en ella (left 65.99 + 4 = 70 = mitad de los 140px de la
              pastilla). Es el triángulo CSS de toda la vida —bordes laterales
              transparentes y borde superior con color—; el exportador de Figma
              pierde ese color y emite los tres transparentes, así que el
              #001e39 sale de la pastilla, que es de donde el caret nace.

              Se centra con `left-1/2 -translate-x-1/2` sobre la pastilla en vez
              del offset del nodo: la pastilla no mide siempre 140px, porque su
              texto cambia con el día del mes.
            */}
            {isDashboard ? (
              <span
                aria-hidden
                className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#001e39]"
              />
            ) : null}
          </div>
        </div>

        {/* Zona de barras. La línea punteada arranca justo debajo de la pastilla. */}
        <div className="relative w-full pt-[8px]">
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-0 w-0 border-l-2 border-dashed border-[#001e39] opacity-60"
            style={{ left: `${markerPercentage}%` }}
          />
          <div className="flex w-full flex-col gap-[16px]">
            {bars.map((bar) => (
              <WarehouseAccumulationRow key={bar.label} bar={bar} elapsedPercentage={elapsedPercentage} />
            ))}
          </div>
        </div>

        {isDashboard ? <WarehouseAccumulationLegend /> : null}
      </div>
    </div>
  );
}

/**
 * Leyenda de tonos — nodos `3785:46381` (envoltorio `pt-[2px]`) y `3785:46382`
 * (`border-t #e3e3e3`, alto 55px).
 *
 *   ítem   alto 12px · icono 12.5 × 10 · texto Inter Regular 10px #646464
 *          separación horizontal 18px, vertical 18px
 *
 * Dos desvíos deliberados respecto del design context:
 *
 * 1. Los cuatro ítems van con posición absoluta (`left-[198.48px]`,
 *    `top-[42px]`, …). Se reemplazan por dos filas flex: el brief prohíbe
 *    anclar layout en píxeles. Los 18px de separación salen de restar las
 *    posiciones del nodo (198.48 − 180.484 ≈ 18; 354.44 − 336.43 ≈ 18) y los 30px
 *    entre filas son 12 de alto + 18 de gap.
 * 2. El cuarto ítem NO se deja caer por `flex-wrap`: va en su propia fila
 *    explícita. En el nodo queda abajo porque no le da el ancho, pero es una fila
 *    aparte por SIGNIFICADO —explica la línea punteada, no un color—, y con wrap
 *    se subiría a la primera fila en cuanto la tarjeta creciera.
 *
 * `h-[55px]` no se fija: 12 + 12 + 18 + 12 = 54 y el contenido lo produce solo.
 *
 * Los colores de los tres chips salen de `ACCUMULATION_TONE_STYLES`, la MISMA
 * fuente que pinta las barras. Repetir los hex acá permitiría que la leyenda
 * dijera un color y la barra dibujara otro.
 */
function WarehouseAccumulationLegend() {
  return (
    <div className="w-full pt-[2px]">
      <div className="flex w-full flex-col gap-[18px] border-t border-solid border-[#e3e3e3] pt-[12px]">
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
          {ACCUMULATION_LEGEND_ITEMS.map((item) => (
            <span key={item.tone} className="flex h-[12px] items-center gap-[3px]">
              <WasteAccumulationLegendChipIcon
                className="block h-[10px] w-[12.5px] shrink-0"
                style={{ color: ACCUMULATION_TONE_STYLES[item.tone].bar }}
              />
              <span className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[10px] font-normal not-italic leading-[normal] text-[#646464]">
                {item.label}
              </span>
            </span>
          ))}
        </div>
        <span className="flex h-[12px] items-center gap-[3px]">
          <WasteAccumulationTodayLineIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#001e39]" />
          <span className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[10px] font-normal not-italic leading-[normal] text-[#646464]">
            {ACCUMULATION_LEGEND_TODAY_LABEL}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * `elapsedPercentage` es la posición de la barra de día del mes. No es dato
 * decorativo: el tono de la barra se define comparándose CONTRA ella.
 */
function WarehouseAccumulationRow({
  bar,
  elapsedPercentage,
}: {
  bar: WarehouseAccumulationBar;
  elapsedPercentage: number;
}) {
  const percentage = clampPercentage(bar.percentage);
  const tone = ACCUMULATION_TONE_STYLES[resolveWasteAccumulationTone(percentage, elapsedPercentage)];
  const deviationLabel = formatAccumulationDeviation(percentage, elapsedPercentage);

  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div className="flex w-full flex-wrap items-center gap-[6px]">
        <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[12.5px] font-bold not-italic leading-[normal] text-[#131313]">
          {bar.label}
        </span>
        <span
          className="whitespace-nowrap rounded-[20px] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal]"
          style={{ backgroundColor: tone.badgeBackground, color: tone.badgeText }}
        >
          {deviationLabel}
        </span>
        <span className="ml-auto whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
          {bar.valueLabel}
        </span>
      </div>
      <div
        className="h-[9px] w-full overflow-hidden rounded-[5px] bg-[#f7f7f7]"
        role="progressbar"
        aria-label={bar.label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-[9px] rounded-[5px]" style={{ width: `${percentage}%`, backgroundColor: tone.bar }} />
      </div>
    </div>
  );
}
