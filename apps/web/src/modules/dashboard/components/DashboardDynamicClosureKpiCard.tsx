interface DashboardDynamicClosureKpiCardProps {
  iconPath: string;
  title: string;
  rate: number;
  detail: string;
  accent: string;
  iconColor: string;
}

function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue)}%`;
}

export function DashboardDynamicClosureKpiCard({
  iconPath,
  title,
  rate,
  detail,
  accent,
  iconColor,
}: DashboardDynamicClosureKpiCardProps) {
  return (
    <div className="bg-white h-[106px] relative rounded-[8px] w-full min-w-[150px]" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip p-[15px] relative rounded-[inherit] size-full">
        <div className="h-[13px] relative shrink-0 w-full" data-name="Container">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
            <div className="absolute h-[10px] left-0 top-[1.25px] w-[12.5px]" data-name="Image">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10">
                <g id="Image">
                  <path d={iconPath} fill={iconColor} id="Vector" />
                </g>
              </svg>
            </div>
            <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[13px] left-[12.5px] not-italic text-[#646464] text-[10px] top-[0.5px] tracking-[0.4px] uppercase whitespace-nowrap"> {title}</p>
          </div>
        </div>
        <div className="h-[32px] relative shrink-0 w-[128px]" data-name="Container (margin)">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[6px] relative size-full">
            <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[26px] not-italic relative shrink-0 text-[#131313] text-[26px] whitespace-nowrap">{formatPercent(rate)}</p>
          </div>
        </div>
        <div className="h-[18px] relative shrink-0 w-[128px]" data-name="Container (margin)">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[5px] relative size-full">
            <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#646464] text-[11px] whitespace-nowrap">{detail}</p>
          </div>
        </div>
        <div className="absolute h-[104px] left-px top-px w-[3px]" data-name="Text" style={{ backgroundColor: accent }} />
      </div>
      <div aria-hidden className="absolute border border-[#e3e3e3] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
