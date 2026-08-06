import { useState } from 'react';
import { WarehouseCalendarIcon, WarehouseGaugeIcon } from '../icons/WarehouseControlIcons';
import { getMonthProgress } from '../wasteMonthProgress';
import {
  ACCUMULATION_TONE_STYLES,
  clampPercentage,
  resolveAccumulationTone,
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
  /** Porcentaje consumido del umbral. Define el color según la regla de negocio. */
  percentage: number;
  /** Pastilla de desvío, p. ej. "Adelantado +18pp". */
  deviationLabel: string;
  /** Lectura completa a la derecha, p. ej. "98 / 140 ton (70%)". */
  valueLabel: string;
}

/**
 * Segunda línea del recuadro del mes (nodo `3686:25752`). Se exporta para que la
 * exportación a PDF/Excel use LA MISMA copy en vez de una versión paralela.
 */
export const WAREHOUSE_MONTH_ADVICE =
  'Si una barra va muy adelantada, considera diferir retiros o usar el margen de 6 meses de almacenaje.';

export const WAREHOUSE_ACCUMULATION_DEFAULTS: WarehouseAccumulationBar[] = [
  { label: 'Residuos peligrosos', percentage: 70, deviationLabel: 'Adelantado +18pp', valueLabel: '98 / 140 ton (70%)' },
  { label: 'Industriales no peligrosos', percentage: 86, deviationLabel: 'Crítico +34pp', valueLabel: '112 / 130 ton (86%)' },
  { label: 'Domésticos', percentage: 55, deviationLabel: 'Normal +2pp', valueLabel: '28 / 51 ton (55%)' },
];

interface WarehouseMonthlyAccumulatedProps {
  bars?: WarehouseAccumulationBar[];
  /**
   * Fecha de referencia. Se expone como prop para poder fijarla en pruebas; en
   * la app se resuelve con la fecha real del navegador.
   */
  today?: Date;
}

export function WarehouseMonthlyAccumulated({
  bars = WAREHOUSE_ACCUMULATION_DEFAULTS,
  today,
}: WarehouseMonthlyAccumulatedProps) {
  /**
   * `new Date()` es impuro en render, así que se resuelve una sola vez al montar
   * con la inicialización lazy de `useState`. El día y la cantidad de días del
   * mes salen de ahí: el texto "día 16 de 31" del diseño es un ejemplo, no un
   * valor fijo.
   */
  const [mountedAt] = useState(() => today ?? new Date());
  const { day: currentDay, daysInMonth, elapsedPercentage } = getMonthProgress(today ?? mountedAt);

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <WarehouseSectionTitle icon={<WarehouseGaugeIcon className="block size-full" />}>
        Acumulado mensual vs. umbral RCA
      </WarehouseSectionTitle>

      <div className="flex w-full flex-col items-start justify-center gap-[4px] rounded-[8px] border border-solid border-[#e3e3e3] bg-white px-[15px] py-[10px]">
        <div className="flex items-center gap-[6px]">
          <WarehouseCalendarIcon className="block h-[11.5px] w-[10.0625px] shrink-0 text-[#646464]" />
          <p className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#646464]">
            Hoy es el{' '}
            <span className="font-['Inter:Bold',sans-serif] font-bold">
              día {currentDay} de {daysInMonth}
            </span>{' '}
            del mes.
          </p>
        </div>
        <p className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#646464]">
          del mes ({elapsedPercentage}% transcurrido). {WAREHOUSE_MONTH_ADVICE}
        </p>
      </div>

      <div className="w-full rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[21px] py-[19px]">
        <div className="relative w-full">
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-[22px] w-0 border-l-2 border-dashed border-[#001e39] opacity-60"
            style={{ left: `${clampPercentage(elapsedPercentage)}%` }}
          />
          <div
            className="absolute top-0 -translate-x-1/2 rounded-[5px] bg-[#001e39] px-[9px] py-[3px]"
            style={{ left: `${clampPercentage(elapsedPercentage)}%` }}
          >
            <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal] text-[#c8a064]">
              Hoy · día {currentDay} ({elapsedPercentage}% del mes)
            </span>
          </div>

          <div className="flex w-full flex-col gap-[16px] pt-[22px]">
            {bars.map((bar) => (
              <WarehouseAccumulationRow key={bar.label} bar={bar} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WarehouseAccumulationRow({ bar }: { bar: WarehouseAccumulationBar }) {
  const percentage = clampPercentage(bar.percentage);
  const tone = ACCUMULATION_TONE_STYLES[resolveAccumulationTone(percentage)];

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
          {bar.deviationLabel}
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
