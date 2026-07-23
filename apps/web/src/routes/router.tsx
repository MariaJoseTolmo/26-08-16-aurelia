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
import { ReportsPage } from '../modules/reports/ReportsPage';
import { AdminPage } from '../modules/admin/AdminPage';
import { MigrationsPage } from '../modules/migrations/MigrationsPage';
import { RequireAdmin } from '../shared/components/RequireAdmin';
import { RequireAuth } from '../shared/components/RequireAuth';

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
          <MigrationsPage />
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
      { index: true, element: <DashboardPage /> },
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
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'critical-controls', element: <CriticalControlsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
