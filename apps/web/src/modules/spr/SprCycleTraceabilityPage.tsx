import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { SPR_REPORT_CICLO_CERRADO_DEMO_HREF } from './spr.constants';
import { SPR_CYCLE_TRACEABILITY, type SprCycleTraceabilityFilterId } from './sprCycleTraceability.constants';
import { resolveSprReportCycleContext, SPR_REPORT_CYCLE_QUERY } from './sprReportCycles';
import { SprReportCycleSelector } from './components/SprReportCycleSelector';
import { SprCycleTraceabilityToolbar, SprCycleTraceabilityView } from './SprCycleTraceabilityView';
import { SprTraceabilityIcon } from './icons/SprIcons';
import { canAccessSprReport, resolveSessionUserRoles, resolveSprDefaultRoute } from './sprAccess';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { useSessionStore } from '../../shared/stores/session.store';

function SprCycleTraceabilityPageHeader() {
  const [searchParams] = useSearchParams();
  const { cycle } = resolveSprReportCycleContext(
    searchParams.get(SPR_REPORT_CYCLE_QUERY),
    searchParams.get('estado'),
  );

  return (
    <div className="relative h-[56px] w-full shrink-0 bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 border-b border-solid border-[#e3e3e3]" />
      <div className="relative flex size-full items-center justify-between gap-[12px] px-[22px] pb-px">
        <div className="flex min-w-0 flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[16px] font-bold text-[#131313]">
            {SPR_CYCLE_TRACEABILITY.pageTitle}
          </p>
          <p className="truncate pt-px font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">
            {SPR_CYCLE_TRACEABILITY.pageSubtitle(cycle.label)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <SprReportCycleSelector cycle={cycle} />
          <button
            type="button"
            disabled
            className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-[#f7f7f7] px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#acacac]"
          >
            <SprTraceabilityIcon className="h-[11px] w-[13.75px] shrink-0" />
            Ver trazabilidad del ciclo
          </button>
        </div>
      </div>
    </div>
  );
}

// Trazabilidad completa del ciclo SPR (Figma 1831:51316 / 2670:1398). Accesible a todas las áreas SPR.
export function SprCycleTraceabilityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<SprCycleTraceabilityFilterId>('all');
  const user = useSessionStore((state) => state.user);
  const roles = resolveSessionUserRoles(user);
  const { cycle } = resolveSprReportCycleContext(
    searchParams.get(SPR_REPORT_CYCLE_QUERY),
    searchParams.get('estado'),
  );

  const backHref = canAccessSprReport(roles) ? SPR_REPORT_CICLO_CERRADO_DEMO_HREF : resolveSprDefaultRoute(roles);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AppSidebar />
      <DashboardFrameShell
        header={<SprCycleTraceabilityPageHeader />}
        content={
          <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
            <SprCycleTraceabilityToolbar
              onBack={() => navigate(backHref)}
              filter={filter}
              onFilterChange={setFilter}
              cycleLabel={cycle.label}
            />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SprCycleTraceabilityView filter={filter} />
            </div>
          </div>
        }
      />
    </div>
  );
}
