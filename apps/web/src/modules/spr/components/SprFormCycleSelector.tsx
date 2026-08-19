import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  isSprFormCycleEstimatesMode,
  SPR_FORM_CYCLE_QUERY,
  SPR_FORM_CYCLES,
  SPR_FORM_ESTIMATES_MODE,
  sprFormCycleTriggerLabel,
  sprFormHasPriorEstimatesAlert,
  type SprFormCycle,
  type SprFormCyclePickerBadge,
} from '../sprFormCycles';

function SprCycleCaretIcon({ open }: { open: boolean }) {
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

function CyclePickerBadge({ badge }: { badge: SprFormCyclePickerBadge }) {
  if (badge.kind === 'open-estimates') {
    return (
      <span className="shrink-0 rounded-[4px] bg-[#f3eeff] px-[6px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[8.5px] font-semibold text-[#7b4fbf]">
        {badge.label}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-[3px] bg-[#e0ffd3] px-[5px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[8.5px] font-semibold text-[#2a5c16]">
      {badge.label}
    </span>
  );
}

type SprFormCycleSelectorProps = {
  cycle: SprFormCycle;
  className?: string;
};

/** Selector de ciclo — Responsable de Área (Figma 2404:2037 / 2424:1066). */
export function SprFormCycleSelector({ cycle, className = '' }: SprFormCycleSelectorProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const showEstimatesAlert = sprFormHasPriorEstimatesAlert();
  const showTriggerEstimatesBadge = isSprFormCycleEstimatesMode(cycle);

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

  const selectCycle = (next: SprFormCycle) => {
    const params = new URLSearchParams(searchParams);
    params.set(SPR_FORM_CYCLE_QUERY, next.id);
    setOpen(false);
    navigate({ pathname: '/spr', search: `?${params.toString()}` });
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={
          showEstimatesAlert
            ? `${sprFormCycleTriggerLabel(cycle)}. Hay ciclos anteriores con datos estimados`
            : 'Seleccionar ciclo'
        }
        className={`relative flex h-[26px] items-center gap-[8px] rounded-[8px] border border-[#d1d1d1] bg-white px-[8px] ${
          showTriggerEstimatesBadge ? 'min-w-[220px]' : 'w-[175px]'
        }`}
      >
        <span className="min-w-0 flex-1 truncate text-left font-['Inter:Regular',sans-serif] text-[13px] text-[#131313]">
          {sprFormCycleTriggerLabel(cycle)}
        </span>
        {showTriggerEstimatesBadge ? (
          <span className="shrink-0 rounded-[4px] bg-[#f3eeff] px-[6px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[8.5px] font-semibold text-[#7b4fbf]">
            {SPR_FORM_ESTIMATES_MODE.triggerBadgeLabel}
          </span>
        ) : null}
        <SprCycleCaretIcon open={open} />
        {showEstimatesAlert ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-[-3px] top-[-5.5px] size-[10px] rounded-full bg-[#e53935]"
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Seleccionar ciclo"
          className="absolute right-0 top-[calc(100%+4px)] z-30 w-[302px] rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_4px_rgba(19,19,19,0.24)]"
        >
          {SPR_FORM_CYCLES.map((option) => {
            const selected = option.id === cycle.id;
            const label = option.isActual ? `${option.label} (Actual)` : option.label;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectCycle(option)}
                className={`flex h-[40px] w-full items-center gap-[8px] rounded-[8px] px-[8px] text-left ${
                  selected ? 'bg-[#f0f0f0]' : 'hover:bg-[#f7f7f7]'
                }`}
              >
                <span className="min-w-0 flex-1 truncate font-['Inter:Regular',sans-serif] text-[14px] tracking-[0.28px] text-[#131313]">
                  {label}
                </span>
                {option.pickerBadge ? <CyclePickerBadge badge={option.pickerBadge} /> : null}
              </button>
            );
          })}
          <div className="flex h-[40px] items-center px-[8px] font-['Inter:Regular',sans-serif] text-[14px] tracking-[0.28px] text-[#131313]">
            ...
          </div>
        </div>
      ) : null}
    </div>
  );
}
