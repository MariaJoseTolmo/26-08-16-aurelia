import { useState } from 'react';
import type { InspectionDashboardAnnualInspectionRowResponse } from '@aurelia/contracts';
import type { DashboardMonthlySeriesRow } from '../dashboardRuntime';

type AnnualInspectionChartCardProps = {
  rows: InspectionDashboardAnnualInspectionRowResponse[];
};

type AnnualFindingsChartCardProps = {
  rows: DashboardMonthlySeriesRow[];
};

type PairedBarRow = {
  label: string;
  closed: number;
  open: number;
  closedColor?: string;
};

type ChartCardProps = {
  title: string;
  subtitle: string;
  rows: PairedBarRow[];
  maxValue: number;
  yTicks: number[];
  closedSwatchColor: string;
  barWidth: number;
  closedTooltipLabel: string;
  openTooltipLabel: string;
};

type BarWithTooltipProps = {
  color: string;
  height: number;
  label: string;
  name: string;
  value: number;
  width: number;
};

const CLOSED = '#1e4d5c';
const CLOSED_HISTORICAL = '#b8cdd9';
const CLOSED_CURRENT = '#2d6a7f';
const OPEN = '#f4a460';
const GRID = '#e5e7eb';
const CHART_HEIGHT = 200;
const numberFormatter = new Intl.NumberFormat('es-CL');

function buildInspectionRows(rows: InspectionDashboardAnnualInspectionRowResponse[]) {
  const currentYear = new Date().getFullYear();
  const rowByYear = new Map(rows.map((row) => [row.year, row]));

  return Array.from({ length: 4 }, (_, index) => {
    const year = currentYear - 3 + index;
    const row = rowByYear.get(year);
    return {
      label: `${year}`,
      closed: row?.closed ?? 0,
      open: row?.open ?? 0,
      closedColor: year === currentYear ? CLOSED_CURRENT : CLOSED_HISTORICAL,
    };
  });
}

function formatMonthLabel(month: string) {
  const normalized = month.replace('.', '').trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1, 3) : '';
}

function buildFindingRows(rows: DashboardMonthlySeriesRow[]) {
  return rows.map((row) => ({
    label: formatMonthLabel(row.month),
    closed: Math.max(0, row.closedFindings),
    open: Math.max(0, row.openFindings),
  }));
}

function formatTooltipValue(value: number) {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function BarWithTooltip({ color, height, label, name, value, width }: BarWithTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative rounded-[2px]"
      data-name={name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ backgroundColor: color, height: `${height}px`, width: `${width}px` }}
    >
      {isHovered ? (
        <div className="absolute left-1/2 z-[60] -translate-x-1/2 overflow-clip rounded-[6px] bg-[rgba(33,48,64,0.94)] px-[8px] py-[6px] text-center shadow-[0_8px_20px_rgba(12,31,56,0.18)]" style={{ bottom: `${height + 8}px` }}>
          <p className="relative shrink-0 whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9px] font-normal leading-[normal] text-[rgba(255,255,255,0.75)]">{label}</p>
          <p className="relative shrink-0 whitespace-nowrap font-['Inter:Medium',sans-serif] text-[12px] font-medium leading-[normal] text-white">{formatTooltipValue(value)}</p>
        </div>
      ) : null}
    </div>
  );
}

function ChartCard({ title, subtitle, rows, maxValue, yTicks, closedSwatchColor, barWidth, closedTooltipLabel, openTooltipLabel }: ChartCardProps) {
  return (
    <div className="bg-white border border-[#e3e3e3] border-solid drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)] flex flex-col h-[339px] items-start px-[19px] py-[17px] relative rounded-[8px] w-full" data-name="Container">
      <div className="h-[18px] relative shrink-0 w-full" data-name="Container (margin)">
        <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[#131313] text-[13px] whitespace-nowrap">{title}</p>
      </div>
      <div className="h-[27px] relative shrink-0 w-full" data-name="Container (margin)">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#646464] text-[11px] whitespace-nowrap">{subtitle}</p>
      </div>
      <div className="bg-white flex-[1_0_0] min-h-px relative w-full" data-name="Canvas">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-visible pb-[12px] pt-[16px] px-[12px] relative rounded-[inherit] size-full">
          <div className="content-stretch flex h-[200px] items-start relative shrink-0 w-full" data-name="chart-area">
            <div className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal h-full leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[9px] text-right w-[36px]" data-name="y-axis">
              {yTicks.map((tick) => {
                const bottom = (tick / maxValue) * CHART_HEIGHT;
                const transform = tick === 0 ? 'translateY(0)' : 'translateY(50%)';
                return (
                  <div className="absolute right-[4px] w-[32px]" key={tick} style={{ bottom: `${bottom}px`, transform }}>
                    <p className="leading-[normal]">{tick}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-white flex-[1_0_0] h-full min-w-px overflow-visible relative" data-name="plot">
              {yTicks.map((tick) => {
                const bottom = (tick / maxValue) * CHART_HEIGHT;
                return <div className="absolute h-px left-0 right-0" data-name={`grid-${tick}`} key={tick} style={{ backgroundColor: GRID, bottom: `${bottom}px` }} />;
              })}
              <div className="absolute inset-0 flex items-end justify-between gap-[14px]">
                {rows.map((row) => {
                  const closedHeight = Math.max(0, Math.min(CHART_HEIGHT, (row.closed / maxValue) * CHART_HEIGHT));
                  const openHeight = Math.max(0, Math.min(CHART_HEIGHT, (row.open / maxValue) * CHART_HEIGHT));

                  return (
                    <div className="relative z-[1] flex h-full flex-1 items-end justify-center gap-[4px]" key={row.label}>
                      <BarWithTooltip color={row.closedColor ?? CLOSED} height={closedHeight} label={closedTooltipLabel} name={`${row.label}-cerradas`} value={row.closed} width={barWidth} />
                      <BarWithTooltip color={OPEN} height={openHeight} label={openTooltipLabel} name={`${row.label}-abiertas`} value={row.open} width={barWidth} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="[word-break:break-word] bg-white content-stretch flex justify-between font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] not-italic relative shrink-0 text-[#6b7280] text-[10px] text-center w-full" data-name="x-labels">
            <div className="w-[36px]" />
            {rows.map((row) => (
              <p className="flex-1 pt-[4px]" key={row.label}>{row.label}</p>
            ))}
          </div>
          <div className="content-stretch flex gap-[16px] h-[20px] items-center justify-center pt-[2px] relative shrink-0 w-full" data-name="legend">
            <div className="content-stretch flex gap-[5px] items-center relative shrink-0" data-name="legend-cerradas">
              <div className="relative rounded-[2px] shrink-0 size-[10px]" data-name="swatch-cerradas" style={{ backgroundColor: closedSwatchColor }} />
              <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#6b7280] text-[10px] whitespace-nowrap">Cerradas</p>
            </div>
            <div className="content-stretch flex gap-[5px] items-center relative shrink-0" data-name="legend-abiertas">
              <div className="relative rounded-[2px] shrink-0 size-[10px]" data-name="swatch-abiertas" style={{ backgroundColor: OPEN }} />
              <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#6b7280] text-[10px] whitespace-nowrap">Abiertas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardFigmaAnnualInspectionsChartCard({ rows }: AnnualInspectionChartCardProps) {
  const currentYear = new Date().getFullYear();
  return <ChartCard title="Inspecciones cerradas y abiertas" subtitle={`Año ${currentYear} resaltado · contexto ${currentYear - 3}–${currentYear}`} rows={buildInspectionRows(rows)} maxValue={800} yTicks={[800, 600, 400, 200, 0]} closedSwatchColor={CLOSED_HISTORICAL} barWidth={36} closedTooltipLabel="Inspecciones cerradas" openTooltipLabel="Inspecciones abiertas" />;
}

export function DashboardFigmaAnnualFindingsChartCard({ rows }: AnnualFindingsChartCardProps) {
  return <ChartCard title="Observaciones cerradas y abiertas" subtitle="Acumulado por mes · año 2026" rows={buildFindingRows(rows)} maxValue={1200} yTicks={[1200, 1000, 800, 600, 400, 200, 0]} closedSwatchColor={CLOSED} barWidth={28} closedTooltipLabel="Observaciones cerradas" openTooltipLabel="Observaciones abiertas" />;
}
