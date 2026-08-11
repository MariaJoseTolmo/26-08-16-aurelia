import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteWithdrawalIntro } from './components/WasteWithdrawalIntro';
import { WasteWithdrawalTable } from './components/WasteWithdrawalTable';
import { WasteWithdrawalToolbar } from './components/WasteWithdrawalToolbar';
import { toIsoMonth } from './wasteMonthFilter';
import {
  buildWithdrawalFilterChips,
  buildWithdrawalFilterOptions,
  EMPTY_WASTE_WITHDRAWAL_FILTERS,
  filterWithdrawalRows,
  type WasteWithdrawalFilterKey,
  type WasteWithdrawalFilters,
} from './wasteWithdrawalFilters';
import { buildWasteWithdrawalRows } from './wasteWithdrawalRows';

/**
 * Vista "Solicitud de retiro" del módulo de residuos (nodo Figma `3765:38015`).
 *
 * También es la dueña de la ruta que habilita el sub-ítem "Solicitud de retiro"
 * del sidebar: sin `to`, `findActiveModule` no resuelve el módulo activo y el
 * sidecar contextual del nodo `3817:57726` nunca se renderiza con ese sub-ítem
 * resaltado.
 *
 * Las tres piezas del nodo que ya existían se reutilizan tal cual:
 *
 *   `3817:57686`  → `AppSidebar` (barra de marca + sidebar contextual)
 *   `3765:38124`  → `WarehouseHeader` (mismo título "Bodega de acopio - Plataforma 18")
 *   `3765:38123`  → `DashboardFrameShell` (columna derecha `left-[220px] right-0`)
 *
 * El cuerpo sale de `3765:38496` (`Main Content`) y `3765:38498`: fondo
 * `#f7f7f7` y contenido en `px-[22px] py-[18px]` con `gap-[14px]` entre
 * bloques —la intro de `3765:38499` arranca en `x=22, y=18`, la barra de
 * acciones de `3817:55645` en `y=80` (48 + 14) y la tabla de `3817:55311` en
 * `y=132` (38 + 14)—. Es la misma geometría que "Ingresos a bodega".
 *
 * Es la dueña del estado de filtros, como `WarehouseIntakePage`. Un solo objeto
 * `filters` alimenta las tres cosas que dependen de él —las pastillas de "Filtros
 * activos", los controles de la fila de filtros de la tabla y las filas visibles—
 * porque en el diseño son la misma cosa vista desde tres lugares, no tres juegos
 * de filtros distintos.
 */
export function WasteWithdrawalRequestPage() {
  /**
   * `new Date()` es impuro en render: se resuelve una sola vez al montar, igual
   * que en `WarehouseControlPage` y `WarehouseIntakePage`. La misma lectura de
   * "hoy" decide el período por defecto, la aclaración "Mes actual" de la
   * pastilla, los años que ofrece el selector y las fechas de las filas de
   * muestra; con dos lecturas distintas podrían discrepar al cruzar la medianoche
   * de fin de mes.
   */
  const [today] = useState(() => new Date());
  const navigate = useNavigate();
  const currentIsoMonth = useMemo(() => toIsoMonth(today), [today]);
  /** El diseño arranca filtrado por el período en curso: pastilla "Mes actual [Nombre del mes]". */
  const [filters, setFilters] = useState<WasteWithdrawalFilters>(() => ({
    ...EMPTY_WASTE_WITHDRAWAL_FILTERS,
    period: currentIsoMonth,
  }));
  const [page, setPage] = useState(1);

  const allRows = useMemo(() => buildWasteWithdrawalRows(today), [today]);
  const rows = useMemo(() => filterWithdrawalRows(allRows, filters), [allRows, filters]);
  const activeFilters = useMemo(
    () => buildWithdrawalFilterChips(filters, currentIsoMonth),
    [filters, currentIsoMonth],
  );
  /**
   * Las alternativas salen del set COMPLETO, no de `rows`: si se derivaran de las
   * filas ya filtradas, elegir un destinatario borraría del selector todos los demás.
   */
  const filterOptions = useMemo(() => buildWithdrawalFilterOptions(allRows), [allRows]);

  function handleFilterChange(key: WasteWithdrawalFilterKey, value: string | null) {
    // Cambiar un filtro vuelve a la primera página: la paginación anterior ya no
    // aplica al conjunto nuevo. Es lo que hace `WarehouseIntakePage`.
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Solicitud de retiro">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader />}
        content={
          <div className="h-[calc(100vh-56px)] w-full overflow-y-auto bg-[#f7f7f7]">
            <div className="flex w-full flex-col items-start gap-[14px] px-[22px] py-[18px]">
              <WasteWithdrawalIntro />
              <WasteWithdrawalToolbar
                activeFilters={activeFilters}
                period={filters.period}
                today={today}
                onFilterChange={handleFilterChange}
                /*
                 * Sin endpoint de retiros en `waste-warehouse-export.service` no
                 * hay nada que descargar. El botón se dibuja igual —está en el
                 * nodo— pero bloqueado: un menú cuyas opciones no hacen nada
                 * engaña más que un control deshabilitado.
                 */
                exportDisabled
                onNewRequest={() => navigate('/waste/solicitud-retiro/nueva')}
              />
              <WasteWithdrawalTable
                rows={rows}
                filters={filters}
                options={filterOptions}
                onFilterChange={handleFilterChange}
                today={today}
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
