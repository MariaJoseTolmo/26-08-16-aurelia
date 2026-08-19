import { useState } from 'react';
import type { DashboardMonthlySeriesRow } from '../dashboardRuntime';

type ClosureGaugeCardProps = {
  rate: number;
  title: string;
  subtitle: string;
};

type FindingsEvolutionChartCardProps = {
  rows: DashboardMonthlySeriesRow[];
};

type ChartPoint = {
  x: number;
  y: number;
};

type GaugeHoverState = {
  label: string;
  value: number;
} | null;

type EvolutionHoverState = {
  label: string;
  value: number;
  x: number;
  y: number;
} | null;

const CLOSED = '#1f6f8b';
const OPEN = '#e07a3f';
const TEAL = '#00b398';
const GRID = '#e3e3e3';
const AREA_FILL = 'rgba(0, 179, 152, 0.14)';
const numberFormatter = new Intl.NumberFormat('en-US');

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function formatAxisValue(value: number) {
  return numberFormatter.format(value);
}

function clampRate(rate: number) {
  return Math.max(0, Math.min(100, rate));
}

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  const [firstPoint, ...restPoints] = points;
  const segments = restPoints.map((point, index) => {
    const previousPoint = points[index]!;
    const middleX = (previousPoint.x + point.x) / 2;
    return `C ${middleX} ${previousPoint.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  });

  return [`M ${firstPoint!.x} ${firstPoint!.y}`, ...segments].join(' ');
}

function formatMonthLabel(label: string) {
  const normalized = label.replace('.', '').trim().toLowerCase().slice(0, 3);
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
}

function buildEvolutionRows(rows: DashboardMonthlySeriesRow[]) {
  const currentMonthIndex = new Date().getMonth();
  const lastDataIndex = rows.reduce((lastIndex, row, index) => (row.closedFindings > 0 || row.openFindings > 0 ? index : lastIndex), -1);
  const visibleMonths = Math.min(12, Math.max(5, currentMonthIndex + 1, lastDataIndex + 1));

  return rows.slice(0, visibleMonths).map((row) => ({
    label: formatMonthLabel(row.month),
    closed: Math.max(0, row.closedFindings),
    open: Math.max(0, row.openFindings),
  }));
}

function LegendItem({ color, label, outlined = false }: { color: string; label: string; outlined?: boolean }) {
  return (
    <div className="flex items-center gap-[6px]">
      <span className={outlined ? 'block size-[12px] rounded-[2px] border-[2px] border-solid bg-white' : 'block size-[10px] rounded-[3px]'} style={{ borderColor: color, backgroundColor: outlined ? '#fff' : color }} />
      <span>{label}</span>
    </div>
  );
}

function EvolutionTooltip({ point, chartWidth }: { point: Exclude<EvolutionHoverState, null>; chartWidth: number }) {
  const tooltipWidth = 78;
  const tooltipHeight = 32;
  const x = Math.max(tooltipWidth / 2, Math.min(chartWidth - tooltipWidth / 2, point.x));
  const y = Math.max(tooltipHeight + 4, point.y - 14);

  return (
    <g pointerEvents="none">
      <rect x={x - tooltipWidth / 2} y={y - tooltipHeight} width={tooltipWidth} height={tooltipHeight} rx="6" fill="#213040" opacity="0.94" />
      <text x={x} y={y - 18} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="9" fontFamily="Inter, sans-serif">{point.label}</text>
      <text x={x} y={y - 6} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="500" fontFamily="Inter, sans-serif">{formatAxisValue(point.value)}</text>
    </g>
  );
}

export function DashboardFigmaClosureGaugeChartCard({ rate, title, subtitle }: ClosureGaugeCardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<GaugeHoverState>(null);
  const clampedRate = clampRate(rate);
  const openRate = 100 - clampedRate;
  const radius = 58;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const closedStroke = (clampedRate / 100) * circumference;
  const openStroke = circumference - closedStroke;

  return (
    <div className="bg-white border border-[#e3e3e3] border-solid drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)] flex flex-col h-[278.5px] items-center justify-center px-[19px] py-[17px] relative rounded-[8px] w-full" data-name="Container">
      <div className="w-full shrink-0">
        <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic text-[#131313] text-[13px] whitespace-nowrap">{title}</p>
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] mt-[2px] not-italic text-[#646464] text-[11px] whitespace-nowrap">{subtitle}</p>
      </div>
      <div className="mt-[12px] relative shrink-0 size-[160px]" data-name="Container" onMouseLeave={() => setHoveredSegment(null)}>
        <svg className="absolute inset-0 size-full" viewBox="0 0 160 160" fill="none">
          <circle cx="80" cy="80" r={radius} stroke="#f2f2f2" strokeWidth={strokeWidth} />
          <circle cx="80" cy="80" r={radius} stroke={CLOSED} strokeWidth={strokeWidth} strokeDasharray={`${closedStroke} ${circumference}`} transform="rotate(-90 80 80)" strokeLinecap="butt" onMouseEnter={() => setHoveredSegment({ label: 'Cerradas', value: clampedRate })} />
          <circle cx="80" cy="80" r={radius} stroke={OPEN} strokeWidth={strokeWidth} strokeDasharray={`${openStroke} ${circumference}`} strokeDashoffset={-closedStroke} transform="rotate(-90 80 80)" strokeLinecap="butt" onMouseEnter={() => setHoveredSegment({ label: 'Abiertas', value: openRate })} />
        </svg>
        {hoveredSegment ? (
          <div className="absolute left-1/2 top-[18px] z-[2] -translate-x-1/2 overflow-clip rounded-[6px] bg-[rgba(33,48,64,0.92)] px-[9px] py-[7px] text-center shadow-[0_8px_20px_rgba(12,31,56,0.18)]">
            <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9px] font-normal leading-[normal] text-[rgba(255,255,255,0.75)]">{hoveredSegment.label}</p>
            <p className="whitespace-nowrap font-['Inter:Medium',sans-serif] text-[12px] font-medium leading-[normal] text-white">{formatPercent(hoveredSegment.value)}</p>
          </div>
        ) : null}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-['Inter:Bold',sans-serif] font-bold text-[#001e39] text-[30px] leading-[30px]">{formatPercent(clampedRate)}</p>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[#646464] text-[10px] leading-[normal] mt-[2px]">cerradas</p>
        </div>
      </div>
      <div className="mt-[12px] flex items-center justify-center gap-[16px] text-[#333] text-[11px] font-['Inter:Regular',sans-serif] font-normal">
        <LegendItem color={CLOSED} label="Cerradas" />
        <LegendItem color={OPEN} label="Abiertas" />
      </div>
    </div>
  );
}

export function DashboardFigmaFindingsEvolutionChartCard({ rows }: FindingsEvolutionChartCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<EvolutionHoverState>(null);
  const series = buildEvolutionRows(rows);
  const maxValue = 1200;
  const chartWidth = 328;
  const chartHeight = 172;
  const left = 42;
  const right = 320;
  const top = 8;
  const bottom = 142;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const step = plotWidth / Math.max(series.length - 1, 1);
  const yTicks = [1200, 1000, 800, 600, 400, 200, 0];

  const toPoint = (value: number, index: number): ChartPoint => ({
    x: left + index * step,
    y: bottom - (Math.min(value, maxValue) / maxValue) * plotHeight,
  });

  const closedPoints = series.map((row, index) => toPoint(row.closed, index));
  const openPoints = series.map((row, index) => toPoint(row.open, index));
  const closedPath = buildSmoothPath(closedPoints);
  const openPath = buildSmoothPath(openPoints);
  const areaPath = closedPoints.length > 0 ? `${closedPath} L ${closedPoints[closedPoints.length - 1]!.x} ${bottom} L ${closedPoints[0]!.x} ${bottom} Z` : '';

  return (
    <div className="bg-white border border-[#e3e3e3] border-solid drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)] flex flex-col h-[278.5px] items-start px-[19px] py-[17px] relative rounded-[8px] w-full" data-name="Container">
      <div className="h-[18px] relative shrink-0 w-full" data-name="Container (margin)">
        <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#131313] text-[13px] whitespace-nowrap">Evolución de observaciones 2026</p>
      </div>
      <div className="h-[27px] relative shrink-0 w-full" data-name="Container (margin)">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#646464] text-[11px] whitespace-nowrap">Tendencia mensual · abiertas vs cerradas</p>
      </div>
      <div className="relative mx-auto w-full max-w-[328px] flex-1 min-h-px" data-name="Canvas">
        <svg className="absolute inset-0 size-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} fill="none" preserveAspectRatio="xMidYMid meet" onMouseLeave={() => setHoveredPoint(null)}>
          {yTicks.map((tick) => {
            const y = bottom - (tick / maxValue) * plotHeight;
            return (
              <g key={tick}>
                <text x="0" y={y + 3} fill="#646464" fontSize="11" fontFamily="Inter, sans-serif">{formatAxisValue(tick)}</text>
                <line x1={left} x2={right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
              </g>
            );
          })}
          <path d={areaPath} fill={AREA_FILL} />
          <path d={closedPath} fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={openPath} fill="none" stroke={OPEN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {closedPoints.map((point, index) => (
            <g key={`closed-${series[index]!.label}`} onMouseEnter={() => setHoveredPoint({ label: 'Cerradas', value: series[index]!.closed, x: point.x, y: point.y })}>
              <circle cx={point.x} cy={point.y} r="9" fill="transparent" />
              <circle cx={point.x} cy={point.y} r="4" fill={TEAL} />
            </g>
          ))}
          {openPoints.map((point, index) => (
            <g key={`open-${series[index]!.label}`} onMouseEnter={() => setHoveredPoint({ label: 'Abiertas', value: series[index]!.open, x: point.x, y: point.y })}>
              <circle cx={point.x} cy={point.y} r="9" fill="transparent" />
              <circle cx={point.x} cy={point.y} r="3.5" fill={OPEN} />
            </g>
          ))}
          {hoveredPoint ? <EvolutionTooltip point={hoveredPoint} chartWidth={chartWidth} /> : null}
          {series.map((row, index) => {
            const x = left + index * step;
            return <text key={row.label} x={x} y="163" textAnchor="middle" fill="#646464" fontSize="12" fontFamily="Inter, sans-serif">{row.label}</text>;
          })}
        </svg>
      </div>
      <div className="mt-[4px] flex w-full items-center justify-center gap-[18px] text-[#646464] text-[11px] font-['Inter:Regular',sans-serif] font-normal">
        <LegendItem color={TEAL} label="Cerradas" outlined />
        <LegendItem color={OPEN} label="Abiertas" outlined />
      </div>
    </div>
  );
}
