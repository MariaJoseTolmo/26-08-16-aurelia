import { useParams, useSearchParams } from 'react-router-dom';
import { SPR_REPORT_DASHBOARD, SPR_REPORT_FLOW_QUERY, resolveSprReportAreaDetail } from './spr.constants';
import { SprReportAreaView } from './SprReportAreaView';
import { useSprReportAreaRealDetail } from '../../shared/hooks/useSprReportAreaRealDetail';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import {
  SPR_REPORT_CYCLE_QUERY,
  buildSprReportDashboardHref,
  resolveSprReportCycleContext,
  sprReportCycleTriggerLabel,
  type SprReportCycle,
} from './sprReportCycles';

function SprReportAreaPageHeader({
  cycle,
  withEstimates,
}: {
  cycle: SprReportCycle;
  withEstimates: boolean;
}) {
  return (
    <div className="relative h-[56px] w-full shrink-0 bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 border-b border-solid border-[#e3e3e3]" />
      <div className="relative flex size-full items-center justify-between gap-[12px] px-[22px] pb-px">
        <div className="flex min-w-0 flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[15px] font-bold text-[#131313]">
            {SPR_REPORT_DASHBOARD.pageTitle}
          </p>
          <p className="truncate pt-px font-['Inter:Regular',sans-serif] text-[11px] text-[#646464]">
            Ciclo {cycle.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <div className="flex h-[26px] items-center gap-[6px] rounded-[6px] border border-[#e3e3e3] bg-white px-[8px]">
            <span className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#131313]">
              {withEstimates ? cycle.label : sprReportCycleTriggerLabel(cycle)}
            </span>
            {withEstimates ? (
              <span className="rounded-[4px] bg-[#f3e8ff] px-[6px] py-[1px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#7b4fbf]">
                {SPR_REPORT_DASHBOARD.cycleWithEstimatesBadge}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            title="Pendiente de integración con historial del ciclo"
            className="flex h-[27px] items-center rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b]"
          >
            {SPR_REPORT_DASHBOARD.traceabilityLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Detalle de área — Especialista.
 * Pendiente / En consolidado / Completa: datos reales del ciclo en ?ciclo=.
 * Estimados: mock hasta el siguiente paso.
 */
export function SprReportAreaPage() {
  const { areaSlug } = useParams<{ areaSlug: string }>();
  const [searchParams] = useSearchParams();
  const { cycle } = resolveSprReportCycleContext(
    searchParams.get(SPR_REPORT_CYCLE_QUERY),
    searchParams.get(SPR_REPORT_FLOW_QUERY),
  );

  const mockResolved = resolveSprReportAreaDetail(areaSlug);
  const realQuery = useSprReportAreaRealDetail(
    areaSlug,
    cycle.periodYear,
    cycle.periodMonth,
    cycle.label,
  );

  const realResolved = realQuery.resolved;
  const isLoadingReal = Boolean(areaSlug) && realQuery.isLoading;
  const resolved = realResolved
    ? { area: { name: realResolved.areaName, slug: areaSlug ?? '' }, detail: realResolved.detail }
    : isLoadingReal
      ? null
      : mockResolved;

  const withEstimates = resolved?.detail.viewMode === 'estimated';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AppSidebar />
      <DashboardFrameShell
        header={<SprReportAreaPageHeader cycle={cycle} withEstimates={Boolean(withEstimates)} />}
        content={
          isLoadingReal ? (
            <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#f7f7f7] px-[22px]">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
                Cargando detalle del área…
              </p>
            </div>
          ) : resolved ? (
            <SprReportAreaView
              areaName={resolved.area.name}
              detail={resolved.detail}
              backHref={buildSprReportDashboardHref(cycle)}
            />
          ) : (
            <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#f7f7f7] px-[22px]">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">
                Esta área aún no tiene detalle de consolidado disponible (Pendiente, En consolidado y
                Completa ya están conectados al catálogo real).
              </p>
            </div>
          )
        }
      />
    </div>
  );
}
