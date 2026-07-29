import { useMemo, useState } from 'react';
import svgPaths from "./svg-gaoncjys4y";
import { useDashboardChartsFiltered } from './hooks/useDashboardChartsFiltered';
import { useDashboardCompanyAnalysisFiltered } from './hooks/useDashboardCompanyAnalysisFiltered';
import { useDashboardKpisFiltered } from './hooks/useDashboardKpisFiltered';
import { useDashboardDetailsFiltered } from './hooks/useDashboardDetailsFiltered';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useInspectionDashboardCompanies } from '../../shared/hooks/useInspectionDashboardCompanies';
import type { InspectionDashboardPeriod } from '../../shared/services/inspections.service';
import {
  DashboardAreaObservationsCard,
  DashboardAreaObservationsHeaderPrimary,
  DashboardAreaObservationsHeaderSecondary,
  DashboardAnnualKpiClosedCard,
  DashboardAnnualKpiFindingsCard,
  DashboardCoreAnalysisSection,
  DashboardAnnualKpiInspectionsCard,
  DashboardAnnualKpiOpenCard,
  DashboardAlertsHeaderLeft,
  DashboardFrameShell,
  DashboardAlertsSectionLayout,
  DashboardAlertsStrip,
  DashboardChartsBlock,
  DashboardChartsPrimaryGrid,
  DashboardMainContentShell,
  DashboardMainPanelsLayout,
  DashboardSecondaryPanelStack,
  DashboardPageHeader,
  DashboardTopKpis,
} from './components/DashboardSections';
import {
  DashboardFigmaAnnualFindingsChartCard,
  DashboardFigmaAnnualInspectionsChartCard,
} from './components/DashboardFigmaChartCards';
import {
  DashboardFigmaClosureGaugeChartCard,
  DashboardFigmaFindingsEvolutionChartCard,
} from './components/DashboardFigmaSecondaryChartCards';
import { DashboardFigmaAreaObservationsChart } from './components/DashboardFigmaAreaObservationsChart';
import { DashboardResponsiveSecondaryGrid } from './components/DashboardResponsiveSecondaryGrid';
import { DashboardResponsiveTopKpisGrid } from './components/DashboardResponsiveTopKpisGrid';
import { DashboardResponsiveCompanyAnalysisSection } from './components/DashboardResponsiveCompanyAnalysisSection';
import { DashboardFigmaCompanyAnalysisChart } from './components/DashboardFigmaCompanyAnalysisChart';
import { DashboardFigmaOpenFindingsDetailsTable } from './components/DashboardFigmaOpenFindingsDetailsTable';
import { DashboardPeriodLite, getCurrentDashboardPeriod } from './components/DashboardPeriodLite';
import { DashboardCompanyFilter } from './components/DashboardCompanyFilter';
import { DashboardDynamicClosureKpiCard } from './components/DashboardDynamicClosureKpiCard';
import {
  DashboardCompanyCardOpenCompanies,
  DashboardCompanyCardOpenDays,
  DashboardCompanyCardOpenFindings,
  DashboardCompanyCardOpenInspections,
} from './components/DashboardFigmaCompanyKpiCards';

const currentYear = new Date().getFullYear();

function AnnualDashboardHeaderTitle() {
  return (
    <div className="flex min-w-[320px] shrink-0 items-center gap-[12px]">
      <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[#e6f3ff]">
        <svg className="size-[18px]" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
          <path d={svgPaths.p26a85e00} fill="#1f5f91" />
        </svg>
      </div>
      <div className="flex shrink-0 flex-col items-start justify-center">
        <p className="font-['Inter:Bold',sans-serif] text-[16px] font-bold leading-[normal] text-[#131313]">Análisis anual de hallazgos</p>
        <p className="font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464]">Cumplimiento, evolución temporal y distribución por área</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [dashboardQuery, setDashboardQuery] = useState({ year: currentYear, period: getCurrentDashboardPeriod() as InspectionDashboardPeriod });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const companyDashboardQuery = { ...dashboardQuery, companyId: selectedCompanyId };
  const companiesQuery = useInspectionDashboardCompanies();
  const { runtimeModel: kpisRuntimeModel, isLoading: isKpisLoading, isError: isKpisError } = useDashboardKpisFiltered(dashboardQuery);
  const { annualInspectionRows, monthlySeriesRows, areaObservationRows, closureMetrics, isLoading: isChartsLoading, isError: isChartsError } = useDashboardChartsFiltered(dashboardQuery);
  const { runtimeModel: companyAnalysisRuntimeModel } = useDashboardCompanyAnalysisFiltered(companyDashboardQuery);
  const { rows: openFindingRows, severeOpenFindings, openInspections, isLoading: isOpenFindingsLoading, isError: isOpenFindingsError } = useDashboardDetailsFiltered(companyDashboardQuery);

  const selectedYearClosureRate = useMemo(() => {
    const selectedYear = annualInspectionRows.find((row) => row.year === dashboardQuery.year);
    const closed = selectedYear?.closed ?? 0;
    const total = closed + (selectedYear?.open ?? 0);
    return total > 0 ? (closed / total) * 100 : 0;
  }, [annualInspectionRows, dashboardQuery.year]);

  const historicalReferenceLabel = useMemo(() => {
    const years = annualInspectionRows.map((row) => row.year).filter((year) => Number.isFinite(year));
    if (years.length === 0) return `referencia hasta ${dashboardQuery.year}`;
    return `referencia ${Math.min(...years)}–${Math.max(...years)}`;
  }, [annualInspectionRows, dashboardQuery.year]);

  const companyFilterOptions = useMemo(() => {
    const fromQuery = (companiesQuery.data ?? []).map((company) => ({ id: (company.id ?? '').trim(), name: (company.name ?? '').trim() }));

    const fromAnalysis = companyAnalysisRuntimeModel.chartRows
      .filter((row) => Boolean((row.companyId ?? '').trim() && (row.company ?? '').trim()))
      .map((row) => ({ id: (row.companyId as string).trim(), name: (row.company ?? '').trim() }));

    const fromOpenFindings = openFindingRows
      .filter((row) => Boolean((row.companyId ?? '').trim() && (row.company ?? '').trim()))
      .map((row) => ({ id: (row.companyId as string).trim(), name: (row.company ?? '').trim() }));

    const merged = [...fromQuery, ...fromAnalysis, ...fromOpenFindings];
    const byId = new Map<string, { id: string; name: string }>();
    merged.forEach((item) => {
      if (!item.id || !item.name) return;
      if (!byId.has(item.id)) byId.set(item.id, item);
    });

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [companiesQuery.data, companyAnalysisRuntimeModel.chartRows, openFindingRows]);

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Dashboard inspecciones">
      <AppSidebar />
      <DashboardFrameShell
        header={<DashboardPageHeader />}
        content={
          <DashboardMainContentShell>
            <DashboardMainPanelsLayout
              primaryPanel={
                <DashboardCoreAnalysisSection
                  annualHeader={
                    <div className="h-auto min-h-[59.5px] relative shrink-0 w-full" data-name="Container">
                      <div aria-hidden className="absolute border-[#e3e3e3] border-b-2 border-solid inset-0 pointer-events-none" />
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between gap-[12px] px-[1px] py-[6px] relative size-full min-h-[59.5px]">
                        <AnnualDashboardHeaderTitle />
                        <DashboardPeriodLite value={dashboardQuery} onChange={setDashboardQuery} clearIconPath={svgPaths.p12771800} caretIconPath={svgPaths.pf36e620} />
                      </div>
                    </div>
                  }
                  topKpis={
                    <DashboardTopKpis>
                      <DashboardResponsiveTopKpisGrid>
                        <DashboardAnnualKpiInspectionsCard iconPath={svgPaths.p1711cfc0} inspectionsValue={kpisRuntimeModel.totalInspections} findingsValue={kpisRuntimeModel.totalFindings} />
                        <DashboardAnnualKpiClosedCard iconPath={svgPaths.p2acec00} closedValue={kpisRuntimeModel.closedInspections} closedRate={kpisRuntimeModel.closedRate} />
                        <DashboardAnnualKpiOpenCard iconPath={svgPaths.p162f2a3a} openValue={kpisRuntimeModel.openInspections} openLabel={kpisRuntimeModel.openLabel} />
                        <DashboardAnnualKpiFindingsCard iconPath={svgPaths.p31927d00} findingsValue={kpisRuntimeModel.totalFindings} findingsLabel={kpisRuntimeModel.findingsLabel} />
                        {isChartsLoading ? <div className="bg-white rounded-[8px] border border-[#e3e3e3] min-h-[96px] flex items-center justify-center text-[12px] text-[#646464]">Cargando KPI...</div> : isChartsError ? <div className="bg-white rounded-[8px] border border-[#ffd0db] min-h-[96px] flex items-center justify-center text-[12px] text-[#570b1d]">Error al cargar KPI</div> : <DashboardDynamicClosureKpiCard iconPath={svgPaths.p12a2ea00} title="% Cierre del año" rate={selectedYearClosureRate} detail={`año ${dashboardQuery.year} · meta >99%`} accent="#c8a064" iconColor="#C8A064" />}
                        {isChartsLoading ? <div className="bg-white rounded-[8px] border border-[#e3e3e3] min-h-[96px] flex items-center justify-center text-[12px] text-[#646464]">Cargando KPI...</div> : isChartsError ? <div className="bg-white rounded-[8px] border border-[#ffd0db] min-h-[96px] flex items-center justify-center text-[12px] text-[#570b1d]">Error al cargar KPI</div> : <DashboardDynamicClosureKpiCard iconPath={svgPaths.p347ba580} title="% Cierre histórico" rate={closureMetrics.historicalClosureRate} detail={historicalReferenceLabel} accent="#24588b" iconColor="#1F6F8B" />}
                      </DashboardResponsiveTopKpisGrid>
                    </DashboardTopKpis>
                  }
                  charts={
                    <DashboardChartsBlock>
                      <DashboardChartsPrimaryGrid>
                        {isChartsLoading ? <div className="bg-white rounded-[10px] border border-[#e3e3e3] min-h-[320px] flex items-center justify-center text-[12px] text-[#646464]">Cargando gráfico de inspecciones...</div> : <DashboardFigmaAnnualInspectionsChartCard rows={annualInspectionRows} />}
                        {isChartsError ? <div className="bg-white rounded-[10px] border border-[#ffd0db] min-h-[320px] flex items-center justify-center text-[12px] text-[#570b1d]">Error al cargar gráfico de observaciones</div> : <DashboardFigmaAnnualFindingsChartCard rows={monthlySeriesRows} />}
                      </DashboardChartsPrimaryGrid>
                      <DashboardResponsiveSecondaryGrid>
                        <DashboardFigmaClosureGaugeChartCard rate={closureMetrics.historicalClosureRate} title="% Cierre histórico" subtitle="2023–2026" />
                        <DashboardFigmaClosureGaugeChartCard rate={closureMetrics.periodClosureRate} title="% Cierre del período" subtitle={closureMetrics.periodLabel} />
                        {isChartsError ? <div className="bg-white rounded-[8px] border border-[#ffd0db] h-[278.5px] flex items-center justify-center text-[12px] text-[#570b1d]">Error al cargar evolución</div> : <DashboardFigmaFindingsEvolutionChartCard rows={monthlySeriesRows} />}
                      </DashboardResponsiveSecondaryGrid>
                      <DashboardAreaObservationsCard headerPrimary={<DashboardAreaObservationsHeaderPrimary />} headerSecondary={<DashboardAreaObservationsHeaderSecondary />} chart={isChartsLoading ? <div className="h-[320px] w-full flex items-center justify-center text-[12px] text-[#646464]">Cargando observaciones por área...</div> : <DashboardFigmaAreaObservationsChart rows={areaObservationRows} />} />
                    </DashboardChartsBlock>
                  }
                />
              }
              secondaryPanel={
                <DashboardSecondaryPanelStack
                  alerts={
                    <DashboardAlertsStrip>
                      <DashboardAlertsSectionLayout left={<DashboardAlertsHeaderLeft iconPath={svgPaths.p16888980} />} right={<DashboardCompanyFilter companies={companyFilterOptions} selectedCompanyId={selectedCompanyId} onChange={setSelectedCompanyId} clearIconPath={svgPaths.p12771800} caretIconPath={svgPaths.pf36e620} />} />
                    </DashboardAlertsStrip>
                  }
                  companyAnalysis={<DashboardResponsiveCompanyAnalysisSection cardA={<DashboardCompanyCardOpenCompanies iconPath={svgPaths.p3e906a80} value={companyAnalysisRuntimeModel.companiesWithOpenFindings} />} cardB={<DashboardCompanyCardOpenFindings iconPath={svgPaths.p31927d00} value={companyAnalysisRuntimeModel.openFindings} />} cardC={<DashboardCompanyCardOpenInspections iconPath={svgPaths.p1711cfc0} value={companyAnalysisRuntimeModel.openInspections} />} cardD={<DashboardCompanyCardOpenDays iconPath={svgPaths.p162f2a3a} value={companyAnalysisRuntimeModel.openDaysLabel} />} chart={<DashboardFigmaCompanyAnalysisChart rows={companyAnalysisRuntimeModel.chartRows} />} />}
                  openFindingsTable={<DashboardFigmaOpenFindingsDetailsTable rows={openFindingRows} severeOpenFindings={severeOpenFindings} openInspections={openInspections} sortIconPath={svgPaths.p2c5a2400} expandIconPath={svgPaths.pf36e620} isLoading={isOpenFindingsLoading} isError={isOpenFindingsError} />}
                />
              }
            />
          </DashboardMainContentShell>
        }
      />
    </div>
  );
}
