import { useMemo } from 'react';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useSprParameters } from '../../shared/hooks/useSprParameters';
import { useSprMonthlyRecords } from '../../shared/hooks/useSprMonthlyRecords';
import { useSessionStore } from '../../shared/stores/session.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { SprAreaView } from './SprAreaView';
import { SPR_ACTIVE_CYCLE, SPR_AREA_REVIEW } from './spr.constants';
import { resolveSprAreaDisplayMode } from './sprAreaStatus';
import { isSprFormAreaAutomatic, SPR_FORM_FLOW_COPY } from './sprFormFlow.constants';

function SprAreaPageHeader() {
  const areaName = useSessionStore((state) => state.user?.areaName ?? null);
  const areaLabel = areaName?.trim() || 'Sin área';
  const isAutomaticArea = isSprFormAreaAutomatic(areaName);
  const parametersQuery = useSprParameters();
  const recordsQuery = useSprMonthlyRecords({
    periodYear: SPR_ACTIVE_CYCLE.periodYear,
    periodMonth: SPR_ACTIVE_CYCLE.periodMonth,
  });

  const displayMode = useMemo(
    () =>
      resolveSprAreaDisplayMode(recordsQuery.data, parametersQuery.data?.length ?? 0, {
        isAutomaticArea,
      }),
    [isAutomaticArea, recordsQuery.data, parametersQuery.data?.length],
  );

  const subtitle =
    displayMode === 'pending_review'
      ? isAutomaticArea
        ? `${SPR_FORM_FLOW_COPY.managerAutomaticReadyTitle} · ${SPR_ACTIVE_CYCLE.label}`
        : SPR_AREA_REVIEW.pageSubtitle(SPR_ACTIVE_CYCLE.label)
      : `Ciclo ${SPR_ACTIVE_CYCLE.label} · Gerente de Área · ${areaLabel}`;

  return (
    <div className="relative h-[56px] w-full shrink-0 bg-white" data-name="Header">
      <div aria-hidden className="pointer-events-none absolute inset-0 border-b border-solid border-[#e3e3e3]" />
      <div className="relative flex size-full items-center px-[22px] pb-px">
        <div className="flex flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[15px] font-bold leading-[normal] text-[#131313]">
            SPR — Mi Área · {areaLabel}
          </p>
          <p className="whitespace-nowrap pt-px font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SprAreaPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="SPR - Mi área">
      <AppSidebar />
      <DashboardFrameShell header={<SprAreaPageHeader />} content={<SprAreaView />} />
    </div>
  );
}
