import { createBrowserRouter } from 'react-router-dom';
import { App } from '../app/App';
import { LoginPage } from '../modules/auth/LoginPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { InspectionsPage } from '../modules/inspections/InspectionsPage';
import { InspectionsHistoryPage } from '../modules/inspections/InspectionsHistoryPage';
import { NotificationDeepLinkPage } from '../modules/notifications/NotificationDeepLinkPage';
import { SprPage } from '../modules/spr/SprPage';
import { SprAreaPage } from '../modules/spr/SprAreaPage';
import { SprReportPage } from '../modules/spr/SprReportPage';
import { SprReportAreaPage } from '../modules/spr/SprReportAreaPage';
import { SprConsolidatedReportPage } from '../modules/spr/SprConsolidatedReportPage';
import { SprCycleTraceabilityPage } from '../modules/spr/SprCycleTraceabilityPage';
import { SprKpiMonitoringPage } from '../modules/spr/SprKpiMonitoringPage';
import { IncidentsPage } from '../modules/incidents/IncidentsPage';
import { CriticalControlsPage } from '../modules/critical-controls/CriticalControlsPage';
import { WarehouseControlPage } from '../modules/waste/WarehouseControlPage';
import { WarehouseIntakePage } from '../modules/waste/WarehouseIntakePage';
import { WarehouseIntakeFormPage } from '../modules/waste/WarehouseIntakeFormPage';
import { WasteWithdrawalRequestPage } from '../modules/waste/WasteWithdrawalRequestPage';
import { WasteWithdrawalFormPage } from '../modules/waste/WasteWithdrawalFormPage';
import { WasteSidrepDocumentsPage } from '../modules/waste/WasteSidrepDocumentsPage';
import { WasteSidrepSupportDocsPage } from '../modules/waste/WasteSidrepSupportDocsPage';
import { ReportsPage } from '../modules/reports/ReportsPage';
import { AdminPage } from '../modules/admin/AdminPage';
import { MigrationsOperationsPage } from '../modules/migrations/MigrationsOperationsPage';
import { RequireAdmin } from '../shared/components/RequireAdmin';
import { RequireAuth } from '../shared/components/RequireAuth';
import { HomeRoute } from './HomeRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/notifications/open/:token',
    element: <NotificationDeepLinkPage />,
  },
  {
    path: '/migrations',
    element: (
      <RequireAuth>
        <RequireAdmin>
          <MigrationsOperationsPage />
        </RequireAdmin>
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'inspections/dashboard', element: <DashboardPage /> },
      { path: 'inspections', element: <InspectionsPage /> },
      { path: 'inspections/history', element: <InspectionsHistoryPage /> },
      { path: 'spr', element: <SprPage /> },
      { path: 'spr/mi-area', element: <SprAreaPage /> },
      { path: 'spr/reporte', element: <SprReportPage /> },
      { path: 'spr/reporte/consolidado', element: <SprConsolidatedReportPage /> },
      { path: 'spr/reporte/trazabilidad', element: <SprCycleTraceabilityPage /> },
      { path: 'spr/monitoreo-kpis', element: <SprKpiMonitoringPage /> },
      { path: 'spr/reporte/area/:areaSlug', element: <SprReportAreaPage /> },
      { path: 'waste/control-bodega', element: <WarehouseControlPage /> },
      { path: 'waste/ingresos-bodega', element: <WarehouseIntakePage /> },
      { path: 'waste/ingresos-bodega/nuevo', element: <WarehouseIntakeFormPage /> },
      { path: 'waste/solicitud-retiro', element: <WasteWithdrawalRequestPage /> },
      { path: 'waste/solicitud-retiro/nueva', element: <WasteWithdrawalFormPage /> },
      { path: 'waste/solicitud-retiro/nueva/sidrep', element: <WasteSidrepDocumentsPage /> },
      { path: 'waste/solicitud-retiro/nueva/sidrep/respaldos', element: <WasteSidrepSupportDocsPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'critical-controls', element: <CriticalControlsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
