import { useMemo, useState } from 'react';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseExportButton, type WarehouseExportOption } from './components/WarehouseExportButton';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteActiveFilterChip, WasteActiveFiltersPanel } from './components/WasteActiveFiltersPanel';
import { WasteCompanyPerformanceCard } from './components/WasteCompanyPerformanceCard';
import { WasteHistoryTable } from './components/WasteHistoryTable';
import { WasteKpiRow, type WasteKpi } from './components/WasteKpiCard';
import { WasteTabs, wasteTabId, wasteTabPanelId, type WasteTab } from './components/WasteTabs';
import { WasteViewIntro } from './components/WasteViewIntro';
import {
  buildHistoryFilterChips,
  buildHistoryFilterOptions,
  EMPTY_WASTE_HISTORY_FILTERS,
  filterHistoryRows,
  type WasteHistoryFilterKey,
  type WasteHistoryFilters,
} from './wasteHistoryFilters';
import { WASTE_COMPANY_PERFORMANCE_DEFAULTS } from './wasteCompanyPerformance';
import { buildWasteHistoryRows } from './wasteHistoryRows';
import { toIsoMonth } from './wasteMonthFilter';

/**
 * "Histórico de retiros" — nodo Figma `3087:15690` del archivo Medio-Ambiente-Core.
 * Se llega desde el rol `WASTE_ENV_APPROVER`, ítem "Histórico" del sidebar
 * (`3087:15707`, que en el nodo es el ítem ACTIVO).
 *
 * Los cinco bloques del cuerpo (`3087:15112`) están integrados:
 *
 *   `3087:15123`  párrafo de entrada          y=20
 *   `3430:2325`   pestañas                    y=59
 *   `3430:2298`   KPIs (4 tarjetas)           y=115
 *   `3813:48473`  filtros activos + exportar  y=213.5
 *   `3087:15171`  tabla + paginación          y=267.5
 *
 * Los `gap-[16px]` son los del nodo: cada bloque arranca 16px después de que
 * termina el anterior (43→59, 99→115, 197.5→213.5, 251.5→267.5).
 *
 * Repite el patrón de composición de `WasteDashboardPage`: el shell de la app no
 * incluye sidebar (`app/App.tsx` es sólo un `<Outlet/>`), así que la página monta
 * `AppSidebar` y `DashboardFrameShell` por su cuenta.
 *
 * TODO EL ESTADO ES DE CLIENTE en esta iteración: las filas salen de
 * `WASTE_HISTORY_ROW_DEFAULTS`, la maqueta del nodo. Cuando exista el endpoint,
 * `rows` pasa a un hook de TanStack Query y `filterHistoryRows` a parámetros de
 * la query; el resto de la vista no cambia.
 */

/** Texto del nodo `3087:15102`, el `<h1>` del header. */
export const WASTE_HISTORY_TITLE = 'Histórico de retiros';

/** Texto del nodo `3087:15124`. */
export const WASTE_HISTORY_DESCRIPTION =
  'Vista consolidada de todos los retiros — peligrosos (con folio SIDREP y aprobación) y no peligrosos (informativo, gestionado por Resiter/Servicios Generales).';

type WasteHistoryTabId = 'detail' | 'performance';

/** Pestañas del nodo `3430:2326`. */
const TABS: WasteTab<WasteHistoryTabId>[] = [
  { id: 'detail', label: 'Detalle de retiros' },
  { id: 'performance', label: 'Desempeño por empresa' },
];

const TABS_BASE_ID = 'waste-history';

/** Una sola alternativa: esta vista todavía no tiene versión PDF. */
const EXPORT_OPTIONS: WarehouseExportOption[] = [{ format: 'xlsx' }];

const PAGE_SIZE = 10;

function WasteHistoryBody() {
  /*
   * "Hoy" se resuelve una vez al montar con la inicialización lazy de
   * `useState`: `new Date()` es impuro en render, y de esa fecha salen tanto los
   * años del selector de meses como el "Mes actual" de la pastilla.
   */
  const [today] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState<WasteHistoryTabId>('detail');
  /*
   * El estado inicial NO está vacío: el nodo arranca filtrado por el mes en
   * curso. Se ve en los dos lugares que leen el mismo dato —la columna
   * "Periodo" muestra un mes concreto (`4230:12131`) y la barra dibuja la
   * pastilla "Mes actual [Nombre del mes]" (`3813:48480`)—, y es lo que hace que
   * el panel azul de "Filtros activos" exista al entrar. Con los filtros vacíos
   * el panel se esconde y la barra queda con el botón "Exportar" suelto, que no
   * es lo que muestra el diseño.
   */
  const [filters, setFilters] = useState<WasteHistoryFilters>(() => ({
    ...EMPTY_WASTE_HISTORY_FILTERS,
    period: toIsoMonth(today),
  }));
  const [page, setPage] = useState(1);

  const rows = useMemo(() => buildWasteHistoryRows(today), [today]);
  const options = useMemo(() => buildHistoryFilterOptions(rows), [rows]);
  const filteredRows = useMemo(() => filterHistoryRows(rows, filters), [rows, filters]);
  const activeFilters = useMemo(
    () => buildHistoryFilterChips(filters, options, toIsoMonth(today)),
    [filters, options, today],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  /*
   * La página se acota en el render y no en un efecto: si un filtro deja menos
   * páginas que la actual, el efecto pintaría una tabla vacía durante un frame
   * antes de corregirse.
   */
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleFilterChange(key: WasteHistoryFilterKey, value: string | null) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    // Cambiar un filtro invalida la página actual: el conjunto es otro.
    setPage(1);
  }

  return (
    /*
     * Cuerpo del nodo `3087:15112`: `px-[28px] pt-[20px]`, igual que
     * `WasteDashboardPage`. El `min-w-[1140px]` es un MÍNIMO, no un ancho fijo:
     * el cuerpo sigue creciendo con el viewport, y lo necesita para que todos los
     * bloques compartan ancho al desbordar.
     */
    <div className="flex w-full min-w-[1140px] flex-col items-start gap-[16px] bg-white px-[28px] pb-[40px] pt-[20px]">
      <WasteViewIntro description={WASTE_HISTORY_DESCRIPTION} />

      <WasteTabs
        baseId={TABS_BASE_ID}
        label="Vistas del histórico de retiros"
        tabs={TABS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'detail' ? (
        <div
          role="tabpanel"
          id={wasteTabPanelId(TABS_BASE_ID, 'detail')}
          aria-labelledby={wasteTabId(TABS_BASE_ID, 'detail')}
          className="flex w-full flex-col items-start gap-[16px]"
        >
          <WasteKpiRow kpis={HISTORY_KPIS} />

          {/* Fila del nodo `3813:48473`: panel a la izquierda, exportar a la derecha. */}
          <div className="flex w-full flex-wrap items-center gap-[12px]">
            {activeFilters.length > 0 ? (
              <WasteActiveFiltersPanel>
                {activeFilters.map((filter) => (
                  <WasteActiveFilterChip
                    key={filter.key}
                    label={filter.label}
                    onRemove={() => handleFilterChange(filter.key, null)}
                  />
                ))}
              </WasteActiveFiltersPanel>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center">
              <WarehouseExportButton
                options={EXPORT_OPTIONS}
                disabled={filteredRows.length === 0}
                disabledHint="No hay retiros que exportar con los filtros aplicados"
              />
            </div>
          </div>

          <WasteHistoryTable
            rows={pageRows}
            filters={filters}
            options={options}
            onFilterChange={handleFilterChange}
            today={today}
            page={currentPage}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            totalRows={filteredRows.length}
            onPageChange={setPage}
          />
        </div>
      ) : (
        /*
         * "Desempeño por empresa" — nodo `3830:63513`, panel `3830:63738`.
         *
         * El `pt-[14px]` es del nodo `3830:63739`: esta pestaña separa un poco
         * más que la de detalle, donde los KPIs arrancan pegados a las pestañas.
         *
         * TIRA CON DESPLAZAMIENTO, no grilla. El nodo dibuja cuatro empresas,
         * pero la vista recibe TODAS las que tengan retiros, así que la cantidad
         * es abierta. Las tarjetas conservan el ancho del diseño y la fila
         * desborda hacia la derecha en vez de repartirse el espacio: con veinte
         * empresas, cuatro columnas elásticas darían tarjetas ilegibles, y
         * apilarlas en varias filas convertiría una comparación lado a lado en un
         * mosaico donde ya no se comparan.
         *
         * El desplazamiento lo toma la tira y no la página, igual que la tabla de
         * la otra pestaña: así el intro, las pestañas y la barra de filtros
         * quedan quietos mientras se recorren las empresas.
         *
         * `items-stretch` —el default del flex— es lo que deja los gráficos a la
         * misma altura aunque las notas midan distinto; la tarjeta lo aprovecha
         * con su `justify-between`.
         */
        <div
          role="tabpanel"
          id={wasteTabPanelId(TABS_BASE_ID, 'performance')}
          aria-labelledby={wasteTabId(TABS_BASE_ID, 'performance')}
          className="w-full overflow-x-auto pt-[14px]"
        >
          <div className="flex w-max items-stretch gap-[14px]">
            {WASTE_COMPANY_PERFORMANCE_DEFAULTS.map((company) => (
              /*
               * 248.688px es el ancho de las tarjetas del nodo `3830:63741`. La
               * segunda mide 251.92 en Figma; no se reproduce esa diferencia de
               * 3px, que es ruido del canvas y no una tarjeta más ancha.
               */
              <div key={company.id} className="flex w-[248.688px] shrink-0">
                <WasteCompanyPerformanceCard company={company} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Las cuatro tarjetas del nodo `3430:2298`, con sus valores de maqueta.
 *
 * Los números van neutros y sólo la nota se colorea, igual que en las otras
 * filas de KPI del módulo: `45%` en `red/900` (#570b1d), `55%` en #0d3862 y el
 * "ton" en el gris de rótulo (#646464).
 */
const HISTORY_KPIS: WasteKpi[] = [
  { label: 'Promedio de retiros por mes', value: '40' },
  { label: 'Peligrosos', value: '18', note: '45%', noteTone: '#570b1d' },
  { label: 'No peligrosos', value: '22', note: '55%', noteTone: '#0d3862' },
  { label: 'Peso total retirado', value: '31,4', note: 'ton', noteTone: '#646464' },
];

export function WasteHistoryPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Histórico de retiros">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_HISTORY_TITLE} />}
        content={
          /* Área desplazable con el header de 56px afuera, como en las demás vistas. */
          <div className="h-[calc(100vh-56px)] w-full overflow-auto">
            <WasteHistoryBody />
          </div>
        }
      />
    </div>
  );
}
