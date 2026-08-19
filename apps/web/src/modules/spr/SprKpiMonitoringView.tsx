import { useState } from 'react';

import { SprKpiFreeChartPanel } from './components/SprKpiFreeChartPanel';
import { SprKpiMonitoringChartCard } from './components/SprKpiMonitoringChart';
import {
  SPR_KPI_MONITORING,
  SPR_KPI_MONITORING_CATEGORIES,
  SPR_KPI_MONITORING_PERIODS,
  SPR_KPI_MONITORING_SECTIONS,
  type SprKpiMonitoringCategory,
  type SprKpiMonitoringChartConfig,
  type SprKpiMonitoringLegendItem,
  type SprKpiMonitoringPeriod,
} from './sprKpiMonitoring.constants';

function SectionHeader({
  title,
  helper,
  chartCountLabel,
}: {
  title: string;
  helper: string;
  chartCountLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[7px] pb-[8px]">
      <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">{title}</p>
      <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{helper}</p>
      {chartCountLabel ? (
        <span className="rounded-[4px] bg-[#f2f2f2] px-[7px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#646464]">
          {chartCountLabel}
        </span>
      ) : null}
    </div>
  );
}

type ImmutableChartConfig = Omit<SprKpiMonitoringChartConfig, 'legend'> & {
  readonly legend: readonly SprKpiMonitoringLegendItem[];
};

function normalizeCharts(charts: readonly ImmutableChartConfig[]): SprKpiMonitoringChartConfig[] {
  return charts.map(({ legend, ...chart }) => ({
    ...chart,
    legend: [...legend],
  }));
}

function ChartRow({ charts }: { charts: readonly SprKpiMonitoringChartConfig[] }) {
  const full = charts.filter((c) => c.width === 'full');
  const halves = charts.filter((c) => c.width === 'half');

  return (
    <div className="flex flex-col gap-[10px]">
      {full.map((chart) => (
        <SprKpiMonitoringChartCard key={chart.id} chart={chart} />
      ))}
      {halves.length > 0 ? (
        <div className="flex flex-col gap-[10px] lg:flex-row">
          {halves.map((chart) => (
            <SprKpiMonitoringChartCard key={chart.id} chart={chart} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Vista Monitoreo de KPIs (Figma 2441:5221 / 2444:7912). */
export function SprKpiMonitoringView() {
  const [period, setPeriod] = useState<SprKpiMonitoringPeriod>('mensual');
  const [category, setCategory] = useState<SprKpiMonitoringCategory | 'all'>('all');
  const [freeKpiIds, setFreeKpiIds] = useState(['ground-water-freshwater', 'diesel-haulage-other']);
  const [comparePreviousYear, setComparePreviousYear] = useState(true);

  const showEnergia = category === 'all' || category === 'energia';
  const showAgua = category === 'all' || category === 'agua';
  const showIncidentes = category === 'all' || category === 'incidentes';
  const showGraficoLibre = category === 'all' || category === 'grafico-libre';

  return (
    <div className="h-[calc(100vh-56px)] w-full overflow-y-auto bg-[#f7f7f7]">
      <div className="flex flex-col gap-[14px] px-[18px] py-[14px]">
        <div className="flex flex-wrap items-center gap-[12px] rounded-[9px] border border-[#e3e3e3] bg-white px-[14px] py-[10px]">
          <span className="font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
            {SPR_KPI_MONITORING.periodLabel}
          </span>
          <div className="flex items-center rounded-[6px] bg-[#f2f2f2] p-[3px]">
            {SPR_KPI_MONITORING_PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriod(option.id)}
                className={`rounded-[4px] px-[10px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${
                  period === option.id ? 'bg-white text-[#131313] shadow-sm' : 'text-[#646464]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-[5px]">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`flex h-[20px] items-center gap-[6px] rounded-[4px] border px-[10px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${
                category === 'all' ? 'border-[#24588b] bg-[#e6f3ff] text-[#0d3862]' : 'border-[#e3e3e3] bg-white text-[#646464]'
              }`}
            >
              Todos
            </button>
            {SPR_KPI_MONITORING_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex h-[20px] items-center gap-[6px] rounded-[4px] border px-[10px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold ${
                  category === cat.id ? 'border-[#24588b] bg-[#e6f3ff] text-[#0d3862]' : 'border-[#e3e3e3] bg-white text-[#646464]'
                }`}
              >
                <span className="size-[6px] rounded-full" style={{ backgroundColor: cat.dotColor }} />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex h-[26px] items-center gap-[8px] rounded-[8px] border border-[#d1d1d1] bg-white px-[8px]">
            <span className="font-['Inter:Regular',sans-serif] text-[13px] text-[#131313]">{SPR_KPI_MONITORING.yearRangeLabel}</span>
            <CaretDown />
          </div>
        </div>

        {showEnergia ? (
          <section>
            <SectionHeader
              title={SPR_KPI_MONITORING_SECTIONS.energia.title}
              helper={SPR_KPI_MONITORING_SECTIONS.energia.helper}
              chartCountLabel={SPR_KPI_MONITORING_SECTIONS.energia.chartCountLabel}
            />
            <ChartRow charts={normalizeCharts(SPR_KPI_MONITORING_SECTIONS.energia.charts)} />
          </section>
        ) : null}

        {showAgua ? (
          <section>
            <SectionHeader
              title={SPR_KPI_MONITORING_SECTIONS.agua.title}
              helper={SPR_KPI_MONITORING_SECTIONS.agua.helper}
              chartCountLabel={SPR_KPI_MONITORING_SECTIONS.agua.chartCountLabel}
            />
            <ChartRow charts={normalizeCharts(SPR_KPI_MONITORING_SECTIONS.agua.charts)} />
          </section>
        ) : null}

        {showIncidentes ? (
          <section>
            <SectionHeader
              title={SPR_KPI_MONITORING_SECTIONS.incidentes.title}
              helper={SPR_KPI_MONITORING_SECTIONS.incidentes.helper}
              chartCountLabel={SPR_KPI_MONITORING_SECTIONS.incidentes.chartCountLabel}
            />
            <ChartRow charts={normalizeCharts(SPR_KPI_MONITORING_SECTIONS.incidentes.charts)} />
          </section>
        ) : null}

        {showGraficoLibre ? (
          <section>
            <SectionHeader
              title={SPR_KPI_MONITORING_SECTIONS.graficoLibre.title}
              helper={SPR_KPI_MONITORING_SECTIONS.graficoLibre.helper}
              chartCountLabel=""
            />
            <SprKpiFreeChartPanel
              selectedIds={freeKpiIds}
              comparePreviousYear={comparePreviousYear}
              onSelectedIdsChange={setFreeKpiIds}
              onCompareChange={setComparePreviousYear}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CaretDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-[#131313]">
      <path d="M4.25 6.25L8 10L11.75 6.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
