import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouseIntakeExport } from '../../shared/hooks/useWarehouseIntakeExport';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { DEFAULT_WAREHOUSE_TITLE, WarehouseHeader } from './components/WarehouseHeader';
import { WAREHOUSE_INTAKE_DESCRIPTION, WarehouseIntakeIntro } from './components/WarehouseIntakeIntro';
import { WarehouseIntakeTable } from './components/WarehouseIntakeTable';
import { WarehouseIntakeToolbar } from './components/WarehouseIntakeToolbar';
import {
  buildIntakeFilterChips,
  buildIntakeFilterOptions,
  EMPTY_WASTE_INTAKE_FILTERS,
  filterIntakeRows,
  toIsoDate,
  type WasteIntakeFilterKey,
  type WasteIntakeFilters,
} from './wasteIntakeFilters';
import { buildWarehouseIntakeRows } from './wasteIntakeRows';
import type { WarehouseIntakeView } from './warehouseIntakeExport';

/**
 * Vista "Ingresos a bodega" del módulo de residuos (nodo Figma `3729:27632`).
 *
 * Reutiliza las tres piezas que el nodo comparte con "Control de bodega":
 * `AppSidebar` —que ya implementa el sidebar contextual del nodo `3765:37907`,
 * con "Ingresos a bodega" como sub-ítem activo—, `DashboardFrameShell` y
 * `WarehouseHeader`.
 *
 * Es la dueña del estado de filtros. Un solo objeto `filters` alimenta las tres
 * cosas que dependen de él —las pastillas de "Filtros activos", los controles de
 * la fila de filtros de la tabla y las filas visibles— porque en el diseño son la
 * misma cosa vista desde tres lugares, no tres juegos de filtros distintos.
 *
 * El cuerpo sale de los nodos `3734:28286` (`bg-[#f7f7f7]`) y `3734:28288`
 * (`flex flex-col gap-[14px] items-start px-[22px] py-[18px]`). A diferencia de
 * "Control de bodega" —fondo blanco, `px-[28px] pt-[20px]`— esta vista va sobre
 * gris `#f7f7f7` y su única tarjeta es la tabla.
 */
export function WarehouseIntakePage() {
  /**
   * `new Date()` es impuro en render: se resuelve una sola vez al montar, igual
   * que en `WarehouseControlPage`. La fecha se usa para el filtro por defecto y
   * para las fechas de las filas de muestra, así que no puede haber dos lecturas
   * distintas.
   */
  const [today] = useState(() => new Date());
  const navigate = useNavigate();
  const todayIso = useMemo(() => toIsoDate(today), [today]);
  /** El diseño arranca filtrado por el día en curso: pastilla "[dd-mm-aaaa día de hoy]". */
  const [filters, setFilters] = useState<WasteIntakeFilters>(() => ({
    ...EMPTY_WASTE_INTAKE_FILTERS,
    entryDate: todayIso,
  }));
  const [page, setPage] = useState(1);

  const allRows = useMemo(() => buildWarehouseIntakeRows(today), [today]);
  const rows = useMemo(() => filterIntakeRows(allRows, filters), [allRows, filters]);
  const activeFilters = useMemo(() => buildIntakeFilterChips(filters, todayIso), [filters, todayIso]);
  /**
   * Las alternativas salen del set COMPLETO, no de `rows`: si se derivaran de las
   * filas ya filtradas, elegir una opción borraría del selector todas las demás.
   */
  const filterOptions = useMemo(() => buildIntakeFilterOptions(allRows), [allRows]);

  /**
   * Modelo que se exporta. Son las MISMAS filas y las MISMAS pastillas que se
   * están viendo, no una segunda consulta: por eso el Excel no puede discrepar
   * de la pantalla. Es el patrón de `WarehouseControlView`.
   */
  const exportView = useMemo<WarehouseIntakeView>(
    () => ({
      title: DEFAULT_WAREHOUSE_TITLE,
      description: WAREHOUSE_INTAKE_DESCRIPTION,
      activeFilters,
      rows,
    }),
    [activeFilters, rows],
  );

  const exportMutation = useWarehouseIntakeExport();

  function handleFilterChange(key: WasteIntakeFilterKey, value: string | null) {
    // Cambiar un filtro vuelve a la primera página: la paginación anterior ya no
    // aplica al conjunto nuevo. Es lo que hace `updateFilter` en inspecciones.
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const exportError = exportMutation.error
    ? 'No se pudo generar el archivo. Verifique que la API esté disponible e intente nuevamente.'
    : null;

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Ingresos a bodega">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader />}
        content={
          /*
           * Área desplazable de la vista (nodo `3734:28286`, que en Figma recorta
           * con `overflow-clip`). El header de 56px queda fuera del scroll, igual
           * que en `WarehouseControlPage`; el eje horizontal no se desplaza acá
           * porque lo resuelve la tabla.
           */
          <div className="h-[calc(100vh-56px)] w-full overflow-y-auto bg-[#f7f7f7]">
            <div className="flex w-full flex-col items-start gap-[14px] px-[22px] py-[18px]">
              <WarehouseIntakeIntro />
              <WarehouseIntakeToolbar
                activeFilters={activeFilters}
                entryDate={filters.entryDate}
                onFilterChange={handleFilterChange}
                onExport={() => exportMutation.mutate(exportView)}
                exporting={exportMutation.isPending ? 'xlsx' : null}
                exportError={exportError}
                onNewIntake={() => navigate('/waste/ingresos-bodega/nuevo')}
              />
              <WarehouseIntakeTable
                rows={rows}
                filters={filters}
                options={filterOptions}
                onFilterChange={handleFilterChange}
                page={page}
                onPageChange={setPage}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
