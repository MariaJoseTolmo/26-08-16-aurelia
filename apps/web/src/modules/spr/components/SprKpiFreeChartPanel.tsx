import { useEffect, useRef, useState } from 'react';

import {
  SPR_KPI_FREE_COMPARE_DATA,
  SPR_KPI_FREE_KPI_OPTIONS,
  SPR_KPI_MONITORING_MONTHS,
  type SprKpiFreeKpiOption,
} from '../sprKpiMonitoring.constants';

function CaretIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 text-[#131313] transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4.25 6.25L8 10L11.75 6.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function CompareCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6.25L5 8.75L9.5 3.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function chipClass(tone: SprKpiFreeKpiOption['tone']) {
  if (tone === 'amber') return 'border-[#f5c4a0] bg-[#fff0e6] text-[#6b3a1f]';
  return 'border-[#c5d8f0] bg-[#e6f3ff] text-[#0d3862]';
}

function seriesColors(tone: SprKpiFreeKpiOption['tone']) {
  if (tone === 'amber') return { y2025: '#f4b882', y2026: '#e8720c' };
  return { y2025: '#8fbde0', y2026: '#24588b' };
}

type SprKpiFreeChartPanelProps = {
  selectedIds: string[];
  comparePreviousYear: boolean;
  onSelectedIdsChange: (ids: string[]) => void;
  onCompareChange: (value: boolean) => void;
};

/** Gráfico libre con comparación año anterior (Figma 2444:7912). */
export function SprKpiFreeChartPanel({
  selectedIds,
  comparePreviousYear,
  onSelectedIdsChange,
  onCompareChange,
}: SprKpiFreeChartPanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [pickerOpen]);

  const selected = SPR_KPI_FREE_KPI_OPTIONS.filter((opt) => selectedIds.includes(opt.id));
  const available = SPR_KPI_FREE_KPI_OPTIONS.filter((opt) => !selectedIds.includes(opt.id));

  const addKpi = (id: string) => {
    if (selectedIds.length >= 4) return;
    onSelectedIdsChange([...selectedIds, id]);
    setPickerOpen(false);
  };

  const removeKpi = (id: string) => {
    onSelectedIdsChange(selectedIds.filter((item) => item !== id));
  };

  const allValues = selected.flatMap((kpi) => {
    const data = SPR_KPI_FREE_COMPARE_DATA[kpi.id];
    if (!data) return [];
    return [...data.y2025, ...data.y2026.filter((v): v is number => v !== null)];
  });
  const maxValue = Math.max(...allValues, 1);
  const ticks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue].map((v) => Math.round(v));

  const chartWidth = 1031;
  const chartHeight = 198;
  const pad = { top: 8, right: 12, bottom: 22, left: 40 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;
  const groupWidth = plotW / SPR_KPI_MONITORING_MONTHS.length;
  const kpiCount = Math.max(selected.length, 1);
  const barSlot = groupWidth / (comparePreviousYear ? kpiCount * 2 : kpiCount);

  return (
    <div className="rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[13px]">
      <div className="flex flex-wrap items-center gap-[7px]">
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex h-[26px] w-[210px] items-center gap-[8px] rounded-[8px] border border-[#d1d1d1] bg-white px-[8px]"
          >
            <span className="min-w-0 flex-1 truncate text-left font-['Inter:Regular',sans-serif] text-[13px] text-[#131313]">
              + Agregar KPI...
            </span>
            <CaretIcon open={pickerOpen} />
          </button>
          {pickerOpen && available.length > 0 ? (
            <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-[280px] rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_4px_rgba(19,19,19,0.24)]">
              {available.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => addKpi(opt.id)}
                  className="flex h-[36px] w-full items-center rounded-[8px] px-[8px] text-left hover:bg-[#f7f7f7]"
                >
                  <span className="font-['Inter:Regular',sans-serif] text-[13px] text-[#131313]">{opt.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-[4px]">
          {selected.map((kpi) => (
            <span
              key={kpi.id}
              className={`inline-flex items-center gap-[4px] rounded-[4px] border px-[8px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold tracking-[0.14px] ${chipClass(kpi.tone)}`}
            >
              {kpi.label}
              <button type="button" onClick={() => removeKpi(kpi.id)} className="opacity-55 hover:opacity-100" aria-label={`Quitar ${kpi.label}`}>
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onCompareChange(!comparePreviousYear)}
            className={`flex items-center gap-[5px] rounded-[5px] border px-[9px] py-[5px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold tracking-[0.12px] ${
              comparePreviousYear
                ? 'border-[#001e39] bg-[#e6f3ff] text-[#0d3862]'
                : 'border-[#d1d1d1] bg-white text-[#646464]'
            }`}
          >
            <span className="flex size-[18px] items-center justify-center rounded-[5px] border-[1.5px] border-[#c8a064] bg-[#c8a064]">
              {comparePreviousYear ? <CompareCheckIcon /> : null}
            </span>
            Comparar con año anterior
          </button>
        </div>
      </div>

      {comparePreviousYear ? (
        <div className="pt-[10px]">
          <div className="flex flex-wrap items-center gap-[8px] rounded-[6px] border border-[#c5d8f0] bg-[#e6f3ff] px-[11px] py-[8px]">
            <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#0d3862]">
              Mostrando <span className="font-bold">2025</span> (claro) vs <span className="font-bold">2026</span> (sólido) para los mismos meses
            </p>
            <span className="rounded-[4px] bg-[#e6f3ff] px-[7px] py-[2px] font-['Inter:Bold',sans-serif] text-[9px] font-bold text-[#0d3862]">
              Ene–Feb · 12 meses comparados
            </span>
            <p className="ml-auto font-['Inter:Regular',sans-serif] text-[9px] text-[#24588b]">
              Las barras claras = 2025 · barras oscuras = 2026
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-[9px] gap-y-[4px] pt-[10px]">
          <div className="flex items-center gap-[4px]">
            <span className="h-[2px] w-[16px] rounded-full bg-[#acacac]" />
            <span className="font-['Inter:Regular',sans-serif] text-[9px] text-[#646464]">Promedio del año</span>
          </div>
          {selected.map((kpi) => (
            <div key={kpi.id} className="flex items-center gap-[4px]">
              <span className="size-[10px] rounded-[2px]" style={{ backgroundColor: seriesColors(kpi.tone).y2026 }} />
              <span className="font-['Inter:Regular',sans-serif] text-[9px] text-[#646464]">
                {kpi.label} (2026)
              </span>
            </div>
          ))}
        </div>
      )}

      {comparePreviousYear ? (
        <div className="flex flex-wrap items-center gap-x-[9px] gap-y-[4px] pt-[8px]">
          {selected.flatMap((kpi) => {
            const colors = seriesColors(kpi.tone);
            return [
              { label: `${kpi.label} 2025`, color: colors.y2025 },
              { label: `${kpi.label} 2026`, color: colors.y2026 },
            ];
          }).map((item) => (
            <div key={item.label} className="flex items-center gap-[4px]">
              <span className="size-[10px] rounded-[2px]" style={{ backgroundColor: item.color }} />
              <span className="font-['Inter:Regular',sans-serif] text-[9px] tracking-[0.167px] text-[#646464]">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-[4px] pl-[8px]">
            <span className="size-[10px] rounded-[2px] border border-dashed border-[#acacac]" />
            <span className="font-['Inter:Regular',sans-serif] text-[9px] tracking-[0.167px] text-[#646464]">Sin dato 2026 aún</span>
          </div>
        </div>
      ) : null}

      <div className="pt-[6px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[198px] w-full" preserveAspectRatio="none">
          {ticks.map((tick) => {
            const y = pad.top + plotH - (tick / maxValue) * plotH;
            return (
              <g key={tick}>
                <line x1={pad.left} x2={pad.left + plotW} y1={y} y2={y} stroke="#ebebeb" strokeWidth="0.66" />
                <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#acacac" fontSize="9.9" fontFamily="Inter, sans-serif">
                  {tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
                </text>
              </g>
            );
          })}

          {SPR_KPI_MONITORING_MONTHS.map((month, monthIndex) => {
            const cx = pad.left + groupWidth * monthIndex + groupWidth / 2;
            return (
              <text key={month} x={cx} y={chartHeight - 6} textAnchor="middle" fill="#acacac" fontSize="9.9" fontFamily="Inter, sans-serif">
                {month}
              </text>
            );
          })}

          {selected.map((kpi, kpiIndex) => {
            const data = SPR_KPI_FREE_COMPARE_DATA[kpi.id];
            if (!data) return null;
            const colors = seriesColors(kpi.tone);
            const kpiOffset = kpiIndex * (comparePreviousYear ? barSlot * 2 : barSlot);

            return SPR_KPI_MONITORING_MONTHS.map((_, monthIndex) => {
              const groupX = pad.left + groupWidth * monthIndex;

              if (comparePreviousYear) {
                const y2025 = data.y2025[monthIndex];
                const y2026 = data.y2026[monthIndex];
                const bars = [];

                if (y2025 !== undefined) {
                  const h = (y2025 / maxValue) * plotH;
                  bars.push(
                    <rect
                      key={`${kpi.id}-${monthIndex}-2025`}
                      x={groupX + (groupWidth - barSlot * 2 * selected.length) / 2 + kpiOffset}
                      y={pad.top + plotH - h}
                      width={barSlot * 0.85}
                      height={h}
                      fill={colors.y2025}
                      opacity="0.85"
                      rx="1"
                    />,
                  );
                }

                if (y2026 === null) {
                  bars.push(
                    <rect
                      key={`${kpi.id}-${monthIndex}-2026-empty`}
                      x={groupX + (groupWidth - barSlot * 2 * selected.length) / 2 + kpiOffset + barSlot}
                      y={pad.top + plotH * 0.35}
                      width={barSlot * 0.85}
                      height={plotH * 0.45}
                      fill="none"
                      stroke={colors.y2026}
                      strokeWidth="1"
                      strokeDasharray="3 2"
                      opacity="0.55"
                      rx="1"
                    />,
                  );
                } else if (y2026 !== undefined) {
                  const h = (y2026 / maxValue) * plotH;
                  bars.push(
                    <rect
                      key={`${kpi.id}-${monthIndex}-2026`}
                      x={groupX + (groupWidth - barSlot * 2 * selected.length) / 2 + kpiOffset + barSlot}
                      y={pad.top + plotH - h}
                      width={barSlot * 0.85}
                      height={h}
                      fill={colors.y2026}
                      rx="1"
                    />,
                  );
                }

                return <g key={`${kpi.id}-${monthIndex}`}>{bars}</g>;
              }

              const value = data.y2026[monthIndex];
              if (value === null || value === undefined) return null;
              const h = (value / maxValue) * plotH;
              return (
                <rect
                  key={`${kpi.id}-${monthIndex}`}
                  x={groupX + (groupWidth - barSlot * selected.length) / 2 + kpiOffset}
                  y={pad.top + plotH - h}
                  width={barSlot * 0.85}
                  height={h}
                  fill={colors.y2026}
                  rx="1"
                />
              );
            });
          })}

          {!comparePreviousYear ? (
            <line
              x1={pad.left}
              x2={pad.left + plotW}
              y1={pad.top + plotH * 0.45}
              y2={pad.top + plotH * 0.45}
              stroke="#acacac"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}
