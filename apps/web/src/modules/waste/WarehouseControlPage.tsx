import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseControlHeader } from './components/WarehouseControlHeader';

/**
 * Vista "Control de bodega" del módulo de residuos (nodo Figma `3686:24537`).
 *
 * Primera iteración: solo el header. El cuerpo de la vista —KPIs, ingresos vs.
 * retiros, próximos vencimientos y tabla de lotes— llega en iteraciones
 * siguientes; `content` queda en `null` para dejar el hueco explícito.
 *
 * Replica el patrón de composición de `modules/spr/SprPage.tsx`: el shell de la
 * app no incluye sidebar (`app/App.tsx` es solo un `<Outlet/>`), así que cada
 * página monta `AppSidebar` y `DashboardFrameShell` por su cuenta.
 */
export function WarehouseControlPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Control de bodega">
      <AppSidebar />
      <DashboardFrameShell header={<WarehouseControlHeader />} content={null} />
    </div>
  );
}
