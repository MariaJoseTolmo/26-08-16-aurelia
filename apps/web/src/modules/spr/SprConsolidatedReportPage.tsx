import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSprCycle } from '../../shared/hooks/useSprCycle';
import { useSprCycleSacSubmission } from '../../shared/hooks/useSprCycleSacSubmission';
import {
  SPR_CONSOLIDATED_FLOW,
  SPR_CONSOLIDATED_FLOW_QUERY,
  SPR_CONSOLIDATED_REPORT,
  resolveSprConsolidatedFlow,
} from './spr.constants';
import {
  isConsolidatedFlowDrivenBySac,
  resolveConsolidatedSacLayoutMode,
} from './sprConsolidatedSacLayout';
import { SPR_CYCLE_TRACEABILITY_ROUTE } from './sprCycleTraceability.constants';
import { resolveSprReportCycleContext, SPR_REPORT_CYCLE_QUERY } from './sprReportCycles';
import { SprReportCycleSelector } from './components/SprReportCycleSelector';
import { SprConsolidatedReportView } from './SprConsolidatedReportView';
import { SprTraceabilityIcon } from './icons/SprIcons';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';

function SprConsolidatedReportPageHeader() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cycle } = resolveSprReportCycleContext(
    searchParams.get(SPR_REPORT_CYCLE_QUERY),
    searchParams.get('estado'),
  );
  const flow = resolveSprConsolidatedFlow(searchParams.get(SPR_CONSOLIDATED_FLOW_QUERY));
  const sprCycleQuery = useSprCycle(cycle.periodYear, cycle.periodMonth);
  const sacQuery = useSprCycleSacSubmission(sprCycleQuery.cycle?.id);
  const isRealSacEnviado =
    isConsolidatedFlowDrivenBySac(flow) &&
    resolveConsolidatedSacLayoutMode(sacQuery.submission) === 'enviado';
  const isRealSacPreparing =
    isConsolidatedFlowDrivenBySac(flow) &&
    resolveConsolidatedSacLayoutMode(sacQuery.submission) === 'preparing';
  const tab = searchParams.get('tab');
  const usesShortSubtitle =
    isRealSacEnviado ||
    isRealSacPreparing ||
    (flow === SPR_CONSOLIDATED_FLOW.sacDisponible && tab === 'consolidado'
      ? false
      : flow === SPR_CONSOLIDATED_FLOW.sacPreparando ||
        flow === SPR_CONSOLIDATED_FLOW.sacDisponible ||
        flow === SPR_CONSOLIDATED_FLOW.sacReabierto ||
        flow === SPR_CONSOLIDATED_FLOW.consolidadoEnviado ||
        flow === SPR_CONSOLIDATED_FLOW.firmaGerente ||
        flow === SPR_CONSOLIDATED_FLOW.firmasCompletas ||
        flow === SPR_CONSOLIDATED_FLOW.validacionDiscrepancia ||
        flow === SPR_CONSOLIDATED_FLOW.validacionDiscrepanciaPostFirma ||
        flow === SPR_CONSOLIDATED_FLOW.validacionAprobada ||
        flow === SPR_CONSOLIDATED_FLOW.cicloCerrado);
  const subtitle = usesShortSubtitle
    ? SPR_CONSOLIDATED_REPORT.pageSubtitleShort(cycle.label)
    : SPR_CONSOLIDATED_REPORT.pageSubtitle(cycle.label);

  return (
    <div className="relative h-[56px] w-full shrink-0 bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 border-b border-solid border-[#e3e3e3]" />
      <div className="relative flex size-full items-center gap-[14px] px-[22px] pb-px">
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[16px] font-bold leading-normal text-[#131313]">
            {SPR_CONSOLIDATED_REPORT.pageTitle}
          </p>
          <p className="truncate pt-px font-['Inter:Regular',sans-serif] text-[11px] leading-normal text-[#646464]">
            {subtitle}
          </p>
        </div>
        <SprReportCycleSelector cycle={cycle} />
        <button
          type="button"
          onClick={() => navigate(SPR_CYCLE_TRACEABILITY_ROUTE)}
          className="flex h-[27px] shrink-0 items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b]"
        >
          <SprTraceabilityIcon className="h-[11px] w-[13.75px] shrink-0" />
          {SPR_CONSOLIDATED_REPORT.traceabilityLabel}
        </button>
      </div>
    </div>
  );
}

export function SprConsolidatedReportPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AppSidebar />
      <DashboardFrameShell header={<SprConsolidatedReportPageHeader />} content={<SprConsolidatedReportView />} />
    </div>
  );
}
