import { useState } from 'react';
import { WasteNonHazardousWithdrawalsIcon } from '../icons/WasteDashboardIcons';
import { buildWasteWithdrawalBars, toMonthKey, type WasteWithdrawalBar } from '../wasteDashboardChart';
import { WarehouseSectionTitle } from './WarehouseSectionTitle';

/**
 * "Retiros no peligrosos (informativo)" — título `3086:13927` y tarjeta
 * `3086:13931` del nodo `3086:13957` (Dashboard Residuos).
 *
 * Geometría del design context, no de la imagen:
 *
 *   título      flex gap-[8px] items-center pt-[18px] w-full
 *               icono 17.5 × 14 · texto Inter Bold 14px #131313 nowrap
 *   envoltorio  flex flex-col items-start pt-[10px] w-full          (`3086:13931`)
 *   tarjeta     bg white · border #e3e3e3 · rounded-[10px]          (`3086:13932`)
 *               px-[19px] py-[17px] · overflow-clip · flex flex-col items-start
 *   barras      contenedor h-[130px] w-full, interior flex gap-[10px]
 *               items-end pt-[10px]                                 (`3086:13933`)
 *   columna     flex-1 h-[120px] min-w-px, interior flex flex-col
 *               gap-[6px] items-center justify-end                  (`3086:13934`)
 *   valor       Inter Semi Bold 9.5px #646464                       (`3086:13935`)
 *   barra       rounded-t-[5px] w-full · #d1d1d1, mes corriente #24588b
 *   mes         Inter Regular 10px #646464                          (`3086:13937`)
 *   pie         pt-[10px] w-full · Inter Regular 10.5px #646464     (`3086:13954`)
 *
 * Tres desvíos deliberados respecto del design context:
 *
 * 1. `h-[199px]` de la tarjeta y `w-[427.461px]` de sus dos hijos se descartan:
 *    el brief prohíbe medidas fijas de layout. Los 199px son alto DERIVADO
 *    (17 + 130 + 36 + 17 ≈ 200), así que el contenido los reproduce solo.
 * 2. `w-[77.492px]` de cada columna se reemplaza por `flex-1 min-w-px`, que es
 *    lo que ya declara el nodo con `flex-[77.492_0_0]`: cinco columnas de igual
 *    crecimiento, no cinco anchos cableados.
 * 3. El alto de cada barra va en `%` sobre el área que sobra en su columna, no en
 *    píxeles. El porqué —y por qué las alturas del nodo no se copian tal cual—
 *    está en `buildWasteWithdrawalBars`.
 *
 * Los colores van en hex —los mismos que Figma entrega como fallback de sus
 * variables— porque `src/styles/index.css` no está importado en la app y sus
 * tokens no resuelven. Es la convención vigente en el resto del módulo.
 *
 * ESTADOS QUE EL DISEÑO NO DIBUJA. El nodo solo muestra el caso con datos. La
 * carga usa cinco barras neutras a media altura —conserva el alto de la tarjeta y
 * no deja la caja en blanco—; el error emite el mensaje con "Reintentar" en la
 * misma línea, como `WasteSidrepWeightSection`; y una serie vacía dice que hubo
 * meses sin retiros, que no es lo mismo que un fallo.
 */

/** Texto del nodo `3086:13930`. */
const CHART_TITLE = 'Retiros no peligrosos (informativo)';

/**
 * Pie del nodo `3086:13955`.
 *
 * El día de corte ("día 5") es copy del diseño y no un dato de la serie: describe
 * de dónde sale el consolidado, no cuándo se cerró ESTE mes. Cuando el backend
 * exponga la fecha real de consolidación, se reemplaza por ese dato.
 */
const CHART_SOURCE_NOTE =
  'Fuente: consolidado mensual de Servicios Generales (día 5). Solo informativo — sin aprobación asociada.';

const BAR_NEUTRAL_COLOR = '#d1d1d1';
const BAR_CURRENT_MONTH_COLOR = '#24588b';

interface WasteNonHazardousWithdrawalsChartProps {
  bars: WasteWithdrawalBar[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Tarjeta presentacional: recibe las barras ya calculadas y los tres estados.
 * No sabe de TanStack Query ni de la forma de la respuesta — eso vive en
 * `WasteNonHazardousWithdrawalsSection`.
 */
export function WasteNonHazardousWithdrawalsChart({
  bars,
  isLoading,
  isError,
  onRetry,
}: WasteNonHazardousWithdrawalsChartProps) {
  return (
    <section className="flex w-full flex-col" aria-label={CHART_TITLE}>
      <WarehouseSectionTitle
        spacing="spaced"
        icon={<WasteNonHazardousWithdrawalsIcon className="block size-full" />}
      >
        {CHART_TITLE}
      </WarehouseSectionTitle>

      <div className="w-full pt-[10px]" data-name="Container:margin">
        <div
          className="flex w-full flex-col items-start overflow-clip rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]"
          data-name="Container"
        >
          <WasteWithdrawalsChartBody bars={bars} isLoading={isLoading} isError={isError} onRetry={onRetry} />

          <div className="w-full pt-[10px]" data-name="Container">
            <p className="w-full font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
              {CHART_SOURCE_NOTE}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Área de barras del nodo `3086:13933`. Los cuatro estados comparten el MISMO
 * contenedor de 130px: así la tarjeta no cambia de alto al pasar de cargando a
 * cargado, que es lo que produce el salto de layout.
 */
function WasteWithdrawalsChartBody({
  bars,
  isLoading,
  isError,
  onRetry,
}: WasteNonHazardousWithdrawalsChartProps) {
  if (isLoading) {
    return (
      <div className="h-[130px] w-full" data-name="Container">
        <div className="flex size-full items-end gap-[10px] pt-[10px]" aria-busy="true" aria-live="polite">
          <span className="sr-only">Cargando retiros no peligrosos…</span>
          {/*
            Cinco columnas porque son las cinco del diseño. La altura escalonada
            evita que el esqueleto se lea como "todos los meses iguales", que sería
            un dato falso mientras carga.
          */}
          {[55, 70, 60, 80, 75].map((heightPercentage, index) => (
            <div key={index} aria-hidden className="h-[120px] min-w-px flex-1">
              <div className="flex size-full flex-col items-center justify-end gap-[6px]">
                <span className="invisible font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold leading-[normal]">
                  00
                </span>
                <div className="flex min-h-0 w-full flex-1 flex-col justify-end">
                  <div
                    className="w-full animate-pulse rounded-t-[5px] bg-[#ededed]"
                    style={{ height: `${heightPercentage}%` }}
                  />
                </div>
                <span className="invisible font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-[normal]">
                  Mmm
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[130px] w-full items-center justify-center" data-name="Container">
        <p
          role="alert"
          className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
        >
          No se pudieron cargar los retiros no peligrosos.{' '}
          <button
            type="button"
            onClick={onRetry}
            className="font-['Inter:Bold',sans-serif] font-bold underline underline-offset-2"
          >
            Reintentar
          </button>
        </p>
      </div>
    );
  }

  if (bars.length === 0) {
    return (
      <div className="flex h-[130px] w-full items-center justify-center" data-name="Container">
        <p className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
          Todavía no hay retiros no peligrosos consolidados.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[130px] w-full" data-name="Container">
      <div className="flex size-full items-end gap-[10px] pt-[10px]" role="list">
        {bars.map((bar) => (
          <WasteWithdrawalsChartColumn key={bar.month} bar={bar} />
        ))}
      </div>
    </div>
  );
}

/** Columna del nodo `3086:13934`: valor arriba, barra al medio, mes abajo. */
function WasteWithdrawalsChartColumn({ bar }: { bar: WasteWithdrawalBar }) {
  return (
    <div
      className="h-[120px] min-w-px flex-1"
      role="listitem"
      aria-label={`${bar.label}: ${bar.withdrawals} retiros`}
      data-name="Container"
    >
      <div className="flex size-full flex-col items-center justify-end gap-[6px]">
        <p className="shrink-0 whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold not-italic leading-[normal] text-[#646464]">
          {bar.withdrawals}
        </p>
        {/*
          La barra se mide contra el hueco que dejan los dos rótulos y los dos
          `gap-[6px]`, no contra un número de píxeles: `flex-1 min-h-0` toma ese
          resto y el `%` se aplica adentro. Con la caja del nodo el resto son
          ~84.4px, que es el 84.5 del nodo `3086:13952`; y si la fuente de
          fallback cambia el alto de los rótulos, la barra se ajusta en vez de
          desbordar la tarjeta.
        */}
        <div className="flex min-h-0 w-full flex-1 flex-col justify-end">
          <div
            className="w-full rounded-t-[5px]"
            style={{
              height: `${bar.heightPercentage}%`,
              backgroundColor: bar.highlighted ? BAR_CURRENT_MONTH_COLOR : BAR_NEUTRAL_COLOR,
            }}
          />
        </div>
        <p className="shrink-0 whitespace-nowrap font-['Inter:Regular',sans-serif] text-[10px] font-normal not-italic leading-[normal] text-[#646464]">
          {bar.label}
        </p>
      </div>
    </div>
  );
}

interface WasteNonHazardousWithdrawalsSectionProps {
  months: { month: string; withdrawals: number }[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Adaptador entre la respuesta del servidor y la tarjeta.
 *
 * El mes corriente se resuelve UNA vez al montar con la inicialización lazy de
 * `useState`: `new Date()` es impuro en render, y es el mismo criterio que ya usa
 * `WarehouseMonthlyAccumulated`.
 */
export function WasteNonHazardousWithdrawalsSection({
  months,
  isLoading,
  isError,
  onRetry,
}: WasteNonHazardousWithdrawalsSectionProps) {
  const [currentMonth] = useState(() => toMonthKey(new Date()));
  const bars = buildWasteWithdrawalBars(months ?? [], currentMonth);

  return (
    <WasteNonHazardousWithdrawalsChart
      bars={bars}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
    />
  );
}
