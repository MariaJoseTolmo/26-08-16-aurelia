import { useState } from 'react';
import type { WasteRcaThresholdsResponse } from '../../../shared/services/waste-dashboard.service';
import { WarehouseGaugeIcon } from '../icons/WarehouseControlIcons';
import { getMonthProgress } from '../wasteMonthProgress';
import { buildWasteRcaAccumulationBars } from '../wasteRcaThresholds';
import {
  WarehouseMonthProgressNotice,
  WarehouseMonthlyAccumulated,
} from './WarehouseMonthlyAccumulated';
import { WarehouseSectionTitle } from './WarehouseSectionTitle';
import { WasteRcaThresholdsModal } from './WasteRcaThresholdsModal';

/**
 * "Acumulado mensual vs. umbral RCA" del Dashboard Residuos (nodo `3086:13843`),
 * atado a la API.
 *
 * NO redibuja el bloque: usa `WarehouseMonthlyAccumulated` en su variante
 * `dashboard`, que es el mismo componente que ya sirve a Control de bodega. Acá
 * solo vive lo que la tarjeta no puede saber: de dónde salen las barras y qué
 * mostrar mientras no están.
 *
 * ESTADOS QUE EL DISEÑO NO DIBUJA. El nodo solo muestra el caso con datos. La
 * carga y el error reproducen el título y el recuadro del mes —que no dependen de
 * la API, salen de la fecha del navegador— y reemplazan solo la tarjeta de barras,
 * porque es lo único que espera datos.
 */

interface WasteRcaThresholdsSectionProps {
  thresholds: WasteRcaThresholdsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function WasteRcaThresholdsSection({
  thresholds,
  isLoading,
  isError,
  onRetry,
}: WasteRcaThresholdsSectionProps) {
  /*
   * Estado de UI puro y local: qué modal está abierto no es dato de servidor ni se
   * comparte con otra vista, así que no va a Zustand —`STATE_MANAGEMENT.md` pide
   * stores para estado de cliente COMPARTIDO, no para el abierto/cerrado de un
   * diálogo que vive dentro de un solo componente—.
   */
  const [detailOpen, setDetailOpen] = useState(false);
  /*
   * `new Date()` es impuro en render: se resuelve una vez al montar. El avance del
   * mes tiene que ser EL MISMO que usa la tarjeta, porque de él dependen los tonos
   * de las pastillas en los dos lados.
   */
  const [today] = useState(() => new Date());
  if (isLoading || isError) {
    return (
      <div className="flex w-full flex-col">
        <WarehouseSectionTitle icon={<WarehouseGaugeIcon className="block size-full" />}>
          Acumulado mensual vs. umbral RCA
        </WarehouseSectionTitle>
        <WarehouseMonthProgressNotice variant="dashboard" />
        <div className="mt-[10px] w-full rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[21px] py-[19px]">
          {isLoading ? (
            <div className="flex w-full flex-col gap-[16px]" aria-busy="true" aria-live="polite">
              <span className="sr-only">Cargando acumulado mensual…</span>
              {/*
                Tres filas porque son las tres categorías del nodo, con la misma
                geometría de `WarehouseAccumulationRow`: rótulo de 16.5px sobre un
                track de 9px, separados por `gap-[6px]`. La tarjeta conserva su
                alto y no salta cuando llegan los datos.
              */}
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex w-full flex-col gap-[6px]">
                  <div className="h-[16.5px] w-[160px] animate-pulse rounded-[4px] bg-[#ededed]" />
                  <div className="h-[9px] w-full rounded-[5px] bg-[#f7f7f7]" />
                </div>
              ))}
            </div>
          ) : (
            <p
              role="alert"
              className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
            >
              No se pudo cargar el acumulado mensual.{' '}
              <button
                type="button"
                onClick={onRetry}
                className="font-['Inter:Bold',sans-serif] font-bold underline underline-offset-2"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  const categories = thresholds?.categories ?? [];

  /*
   * Sin categorías no se dibuja una tarjeta de barras vacía: el bloque compara
   * contra umbrales RCA, y sin umbrales configurados no hay nada que comparar. Es
   * un estado de configuración, no de datos, así que lo dice.
   */
  if (categories.length === 0) {
    return (
      <div className="flex w-full flex-col">
        <WarehouseSectionTitle icon={<WarehouseGaugeIcon className="block size-full" />}>
          Acumulado mensual vs. umbral RCA
        </WarehouseSectionTitle>
        <WarehouseMonthProgressNotice variant="dashboard" />
        <div className="mt-[10px] w-full rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[21px] py-[19px]">
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
            No hay umbrales RCA configurados para este período.
          </p>
        </div>
      </div>
    );
  }

  const bars = buildWasteRcaAccumulationBars(categories);

  return (
    <>
      <WarehouseMonthlyAccumulated
        variant="dashboard"
        bars={bars}
        today={today}
        onShowDetail={() => setDetailOpen(true)}
      />
      <WasteRcaThresholdsModal
        open={detailOpen}
        bars={bars}
        monthElapsedPercentage={getMonthProgress(today).elapsedPercentage}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
