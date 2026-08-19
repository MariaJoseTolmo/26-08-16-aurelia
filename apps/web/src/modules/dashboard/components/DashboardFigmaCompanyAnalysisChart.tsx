import type { InspectionDashboardCompanyChartRowResponse } from '@aurelia/contracts';

const CLOSED = '#1f6f8b';
const OPEN = '#e07838';
const GRID = '#e8e8e8';
const AXIS = '#ccc';
const MAX_VISIBLE_ROWS = 8;
const numberFormatter = new Intl.NumberFormat('es-CL');

type DashboardFigmaCompanyAnalysisChartProps = {
  rows: InspectionDashboardCompanyChartRowResponse[];
};

type BarWithTooltipProps = {
  color: string;
  label: string;
  value: number;
  width: string;
  top: number;
  name: string;
};

function getCurrentMonthLabel() {
  const now = new Date();
  const month = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(now);
  return `${month} ${now.getFullYear()}`;
}

function getScale(rows: InspectionDashboardCompanyChartRowResponse[]) {
  const maxDataValue = rows.reduce((max, row) => Math.max(max, row.closed, row.open), 0);
  const step = Math.max(5, Math.ceil(Math.max(maxDataValue, 30) / 6 / 5) * 5);
  const maxValue = Math.max(30, Math.ceil(maxDataValue / step) * step);
  const ticks = Array.from({ length: Math.floor(maxValue / step) + 1 }, (_, index) => index * step);

  return { maxValue, ticks };
}

function widthFor(value: number, maxValue: number) {
  return `${Math.max(0, Math.min(100, (value / maxValue) * 100))}%`;
}

function formatValue(value: number) {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function BarWithTooltip({ color, label, value, width, top, name }: BarWithTooltipProps) {
  return (
    <div className="group absolute left-0 h-[11px] rounded-[2px]" data-name={name} style={{ top, width, backgroundColor: color }}>
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[10] hidden -translate-x-1/2 overflow-clip rounded-[6px] bg-[rgba(33,48,64,0.94)] px-[8px] py-[6px] text-center shadow-[0_8px_20px_rgba(12,31,56,0.18)] group-hover:block">
        <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9px] font-normal leading-[normal] text-[rgba(255,255,255,0.75)]">{label}</p>
        <p className="whitespace-nowrap font-['Inter:Medium',sans-serif] text-[12px] font-medium leading-[normal] text-white">{formatValue(value)}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <div className="h-[10px] w-[12px] shrink-0" style={{ backgroundColor: color }} />
      <p className="font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-[normal] text-[#888] whitespace-nowrap">{label}</p>
    </div>
  );
}

export function DashboardFigmaCompanyAnalysisChart({ rows }: DashboardFigmaCompanyAnalysisChartProps) {
  const visibleRows = rows.slice(0, MAX_VISIBLE_ROWS);
  const { maxValue, ticks } = getScale(visibleRows);

  return (
    <div className="relative h-auto min-h-[397px] w-full shrink-0 rounded-[8px] bg-white drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)]" data-name="Container">
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[8px] border border-[#e3e3e3] border-solid" />
      <div className="relative flex size-full flex-col items-start px-[19px] py-[17px]">
        <div className="relative h-[18px] w-full shrink-0" data-name="Container (margin)">
          <p className="font-['Inter:Bold',sans-serif] text-[13px] font-bold leading-[normal] text-[#131313] whitespace-nowrap">Inspecciones abiertas y cerradas por empresa</p>
        </div>
        <div className="relative h-[27px] w-full shrink-0" data-name="Container (margin)">
          <p className="font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464] whitespace-nowrap">Empresas con observaciones {getCurrentMonthLabel()}</p>
        </div>
        <div className="relative h-[315px] w-full shrink-0 bg-white" data-name="Canvas">
          <div className="relative size-full overflow-visible rounded-[inherit]">
            {visibleRows.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#646464]">Sin observaciones por empresa en el mes actual</div>
            ) : (
              <>
                <div className="absolute bottom-[42px] left-[90px] right-0 top-[12px]" data-name="plot-area">
                  <div className="absolute inset-0 flex justify-between">
                    {ticks.map((tick) => (
                      <div className="h-full w-px shrink-0" data-name={`gridline-${tick}`} key={tick} style={{ backgroundColor: GRID }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-between py-[6px]">
                    {visibleRows.map((row) => (
                      <div className="relative h-[21px] w-full" key={row.companyId ?? row.company}>
                        <BarWithTooltip color={CLOSED} label="Obs. cerradas" value={row.closed} width={widthFor(row.closed, maxValue)} top={0} name={`bar-cerradas-${row.company}`} />
                        <BarWithTooltip color={OPEN} label="Obs. abiertas" value={row.open} width={widthFor(row.open, maxValue)} top={15} name={`bar-abiertas-${row.company}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-[42px] left-[90px] right-0 h-px" data-name="x-axis" style={{ backgroundColor: AXIS }} />
                <div className="absolute bottom-[28px] left-[90px] right-0 flex justify-between">
                  {ticks.map((tick) => (
                    <div className="relative flex w-[1px] justify-center" key={tick}>
                      <div className="absolute bottom-[11px] h-[5px] w-px" data-name={`tick-${tick}`} style={{ backgroundColor: '#aaa' }} />
                      <p className="absolute top-0 font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-[normal] text-[#aaa] whitespace-nowrap">{tick}</p>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-[54px] left-0 top-[12px] flex w-[84px] flex-col justify-between py-[6px]">
                  {visibleRows.map((row) => (
                    <div className="flex h-[21px] items-center justify-end" key={row.companyId ?? row.company}>
                      <p className="max-w-[84px] truncate font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-[normal] text-[#888] whitespace-nowrap">{row.company}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="absolute bottom-[3px] left-[90px] right-0 flex justify-center gap-[72px]">
              <LegendItem color={CLOSED} label="Obs. cerradas" />
              <LegendItem color={OPEN} label="Obs. abiertas" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
