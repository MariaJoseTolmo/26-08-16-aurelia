import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useSessionStore } from '../../shared/stores/session.store';
import { useSprParameters } from '../../shared/hooks/useSprParameters';
import { useSprMonthlyRecords } from '../../shared/hooks/useSprMonthlyRecords';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { SprFormCycleSelector } from './components/SprFormCycleSelector';
import { SprFormView } from './SprFormView';
import { isSprFormCycleEstimatesMode, resolveSprFormCycle, SPR_FORM_CYCLE_QUERY } from './sprFormCycles';
import { isSprFormSubmitted } from './sprSubmittedStatus';

function SprPageHeader() {
  const user = useSessionStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const cycle = resolveSprFormCycle(searchParams.get(SPR_FORM_CYCLE_QUERY));
  const parametersQuery = useSprParameters(user?.areaId);
  const recordsQuery = useSprMonthlyRecords({
    periodYear: cycle.periodYear,
    periodMonth: cycle.periodMonth,
    areaId: user?.areaId ?? undefined,
  });

  const isSubmitted = useMemo(
    () =>
      isSprFormSubmitted(recordsQuery.data, parametersQuery.data?.length ?? 0, {
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
      }),
    [cycle.periodMonth, cycle.periodYear, parametersQuery.data?.length, recordsQuery.data],
  );

  const subtitle =
    isSubmitted || isSprFormCycleEstimatesMode(cycle)
      ? `Vista: ${user?.fullName ?? 'Usuario'} · Responsable de Área · Servicios Técnicos`
      : 'Carga mensual de parámetros del período activo';

  return (
    <div className="relative h-[56px] w-full shrink-0 bg-white" data-name="Header">
      <div aria-hidden className="pointer-events-none absolute inset-0 border-b border-solid border-[#e3e3e3]" />
      <div className="relative flex size-full items-center justify-between gap-[12px] px-[22px] pb-px">
        <div className="min-w-0 flex flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[15px] font-bold leading-[normal] text-[#131313]">
            SPR — Mi formulario · Servicios Técnicos
          </p>
          <p className="truncate pt-px font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464]">
            {subtitle}
          </p>
        </div>
        <SprFormCycleSelector cycle={cycle} className="shrink-0" />
      </div>
    </div>
  );
}

export function SprPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="SPR - Mi formulario">
      <AppSidebar />
      <DashboardFrameShell header={<SprPageHeader />} content={<SprFormView />} />
    </div>
  );
}
