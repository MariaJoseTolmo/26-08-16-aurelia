import { useState } from 'react';
import type { WasteDashboardKpisResponse } from '../../../shared/services/waste-dashboard.service';
import { buildWasteDashboardKpis } from '../wasteDashboardKpis';
import { WasteKpiCard, type WasteKpi } from './WasteKpiCard';

/**
 * Fila de KPIs del Dashboard Residuos — nodo `3086:13811`.
 *
 *   contenedor  grid de 4 columnas de 249.5px · gap 14px · fila de 82.5px
 *   tarjetas    `3086:13812` / `13821` / `13828` / `13835` → ver `WasteKpiCard`
 *
 * Dos desvíos deliberados respecto del design context:
 *
 * 1. `grid-cols-[249.5px_249.5px_249.5px_249.5px]` se reemplaza por cuatro
 *    columnas de igual fracción: el brief prohíbe anchos fijos de layout. Los
 *    249.5px son el reparto de los 1044px del cuerpo menos los tres gaps de 14
 *    (1044 − 42 = 1002; 1002 / 4 = 250.5 ≈ 249.5 con el borde), así que cuatro
 *    columnas iguales lo reproducen y además siguen al viewport.
 * 2. `grid-rows-[82.5px]` tampoco se fija: los 82.5px son alto DERIVADO
 *    (17 + 13 + 6 + 29.5 + 17 = 82.5) y el contenido los produce solo. Fijarlo
 *    recortaría el rótulo el día que un KPI necesite dos líneas.
 *
 * Colapsa a dos columnas y a una en pantallas angostas, igual que la fila de
 * "Control de bodega".
 */

interface WasteDashboardKpisProps {
  kpis: WasteKpi[];
}

export function WasteDashboardKpis({ kpis }: WasteDashboardKpisProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <WasteKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

/**
 * Rótulos de las cuatro tarjetas, en el orden del nodo.
 *
 * Los necesitan los estados de carga y de error para dibujar la fila con sus
 * cuatro cajas en su sitio: así la grilla no aparece de golpe cuando llega la
 * respuesta y el aprobador ya sabe qué se está cargando.
 */
const KPI_LABELS = [
  'Retiros peligrosos (mes)',
  '% SIDREP cerrados a tiempo',
  'Folios abiertos',
  'Alertas activas',
] as const;

interface WasteDashboardKpisSectionProps {
  kpis: WasteDashboardKpisResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Adaptador entre la respuesta del servidor y la fila.
 *
 * ESTADOS QUE EL DISEÑO NO DIBUJA. El nodo solo muestra el caso con datos. La
 * carga mantiene las cuatro tarjetas con su rótulo y el valor en un bloque
 * neutro; el error las mantiene también y agrega UNA línea con "Reintentar" para
 * toda la fila, en vez de repetir el mismo mensaje cuatro veces —los cuatro KPIs
 * salen de la MISMA lectura, así que fallan juntos—.
 *
 * `today` se resuelve una vez al montar con la inicialización lazy de `useState`:
 * `new Date()` es impuro en render, y de esa fecha sale el "vs. junio" de la
 * primera tarjeta.
 */
export function WasteDashboardKpisSection({
  kpis,
  isLoading,
  isError,
  onRetry,
}: WasteDashboardKpisSectionProps) {
  const [today] = useState(() => new Date());

  if (isLoading) {
    return (
      <div
        className="grid w-full grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Cargando indicadores de residuos…</span>
        {KPI_LABELS.map((label) => (
          <div
            key={label}
            className="flex flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]"
          >
            <p className="w-full whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#646464]">
              {label}
            </p>
            {/*
              El bloque ocupa el alto exacto de la fila del valor (`h-[29.5px]` del
              nodo `3086:13816`) más su `pt-[6px]`, así que la tarjeta no cambia de
              alto al llegar el dato.
            */}
            <div className="w-full pt-[6px]">
              <div className="h-[29.5px] w-[72px] animate-pulse rounded-[6px] bg-[#ededed]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-[8px]">
        <div className="grid w-full grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          {KPI_LABELS.map((label) => (
            <div
              key={label}
              className="flex flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]"
            >
              <p className="w-full whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#646464]">
                {label}
              </p>
              <div className="flex w-full items-baseline pt-[6px]">
                <span className="font-['Inter:Bold',sans-serif] text-[24px] font-bold not-italic leading-[normal] text-[#acacac]">
                  —
                </span>
              </div>
            </div>
          ))}
        </div>
        <p
          role="alert"
          className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
        >
          No se pudieron cargar los indicadores.{' '}
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

  /*
   * Sin datos y sin error ni carga: la query quedó resuelta con `undefined`. No es
   * un caso de "vacío" con copy propia —cuatro KPIs siempre existen, aunque valgan
   * cero— así que se dibujan los ceros y no un mensaje.
   */
  const resolved: WasteDashboardKpisResponse = kpis ?? {
    hazardousWithdrawalsThisMonth: 0,
    hazardousWithdrawalsPreviousMonth: 0,
    sidrepClosedOnTimePercentage: 0,
    sidrepClosedOnTimeDeltaPoints: 0,
    openFolios: 0,
    openFoliosOverSla: 0,
    activeAlerts: 0,
  };

  return <WasteDashboardKpis kpis={buildWasteDashboardKpis(resolved, today)} />;
}
