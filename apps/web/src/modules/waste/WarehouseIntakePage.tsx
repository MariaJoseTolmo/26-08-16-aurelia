import { useMemo, useState } from 'react';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WarehouseIntakeIntro } from './components/WarehouseIntakeIntro';
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

  function handleFilterChange(key: WasteIntakeFilterKey, value: string | null) {
    // Cambiar un filtro vuelve a la primera página: la paginación anterior ya no
    // aplica al conjunto nuevo. Es lo que hace `updateFilter` en inspecciones.
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

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
