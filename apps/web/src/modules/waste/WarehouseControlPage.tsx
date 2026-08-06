import { useMemo, useState } from 'react';
import { useWarehouseControlExport } from '../../shared/hooks/useWarehouseControlExport';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import type { WarehouseControlExportFormat } from '../../shared/services/waste-warehouse-export.service';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WAREHOUSE_CONTROL_DESCRIPTION, WarehouseControlIntro } from './components/WarehouseControlIntro';
import { WAREHOUSE_KPI_DEFAULTS, WarehouseControlKpis } from './components/WarehouseControlKpis';
import { DEFAULT_WAREHOUSE_TITLE, WarehouseHeader } from './components/WarehouseHeader';
import { WAREHOUSE_LOT_ROW_DEFAULTS, WarehouseLotsTable } from './components/WarehouseLotsTable';
import {
  WAREHOUSE_ACCUMULATION_DEFAULTS,
  WAREHOUSE_MONTH_ADVICE,
  WarehouseMonthlyAccumulated,
} from './components/WarehouseMonthlyAccumulated';
import {
  WAREHOUSE_EXPIRATION_DEFAULTS,
  WarehouseUpcomingExpirations,
} from './components/WarehouseUpcomingExpirations';
import type { WarehouseControlView } from './warehouseControlExport';
import { formatMonthProgressSentence, getMonthProgress } from './wasteMonthProgress';

interface WarehouseControlBodyProps {
  view: WarehouseControlView;
  today: Date;
  exporting: WarehouseControlExportFormat | null;
  exportError: string | null;
  onExport: (format: WarehouseControlExportFormat) => void;
}

/**
 * Cuerpo de la vista — nodo `3686:25700`:
 * `flex flex-col gap-[16px] items-start pb-[40px] pt-[20px] px-[28px] w-full`.
 *
 * Las dos columnas inferiores vienen de `3686:25736` (`flex gap-[16px]`), con la
 * izquierda en `w-[558.539px]` y la derecha en `flex-[1_0_0]`. Acá se resuelve
 * con un grid que respeta esa proporción (≈1.3 : 1) y colapsa a una columna en
 * pantallas angostas, porque el brief prohíbe anchos fijos de layout.
 *
 * La tabla de lotes es el nodo `3765:42711`. Su encabezado de sección
 * ("Detalle de lotes en bodega") y el chip "Filtros activos" viven en nodos
 * hermanos y quedan para la próxima iteración.
 *
 * `min-w-[1140px]` = 1084px de ancho mínimo de la tabla + los 56px de padding
 * horizontal. Es un MÍNIMO, no un ancho fijo: el cuerpo sigue creciendo con el
 * viewport. Lo necesita para que, al desbordar, todos los bloques compartan el
 * mismo ancho y se desplacen juntos en vez de que solo la tabla se corra.
 *
 * Todos los bloques reciben sus datos por props desde `view`, en vez de caer en
 * sus propios defaults: es lo que garantiza que la exportación a PDF/Excel
 * contenga exactamente lo que está en pantalla.
 */
function WarehouseControlBody({ view, today, exporting, exportError, onExport }: WarehouseControlBodyProps) {
  return (
    <div className="flex w-full min-w-[1140px] flex-col items-start gap-[16px] bg-white px-[28px] pb-[40px] pt-[20px]">
      <WarehouseControlIntro
        description={view.description}
        exporting={exporting}
        exportError={exportError}
        onExport={onExport}
      />
      <WarehouseControlKpis kpis={view.kpis} />
      <div className="grid w-full grid-cols-1 items-stretch gap-[16px] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <WarehouseMonthlyAccumulated bars={view.bars} today={today} />
        <WarehouseUpcomingExpirations items={view.expirations} />
      </div>
      <WarehouseLotsTable rows={view.lots} />
    </div>
  );
}

/**
 * Vista "Control de bodega" del módulo de residuos (nodo Figma `3686:24644`).
 *
 * Replica el patrón de composición de `modules/spr/SprPage.tsx`: el shell de la
 * app no incluye sidebar (`app/App.tsx` es solo un `<Outlet/>`), así que cada
 * página monta `AppSidebar` y `DashboardFrameShell` por su cuenta.
 *
 * Es el dueño del modelo de la vista. Hoy sale de los defaults de cada bloque;
 * cuando se ate a la API, este es el único lugar que cambia —los componentes y
 * la exportación ya trabajan sobre `view`.
 */
export function WarehouseControlPage() {
  /**
   * `new Date()` es impuro en render: se resuelve una sola vez al montar. La
   * fecha se comparte entre el marcador "Hoy" de las barras y la frase de avance
   * del mes que viaja al PDF, así que no puede haber dos lecturas distintas.
   */
  const [today] = useState(() => new Date());
  const exportMutation = useWarehouseControlExport();

  const view = useMemo<WarehouseControlView>(
    () => ({
      title: DEFAULT_WAREHOUSE_TITLE,
      description: WAREHOUSE_CONTROL_DESCRIPTION,
      monthProgressLabel: formatMonthProgressSentence(getMonthProgress(today), WAREHOUSE_MONTH_ADVICE),
      kpis: WAREHOUSE_KPI_DEFAULTS,
      bars: WAREHOUSE_ACCUMULATION_DEFAULTS,
      expirations: WAREHOUSE_EXPIRATION_DEFAULTS,
      lots: WAREHOUSE_LOT_ROW_DEFAULTS,
    }),
    [today],
  );

  const handleExport = (format: WarehouseControlExportFormat) => {
    exportMutation.mutate({ format, view });
  };

  const exportError = exportMutation.error
    ? 'No se pudo generar el archivo. Verifique que la API esté disponible e intente nuevamente.'
    : null;

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Control de bodega">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={view.title} />}
        content={
          /*
           * Área desplazable de la vista completa (nodo `3686:24644`), en ambos
           * ejes. El header de 56px queda fuera del scroll, igual que en
           * `DashboardMainContentShell`; la diferencia es que ahí el eje
           * horizontal va recortado (`overflow-x-clip`) y acá se desplaza.
           */
          <div className="h-[calc(100vh-56px)] w-full overflow-auto">
            <WarehouseControlBody
              view={view}
              today={today}
              exporting={exportMutation.isPending ? exportMutation.variables.format : null}
              exportError={exportError}
              onExport={handleExport}
            />
          </div>
        }
      />
    </div>
  );
}
