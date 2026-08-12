import { useEffect, useMemo, useRef, useState } from 'react';
import { BellIcon } from '../../shared/components/icons/BellIcon';
import {
  SPR_CYCLE_TRACEABILITY,
  SPR_CYCLE_TRACEABILITY_FILTER_OPTIONS,
  SPR_CYCLE_TRACEABILITY_KPIS,
  SPR_CYCLE_TRACEABILITY_LEGEND,
  SPR_CYCLE_TRACEABILITY_TIMELINE,
  filterSprCycleTraceabilityTimeline,
  type SprCycleTraceabilityEventTone,
  type SprCycleTraceabilityFilterId,
  type SprCycleTraceabilityTimelineItem,
} from './sprCycleTraceability.constants';
import {
  SprProcessStatusApprovedIcon,
  SprProcessStatusDocumentIcon,
  SprProcessStatusRejectedIcon,
  SprWarningTriangleIcon,
} from './icons/SprIcons';

function toneNodeClass(tone: SprCycleTraceabilityEventTone) {
  if (tone === 'success') return 'bg-[#e0ffd3] text-[#3a9b3a]';
  if (tone === 'alert') return 'bg-[#fff0e6] text-[#e8720c]';
  if (tone === 'rejection') return 'bg-[#ffd0db] text-[#bd3b5b]';
  if (tone === 'correction') return 'bg-[#e6f9f4] text-[#00b398]';
  if (tone === 'regulatory') return 'bg-[#eef2f7] text-[#001e39]';
  if (tone === 'pending') return 'bg-[#f2f2f2] text-[#acacac]';
  return 'bg-[#e6f3ff] text-[#24588b]';
}

function TraceabilityNodeIcon({ tone }: { tone: SprCycleTraceabilityEventTone }) {
  if (tone === 'success') return <SprProcessStatusApprovedIcon className="h-[8px] w-[10px]" />;
  if (tone === 'rejection') return <SprProcessStatusRejectedIcon className="h-[8px] w-[10px]" />;
  if (tone === 'alert') return <SprWarningTriangleIcon className="h-[8px] w-[8px]" />;
  if (tone === 'pending') return <span className="text-[9px] font-bold leading-none">…</span>;
  return <BellIcon className="h-[8px] w-[10px]" />;
}

function LegendIcon({ tone }: { tone: SprCycleTraceabilityEventTone }) {
  return (
    <span className={`flex size-[16px] items-center justify-center rounded-[4px] ${toneNodeClass(tone)}`}>
      <TraceabilityNodeIcon tone={tone} />
    </span>
  );
}

function PhaseDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[12px] py-[24px]">
      <div className="h-px flex-1 bg-[#e3e3e3]" />
      <div className="flex items-center gap-[7px] rounded-[4px] border border-[#e3e3e3] bg-white px-[14px] py-[5px]">
        <BellIcon className="h-[10px] w-[12.5px] text-[#24588b]" />
        <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#001e39]">
          {label}
        </p>
      </div>
      <div className="h-px flex-1 bg-[#e3e3e3]" />
    </div>
  );
}

function TimelineEvent({ item }: { item: Extract<SprCycleTraceabilityTimelineItem, { kind: 'event' }> }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] gap-0">
      <div className="pr-[16px] text-right">
        <p className="font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">{item.timestamp}</p>
        <p className="pt-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
          {item.actor}
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        <div
          className={`relative z-[1] flex size-[20px] items-center justify-center rounded-full ${toneNodeClass(item.tone)}`}
        >
          <TraceabilityNodeIcon tone={item.tone} />
        </div>
        <div className="absolute bottom-0 top-[20px] w-[2px] bg-[#e3e3e3]" aria-hidden />
      </div>

      <div className="pb-[20px] pl-[16px]">
        {item.areaTag ? (
          <span className="mb-[6px] inline-flex rounded-[3px] bg-[#f2f2f2] px-[7px] py-[1px] font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#646464]">
            {item.areaTag}
          </span>
        ) : null}
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold leading-[16px] text-[#131313]">
          {item.title}
        </p>
        {item.note ? (
          <div className="mt-[5px] rounded-[4px] border border-[#ebebeb] bg-[#fafafa] px-[9px] py-[6px]">
            <p className="font-['Inter:Regular',sans-serif] text-[9.5px] leading-[14px] text-[#646464]">{item.note}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Vista de trazabilidad completa del ciclo (Figma 1831:51316). Datos MOCK.
export function SprCycleTraceabilityView({ filter }: { filter: SprCycleTraceabilityFilterId }) {
  const timeline = useMemo(
    () => filterSprCycleTraceabilityTimeline(SPR_CYCLE_TRACEABILITY_TIMELINE, filter),
    [filter],
  );

  return (
    <div className="w-full bg-white">
      <div className="px-[32px] pb-[32px] pt-[20px]">
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-5">
          {SPR_CYCLE_TRACEABILITY_KPIS.map((kpi) => (
            <div key={kpi.label} className="rounded-[9px] border border-[#e3e3e3] bg-white px-[15px] py-[12px]">
              <p
                className={`font-['Inter:Bold',sans-serif] text-[20px] font-bold leading-[20px] ${
                  kpi.valueTone === 'navy' ? 'text-[#001e39]' : 'text-[#00b398]'
                }`}
              >
                {kpi.value}
              </p>
              <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{kpi.label}</p>
              <p className="pt-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-[12px] text-[#646464]">
                {kpi.helper}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-[24px] rounded-[8px] border border-[#e3e3e3] bg-[#fafafa] px-[16px] py-[11px]">
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
            <p className="font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#646464]">Leyenda:</p>
            {SPR_CYCLE_TRACEABILITY_LEGEND.map((item) => (
              <div key={item.id} className="flex items-center gap-[5px]">
                <LegendIcon tone={item.id} />
                <p className="font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#646464]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[20px] max-w-[996px]">
          {timeline.map((item) =>
            item.kind === 'phase' ? (
              <PhaseDivider key={item.id} label={item.label} />
            ) : (
              <TimelineEvent key={item.id} item={item} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function SprCycleTraceabilityToolbar({
  onBack,
  filter,
  onFilterChange,
  cycleLabel,
}: {
  onBack: () => void;
  filter: SprCycleTraceabilityFilterId;
  onFilterChange: (filter: SprCycleTraceabilityFilterId) => void;
  cycleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    SPR_CYCLE_TRACEABILITY_FILTER_OPTIONS.find((option) => option.id === filter)?.label ??
    SPR_CYCLE_TRACEABILITY_FILTER_OPTIONS[0]?.label ??
    'Todos';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[#e3e3e3] bg-white px-[22px] py-[11px]">
      <div className="flex min-w-0 items-center gap-[14px]">
        <button
          type="button"
          onClick={onBack}
          className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] border border-[#e3e3e3] bg-[#f7f7f7] text-[#24588b] hover:bg-[#eef2f7]"
          aria-label="Volver al dashboard"
        >
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden>
            <path
              d="M6.5 1L1 6.5L6.5 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#131313]">
            {SPR_CYCLE_TRACEABILITY.title(cycleLabel)}
          </p>
          <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
            {SPR_CYCLE_TRACEABILITY.rangeSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-[8px]">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[9px] font-semibold text-[#646464]">
          {SPR_CYCLE_TRACEABILITY.filterLabel}
        </p>
        <div ref={rootRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex h-[26px] w-[175px] items-center gap-[8px] rounded-[8px] border border-[#d1d1d1] bg-white px-[8px]"
          >
            <span className="min-w-0 flex-1 truncate text-left font-['Inter:Regular',sans-serif] text-[13px] text-[#131313]">
              {selectedLabel}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-[#131313]">
              <path d="M4.25 6.25L8 10L11.75 6.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </button>

          {open ? (
            <div
              role="listbox"
              aria-label={SPR_CYCLE_TRACEABILITY.filterLabel}
              className="absolute right-0 top-[calc(100%+4px)] z-20 w-[251px] rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]"
            >
              {SPR_CYCLE_TRACEABILITY_FILTER_OPTIONS.map((option) => {
                const selected = option.id === filter;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onFilterChange(option.id);
                      setOpen(false);
                    }}
                    className={`flex h-[40px] w-full items-center rounded-[8px] px-[8px] text-left font-['Inter:Regular',sans-serif] text-[14px] tracking-[0.28px] text-[#131313] ${
                      selected ? 'bg-white' : 'hover:bg-[#f7f7f7]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          title="Pendiente de integración con exportación"
          className="flex h-[27px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b]"
        >
          <SprProcessStatusDocumentIcon className="h-[10px] w-[12.5px]" />
          {SPR_CYCLE_TRACEABILITY.exportLabel}
        </button>
      </div>
    </div>
  );
}
