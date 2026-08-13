import { AppSidebar } from '../../shared/layout/AppSidebar';
import {
  useDismissWasteDashboardAlert,
  useWasteDashboardAlerts,
  useWasteDashboardKpis,
  useWasteNonHazardousWithdrawals,
  useWasteRcaThresholds,
} from '../../shared/hooks/useWasteDashboard';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WasteActiveAlerts } from './components/WasteActiveAlerts';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteDashboardKpisSection } from './components/WasteDashboardKpis';
import { WasteNonHazardousWithdrawalsSection } from './components/WasteNonHazardousWithdrawalsChart';
import { WasteRcaThresholdsSection } from './components/WasteRcaThresholdsSection';
import { WasteViewIntro } from './components/WasteViewIntro';

/**
 * "Dashboard Residuos" — nodo Figma `3086:13957` del archivo Medio-Ambiente-Core.
 * Se llega desde el rol `WASTE_ENV_APPROVER` (sidebar `3830:62304`).
 *
 * PANTALLA COMPLETA. Los cuatro bloques del nodo están integrados:
 *
 *   `3086:13809`  párrafo de entrada                      cuerpo
 *   `3086:13811`  KPIs (4 tarjetas)                       fila superior
 *   `3086:13843`  Acumulado mensual vs. umbral RCA        columna izquierda
 *   `3086:13892`  Alertas activas + retiros no peligrosos columna derecha
 *
 * Los `gap-[16px]` del cuerpo son los del nodo: el párrafo termina en y=43 y los
 * KPIs arrancan en y=59; los KPIs terminan en y=141.5 y la grilla en y=157.5.
 *
 * Repite el patrón de composición de `WarehouseControlPage`: el shell de la app
 * no incluye sidebar (`app/App.tsx` es solo un `<Outlet/>`), así que cada página
 * monta `AppSidebar` y `DashboardFrameShell` por su cuenta.
 */

/** Texto del nodo `3086:13788`, el `<h1>` del header. */
export const WASTE_DASHBOARD_TITLE = 'Dashboard Residuos';

/** Texto del nodo `3086:13810`. */
export const WASTE_DASHBOARD_DESCRIPTION =
  'Visión consolidada de residuos peligrosos y no peligrosos — folios SIDREP, cumplimiento de umbrales RCA y retiros no peligrosos.';

function WasteDashboardBody() {
  const kpisQuery = useWasteDashboardKpis();
  const thresholdsQuery = useWasteRcaThresholds();
  const alertsQuery = useWasteDashboardAlerts();
  const withdrawalsQuery = useWasteNonHazardousWithdrawals();
  const dismissAlert = useDismissWasteDashboardAlert();

  return (
    /*
     * Cuerpo del nodo `3086:13798`: `px-[28px] pt-[20px]`, igual que
     * `WarehouseControlBody`. El `pb-[40px]` es el mismo colchón inferior que ya
     * usan las vistas de bodega para que el último bloque no quede pegado al
     * borde del área desplazable.
     *
     * `min-w-[1140px]` es un MÍNIMO, no un ancho fijo: el cuerpo sigue creciendo
     * con el viewport. Lo necesita para que, al desbordar, todos los bloques
     * compartan el mismo ancho y se desplacen juntos.
     */
    <div className="flex w-full min-w-[1140px] flex-col items-start gap-[16px] bg-white px-[28px] pb-[40px] pt-[20px]">
      <WasteViewIntro description={WASTE_DASHBOARD_DESCRIPTION} />

      <WasteDashboardKpisSection
        kpis={kpisQuery.data}
        isLoading={kpisQuery.isLoading}
        isError={kpisQuery.isError}
        onRetry={() => void kpisQuery.refetch()}
      />

      {/*
        Grilla de `3086:13842`: dos columnas separadas por `gap-[16px]`
        (574.539 − 558.539 = 16). La proporción sale de los anchos del nodo
        —558.539 : 469.461 ≈ 1.19 : 1— expresada en `fr` y no en píxeles, porque el
        brief prohíbe anchos fijos de layout. Colapsa a una columna en pantallas
        angostas.

        En la columna derecha, sobre el gráfico, falta "Alertas activas"
        (`3086:13893`); entra en la próxima iteración en el hueco que ya tiene.
      */}
      <div className="grid w-full grid-cols-1 items-start gap-[16px] lg:grid-cols-[minmax(0,1.19fr)_minmax(0,1fr)]">
        <div className="flex w-full flex-col" data-name="Container">
          <WasteRcaThresholdsSection
            thresholds={thresholdsQuery.data}
            isLoading={thresholdsQuery.isLoading}
            isError={thresholdsQuery.isError}
            onRetry={() => void thresholdsQuery.refetch()}
          />
        </div>
        {/*
          Columna derecha del nodo `3086:13892`: alertas arriba, gráfico debajo. La
          separación entre los dos la aporta el `pt-[18px]` del título del gráfico
          (nodo `3086:13927`), que es exactamente para lo que está.
        */}
        <div className="flex w-full flex-col" data-name="Container">
          <WasteActiveAlerts
            alerts={alertsQuery.data?.alerts ?? []}
            isLoading={alertsQuery.isLoading}
            isError={alertsQuery.isError}
            onRetry={() => void alertsQuery.refetch()}
            onDismiss={(alertId) => dismissAlert.mutate(alertId)}
            dismissingId={dismissAlert.isPending ? dismissAlert.variables : undefined}
          />
          <WasteNonHazardousWithdrawalsSection
            months={withdrawalsQuery.data?.months}
            isLoading={withdrawalsQuery.isLoading}
            isError={withdrawalsQuery.isError}
            onRetry={() => void withdrawalsQuery.refetch()}
          />
        </div>
      </div>
    </div>
  );
}

export function WasteDashboardPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Dashboard">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_DASHBOARD_TITLE} />}
        content={
          /*
           * Área desplazable en ambos ejes, con el header de 56px afuera del
           * scroll. Mismo criterio que `WarehouseControlPage`.
           */
          <div className="h-[calc(100vh-56px)] w-full overflow-auto">
            <WasteDashboardBody />
          </div>
        }
      />
    </div>
  );
}
