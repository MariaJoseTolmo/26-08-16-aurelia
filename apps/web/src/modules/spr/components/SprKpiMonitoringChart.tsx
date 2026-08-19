import {
  SPR_KPI_AGUA_GROUNDWATER,
  SPR_KPI_AGUA_RECYCLED_PCT,
  SPR_KPI_AGUA_WATER_VALUES,
  SPR_KPI_ENERGIA_CO2_VALUES,
  SPR_KPI_ENERGIA_INTENSITY_CO2,
  SPR_KPI_ENERGIA_INTENSITY_ENERGY,
  SPR_KPI_MONITORING_MONTHS,
  type SprKpiMonitoringChartConfig,
  type SprKpiMonitoringLegendItem,
} from '../sprKpiMonitoring.constants';

const GRID = '#ebebeb';
const AXIS = '#acacac';

type ChartSize = { width: number; height: number; padding: { top: number; right: number; bottom: number; left: number } };

const DEFAULT_SIZE: ChartSize = {
  width: 1031,
  height: 168,
  padding: { top: 12, right: 12, bottom: 22, left: 36 },
};

function plotArea(size: ChartSize) {
  return {
    x: size.padding.left,
    y: size.padding.top,
    width: size.width - size.padding.left - size.padding.right,
    height: size.height - size.padding.top - size.padding.bottom,
  };
}

function formatAxisTick(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  if (value < 1) return value.toFixed(2);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildTicks(max: number, count = 5) {
  const step = max / (count - 1);
  return Array.from({ length: count }, (_, i) => step * i);
}

function monthStep(plotWidth: number) {
  return plotWidth / SPR_KPI_MONITORING_MONTHS.length;
}

function LegendRow({ items }: { items: SprKpiMonitoringLegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-[9px] gap-y-[4px] pt-[8px]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-[4px]">
          {item.kind === 'line' ? (
            <span className="h-[2px] w-[16px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          ) : item.kind === 'dashed' ? (
            <span className="size-[10px] shrink-0 rounded-[2px] border border-dashed border-[#acacac]" />
          ) : (
            <span className="size-[10px] shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          )}
          <span className="font-['Inter:Regular',sans-serif] text-[9px] tracking-[0.167px] text-[#646464]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChartGrid({ size, ticks }: { size: ChartSize; ticks: number[] }) {
  const plot = plotArea(size);
  const max = ticks[ticks.length - 1] ?? 1;
  return (
    <>
      {ticks.map((tick) => {
        const y = plot.y + plot.height - (tick / max) * plot.height;
        return (
          <g key={tick}>
            <line x1={plot.x} x2={plot.x + plot.width} y1={y} y2={y} stroke={GRID} strokeWidth="0.66" />
            <text
              x={plot.x - 6}
              y={y + 3}
              textAnchor="end"
              fill={AXIS}
              fontSize="9.9"
              fontFamily="Inter, sans-serif"
            >
              {formatAxisTick(tick)}
            </text>
          </g>
        );
      })}
      {SPR_KPI_MONITORING_MONTHS.map((month, index) => {
        const x = plot.x + monthStep(plot.width) * index + monthStep(plot.width) / 2;
        return (
          <text key={month} x={x} y={size.height - 6} textAnchor="middle" fill={AXIS} fontSize="9.9" fontFamily="Inter, sans-serif">
            {month}
          </text>
        );
      })}
    </>
  );
}

function StackedBarChart({ series, values, colors }: { series: number; values: number[][]; colors: string[] }) {
  const size = DEFAULT_SIZE;
  const plot = plotArea(size);
  const maxTotal = Math.max(...values.map((month) => month.reduce((sum, v) => sum + v, 0)), 1);
  const ticks = buildTicks(maxTotal, 5);
  const barWidth = monthStep(plot.width) * 0.62;

  return (
    <svg viewBox={`0 0 ${size.width} ${size.height}`} className="h-[168px] w-full" preserveAspectRatio="none">
      <ChartGrid size={size} ticks={ticks} />
      {values.map((monthValues, monthIndex) => {
        const x = plot.x + monthStep(plot.width) * monthIndex + (monthStep(plot.width) - barWidth) / 2;
        let offset = 0;
        return monthValues.slice(0, series).map((value, seriesIndex) => {
          const height = (value / maxTotal) * plot.height;
          const y = plot.y + plot.height - offset - height;
          offset += height;
          return (
            <rect
              key={`${monthIndex}-${seriesIndex}`}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              fill={colors[seriesIndex] ?? '#24588b'}
              rx="1"
            />
          );
        });
      })}
    </svg>
  );
}

function LineChart({ values, color, referenceLines }: { values: number[]; color: string; referenceLines?: number[] }) {
  const size = DEFAULT_SIZE;
  const plot = plotArea(size);
  const max = Math.max(...values, ...(referenceLines ?? []), 0.01);
  const min = Math.min(...values, ...(referenceLines ?? []));
  const range = max - min || 1;
  const ticks = buildTicks(max, 5);
  const points = values.map((value, index) => {
    const x = plot.x + monthStep(plot.width) * index + monthStep(plot.width) / 2;
    const y = plot.y + plot.height - ((value - min) / range) * plot.height;
    return { x, y };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size.width} ${size.height}`} className="h-[168px] w-full" preserveAspectRatio="none">
      <ChartGrid size={size} ticks={ticks} />
      {referenceLines?.map((ref) => {
        const y = plot.y + plot.height - ((ref - min) / range) * plot.height;
        return <line key={ref} x1={plot.x} x2={plot.x + plot.width} y1={y} y2={y} stroke="#c4365a" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />;
      })}
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.3" fill={color} />
      ))}
    </svg>
  );
}

function AreaChart({ values, color }: { values: number[]; color: string }) {
  const size = { ...DEFAULT_SIZE, height: 140 };
  const plot = plotArea(size);
  const max = Math.max(...values, 90);
  const min = Math.min(...values, 25);
  const range = max - min || 1;
  const ticks = [25, 41.25, 57.5, 73.75, 90];
  const points = values.map((value, index) => {
    const x = plot.x + monthStep(plot.width) * index + monthStep(plot.width) / 2;
    const y = plot.y + plot.height - ((value - min) / range) * plot.height;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${plot.y + plot.height} L ${points[0]!.x} ${plot.y + plot.height} Z`;

  return (
    <svg viewBox={`0 0 ${size.width} ${size.height}`} className="h-[140px] w-full" preserveAspectRatio="none">
      <ChartGrid size={size} ticks={ticks} />
      <line x1={plot.x} x2={plot.x + plot.width} y1={plot.y + plot.height * 0.35} y2={plot.y + plot.height * 0.35} stroke="#c4365a" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
      <line x1={plot.x} x2={plot.x + plot.width} y1={plot.y + plot.height * 0.55} y2={plot.y + plot.height * 0.55} stroke="#acacac" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
      <path d={areaPath} fill="rgba(36, 88, 139, 0.12)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.3" fill={color} />
      ))}
    </svg>
  );
}

function SimpleBarChart({ values, color }: { values: number[]; color: string }) {
  const size = DEFAULT_SIZE;
  const plot = plotArea(size);
  const max = Math.max(...values, 1);
  const ticks = buildTicks(max, 5);
  const barWidth = monthStep(plot.width) * 0.5;

  return (
    <svg viewBox={`0 0 ${size.width} ${size.height}`} className="h-[168px] w-full" preserveAspectRatio="none">
      <ChartGrid size={size} ticks={ticks} />
      {values.map((value, index) => {
        const height = (value / max) * plot.height;
        const x = plot.x + monthStep(plot.width) * index + (monthStep(plot.width) - barWidth) / 2;
        const y = plot.y + plot.height - height;
        return <rect key={index} x={x} y={y} width={barWidth} height={height} fill={color} rx="1" />;
      })}
    </svg>
  );
}

function IncidentStackedChart() {
  const values = SPR_KPI_MONITORING_MONTHS.map((_, i) => {
    const base = i < 2 ? 1.2 : 0.8 + (i % 3) * 0.3;
    return [base * 0.4, base * 0.3, base * 0.2, base * 0.1];
  });
  return (
    <StackedBarChart
      series={4}
      values={values}
      colors={['#00b398', '#8fbde0', '#e8720c', '#c4365a']}
    />
  );
}

function IncidentImpactChart() {
  const values = SPR_KPI_MONITORING_MONTHS.map((_, i) => {
    const base = 0.6 + (i % 4) * 0.15;
    return [base * 0.5, base * 0.3, base * 0.2];
  });
  return <StackedBarChart series={3} values={values} colors={['#24588b', '#e8720c', '#7b4fbf']} />;
}

export function SprKpiMonitoringChartBody({ chart }: { chart: SprKpiMonitoringChartConfig }) {
  if (chart.id === 'co2-scope1') {
    return (
      <StackedBarChart
        series={5}
        values={SPR_KPI_ENERGIA_CO2_VALUES}
        colors={['#e8720c', '#f4b882', '#c4365a', '#7b4fbf', '#24588b']}
      />
    );
  }
  if (chart.id === 'intensity-co2') {
    return <LineChart values={SPR_KPI_ENERGIA_INTENSITY_CO2} color="#24588b" referenceLines={[0.18]} />;
  }
  if (chart.id === 'intensity-energy') {
    return <LineChart values={SPR_KPI_ENERGIA_INTENSITY_ENERGY} color="#24588b" referenceLines={[1.51]} />;
  }
  if (chart.id === 'water-distribution') {
    return (
      <StackedBarChart
        series={3}
        values={SPR_KPI_AGUA_WATER_VALUES}
        colors={['#24588b', '#8fbde0', '#00b398']}
      />
    );
  }
  if (chart.id === 'groundwater') {
    return <SimpleBarChart values={SPR_KPI_AGUA_GROUNDWATER} color="#24588b" />;
  }
  if (chart.id === 'recycled-pct') {
    return <AreaChart values={SPR_KPI_AGUA_RECYCLED_PCT} color="#24588b" />;
  }
  if (chart.id === 'incidents-general') return <IncidentStackedChart />;
  if (chart.id === 'incidents-level1' || chart.id === 'incidents-level2') return <IncidentImpactChart />;
  return null;
}

export function SprKpiMonitoringChartCard({ chart }: { chart: SprKpiMonitoringChartConfig }) {
  return (
    <div
      className={`rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[13px] ${
        chart.width === 'half' ? 'min-w-0 flex-1' : 'w-full'
      }`}
    >
      <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">{chart.title}</p>
      <p className="pt-[3px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{chart.subtitle}</p>
      <LegendRow items={chart.legend} />
      <div className="pt-[6px]">
        <SprKpiMonitoringChartBody chart={chart} />
      </div>
    </div>
  );
}
