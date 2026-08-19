import type { DashboardAreaObservationRow } from '../dashboardRuntime';

type DashboardFigmaAreaObservationsChartProps = {
  rows: DashboardAreaObservationRow[];
};

type BarWithTooltipProps = {
  color: string;
  label: string;
  value: number;
  width: string;
};

const CLOSED = '#27677c';
const OPEN = '#d87b40';
const GRID = '#e3e3e3';
const AXIS_MAX = 1400;
const AXIS_TICKS = [0, 200, 400, 600, 800, 1000, 1200, 1400];
const numberFormatter = new Intl.NumberFormat('es-CL');

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value / AXIS_MAX));
}

function barWidth(value: number) {
  if (value <= 0) return '1px';
  return `${Math.max(0.25, clampRatio(value) * 100)}%`;
}

function formatTick(value: number) {
  return numberFormatter.format(value);
}

function BarWithTooltip({ color, label, value, width }: BarWithTooltipProps) {
  return (
    <div className="group relative h-[6px] rounded-[1px]" data-name="bar-with-tooltip" style={{ width, backgroundColor: color }}>
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[3] hidden -translate-x-1/2 overflow-clip rounded-[6px] bg-[rgba(33,48,64,0.92)] px-[8px] py-[6px] text-center shadow-[0_8px_20px_rgba(12,31,56,0.18)] group-hover:block">
        <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9px] font-normal leading-[normal] text-[rgba(255,255,255,0.75)]">{label}</p>
        <p className="whitespace-nowrap font-['Inter:Medium',sans-serif] text-[12px] font-medium leading-[normal] text-white">{formatTick(value)}</p>
      </div>
    </div>
  );
}

export function DashboardFigmaAreaObservationsChart({ rows }: DashboardFigmaAreaObservationsChartProps) {
  const visibleRows = rows.slice(0, 10);

  if (visibleRows.length === 0) {
    return (
      <div className="bg-white min-h-[400px] relative shrink-0 w-full" data-name="bar-chart-editable">
        <div className="flex min-h-[400px] w-full items-center justify-center text-[12px] text-[#646464]">Sin observaciones por área</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[400px] relative shrink-0 w-full" data-name="bar-chart-editable">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid flex min-h-[400px] flex-col items-start relative size-full">
        <div className="relative min-h-[360px] w-full shrink-0" data-name="plot-container">
          <div className="absolute bottom-[18px] left-[176px] right-0 top-0 flex justify-between" data-name="grid-lines">
            {AXIS_TICKS.map((tick) => (
              <div className="h-full w-px shrink-0" data-name={`grid-${tick}`} key={tick} style={{ backgroundColor: GRID }} />
            ))}
          </div>

          <div className="relative z-[1] flex min-h-[320px] w-full items-stretch" data-name="plot-area">
            <div className="flex w-[176px] shrink-0 flex-col justify-between py-[6px]" data-name="y-axis-labels">
              {visibleRows.map((row, index) => (
                <div className="flex min-h-[28px] items-center justify-end pr-[16px]" key={`${row.area}-${index}`}>
                  <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic text-[#646464] text-[12px] text-right">{row.area}</p>
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1" data-name="bars-area">
              <div className="relative flex h-full flex-col justify-between py-[6px]" data-name="bars">
                {visibleRows.map((row, index) => (
                  <div className="flex min-h-[28px] items-center" data-name="chart-row" key={`${row.area}-${index}`}>
                    <div className="flex w-full flex-col gap-[2px] items-start" data-name="bar-pair">
                      <BarWithTooltip color={CLOSED} label="Cerradas" value={row.closedFindings} width={barWidth(row.closedFindings)} />
                      <BarWithTooltip color={OPEN} label="Abiertas" value={row.openFindings} width={barWidth(row.openFindings)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-[1] flex h-[40px] w-full shrink-0" data-name="footer-spacer">
            <div className="w-[176px] shrink-0" />
            <div className="relative min-w-0 flex-1" data-name="x-axis">
              {AXIS_TICKS.map((tick) => {
                const ratio = clampRatio(tick);
                const style = tick === AXIS_MAX
                  ? { right: 0 }
                  : { left: `calc(${ratio * 100}% + 6px)` };

                return (
                  <p className="absolute top-[8px] [word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic text-[#646464] text-[11px] text-left whitespace-nowrap" key={tick} style={style}>
                    {formatTick(tick)}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        <div className="content-stretch flex gap-[20px] h-[35px] items-center justify-center relative shrink-0 w-full" data-name="legend">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="legend-item">
            <div className="relative rounded-[2px] shrink-0 size-[14px]" data-name="Rectangle" style={{ backgroundColor: CLOSED }} />
            <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#646464] text-[12px] whitespace-nowrap">Cerradas</p>
          </div>
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="legend-item">
            <div className="relative rounded-[2px] shrink-0 size-[14px]" data-name="Rectangle" style={{ backgroundColor: OPEN }} />
            <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#646464] text-[12px] whitespace-nowrap">Abiertas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
