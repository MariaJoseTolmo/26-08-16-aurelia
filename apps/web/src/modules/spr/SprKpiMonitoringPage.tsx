import { SPR_KPI_MONITORING } from './sprKpiMonitoring.constants';
import { SprKpiMonitoringView } from './SprKpiMonitoringView';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';

function SprKpiMonitoringPageHeader() {
  return (
    <div className="relative h-[56px] w-full shrink-0 bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 border-b border-solid border-[#e3e3e3]" />
      <div className="relative flex size-full items-center px-[22px] pb-px">
        <div className="flex min-w-0 flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[16px] font-bold text-[#131313]">
            {SPR_KPI_MONITORING.pageTitle}
          </p>
          <p className="truncate pt-px font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">
            {SPR_KPI_MONITORING.pageSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Monitoreo de KPIs — Especialista Sustentabilidad (Figma 2441:5221). */
export function SprKpiMonitoringPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AppSidebar />
      <DashboardFrameShell header={<SprKpiMonitoringPageHeader />} content={<SprKpiMonitoringView />} />
    </div>
  );
}
