import { useEffect, useMemo, useRef, useState } from 'react';
import type { InspectionDashboardPeriod, InspectionDashboardQueryParams } from '../../../shared/services/inspections.service';

type Props = {
  value: InspectionDashboardQueryParams;
  onChange: (value: InspectionDashboardQueryParams) => void;
  clearIconPath: string;
  caretIconPath: string;
};

type PeriodOption = { value: InspectionDashboardPeriod; label: string; month?: number; quarterStart?: number };

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = Array.from({ length: 4 }, (_, index) => currentYear - index);
const periods: PeriodOption[] = [
  { value: 'q1', label: 'T1 · Ene–Mar', quarterStart: 1 },
  { value: 'm1', label: 'Enero', month: 1 },
  { value: 'm2', label: 'Febrero', month: 2 },
  { value: 'm3', label: 'Marzo', month: 3 },
  { value: 'q2', label: 'T2 · Abr–Jun', quarterStart: 4 },
  { value: 'm4', label: 'Abril', month: 4 },
  { value: 'm5', label: 'Mayo', month: 5 },
  { value: 'm6', label: 'Junio', month: 6 },
  { value: 'q3', label: 'T3 · Jul–Sep', quarterStart: 7 },
  { value: 'm7', label: 'Julio', month: 7 },
  { value: 'm8', label: 'Agosto', month: 8 },
  { value: 'm9', label: 'Septiembre', month: 9 },
  { value: 'q4', label: 'T4 · Oct–Dic', quarterStart: 10 },
  { value: 'm10', label: 'Octubre', month: 10 },
  { value: 'm11', label: 'Noviembre', month: 11 },
  { value: 'm12', label: 'Diciembre', month: 12 },
];

function Icon({ path, fill }: { path: string; fill: string }) {
  return <path d={path} fill={fill} />;
}

export function getCurrentDashboardPeriod(): InspectionDashboardPeriod {
  if (currentMonth >= 10) return 'q4';
  if (currentMonth >= 7) return 'q3';
  if (currentMonth >= 4) return 'q2';
  return 'q1';
}

function isPeriodDisabled(option: PeriodOption, selectedYear: number) {
  if (selectedYear < currentYear) return false;
  if (option.month) return option.month > currentMonth;
  if (option.quarterStart) return option.quarterStart > currentMonth;
  return false;
}

export function DashboardPeriodLite({ value, onChange, clearIconPath, caretIconPath }: Props) {
  const [open, setOpen] = useState<'year' | 'period' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const periodLabel = periods.find((period) => period.value === value.period)?.label ?? 'T1 · Ene–Mar';
  const periodItems = useMemo(() => periods.map((period) => ({ ...period, disabled: isPeriodDisabled(period, value.year) })), [value.year]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);

  return (
    <div ref={rootRef} className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0">
      <div className="relative shrink-0">
        <button className="bg-white border border-[#d1d1d1] border-solid flex h-[36px] w-[96px] items-center justify-between rounded-[8px] px-[14px]" type="button" onClick={() => setOpen(open === 'year' ? null : 'year')}>
          <span className="font-['Inter:Regular',sans-serif] font-normal text-[#131313] text-[13px]">{value.year}</span>
          <svg className="h-[10px] w-[12.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10"><Icon path={caretIconPath} fill="#131313" /></svg>
        </button>
        {open === 'year' ? (
          <div className="absolute right-0 top-[44px] z-50 bg-white border border-[#d1d1d1] border-solid flex flex-col items-start p-[8px] rounded-[12px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)] w-[128px]">
            {years.slice().reverse().map((year) => (
              <button key={year} className={`h-[40px] min-h-[40px] w-full shrink-0 rounded-[8px] px-[8px] text-left font-['Inter:Regular',sans-serif] font-normal text-[#131313] text-[13px] ${year === value.year ? 'bg-[#e3e3e3]' : 'bg-white hover:bg-[#e3e3e3]'}`} type="button" onClick={() => { onChange({ ...value, year }); setOpen(null); }}>
                {year}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative shrink-0">
        <button className="bg-white border border-[#d1d1d1] border-solid flex h-[36px] w-[144px] items-center justify-between rounded-[8px] px-[14px]" type="button" onClick={() => setOpen(open === 'period' ? null : 'period')}>
          <span className="font-['Inter:Regular',sans-serif] font-normal text-[#131313] text-[13px] whitespace-nowrap">{periodLabel}</span>
          <svg className="h-[10px] w-[12.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10"><Icon path={caretIconPath} fill="#131313" /></svg>
        </button>
        {open === 'period' ? (
          <div className="absolute right-0 top-[44px] z-50 bg-white border border-[#d1d1d1] border-solid flex max-h-[680px] flex-col items-start overflow-y-auto p-[8px] rounded-[12px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)] w-[210px]">
            {periodItems.map((period) => (
              <button key={period.value} className={`h-[40px] min-h-[40px] w-full shrink-0 rounded-[8px] px-[8px] text-left font-['Inter:Regular',sans-serif] font-normal text-[13px] ${period.value === value.period ? 'bg-[#e3e3e3] text-[#131313]' : period.disabled ? 'bg-white text-[#131313] opacity-40 cursor-not-allowed' : 'bg-white text-[#131313] hover:bg-[#e3e3e3]'}`} type="button" disabled={period.disabled} onClick={() => { onChange({ ...value, period: period.value }); setOpen(null); }}>
                {period.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button className="bg-white border border-[#d1d1d1] border-solid content-stretch flex gap-[5px] h-[34px] items-center px-[13px] py-px relative rounded-[7px] shrink-0" type="button" onClick={() => { onChange({ year: currentYear, period: getCurrentDashboardPeriod() }); setOpen(null); }}>
        <svg className="h-[11px] w-[13.75px]" fill="none" preserveAspectRatio="none" viewBox="0 0 13.75 11.0005"><Icon path={clearIconPath} fill="#646464" /></svg>
        <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#646464] text-[11px] text-center whitespace-nowrap"> Limpiar</span>
      </button>
    </div>
  );
}
