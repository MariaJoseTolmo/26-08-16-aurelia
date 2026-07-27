import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  announceInspectionManagementOverlay,
  nextInspectionManagementOverlaySourceId,
  subscribeToInspectionManagementOverlay,
} from './inspection-management-overlay';

export type MultiSelectOption = {
  label: string;
  value: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

type MultiSelectTableFilterProps = {
  value: string;
  onChange: (value: string) => void;
  width: number;
  allLabel: string;
  options: MultiSelectOption[];
};

const viewportMargin = 8;
const triggerGap = 6;
const menuMaxWidth = 316;
const menuMaxHeight = 360;

function parseValue(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function buildMenuPosition(trigger: HTMLButtonElement, rowCount: number): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(menuMaxWidth, Math.max(180, window.innerWidth - viewportMargin * 2));
  const estimatedHeight = Math.min(menuMaxHeight, rowCount * 47 + 16);
  const left = Math.min(
    Math.max(viewportMargin, rect.left),
    Math.max(viewportMargin, window.innerWidth - width - viewportMargin),
  );
  const below = rect.bottom + triggerGap;
  const top = below + estimatedHeight > window.innerHeight - viewportMargin
    ? Math.max(viewportMargin, rect.top - estimatedHeight - triggerGap)
    : below;
  return { top, left, width };
}

function CheckIcon() {
  return <svg className="h-[12px] w-[12px]" fill="none" viewBox="0 0 12 12" aria-hidden><path d="M2.2 6.2 4.8 8.8 9.8 2.8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChevronDownIcon() {
  return <svg className="size-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8.7063 11.3741C8.31584 11.7646 7.68173 11.7646 7.29127 11.3741L3.29293 7.3757C3.00555 7.08831 2.92121 6.66035 3.0774 6.2855C3.23358 5.91065 3.59593 5.66699 4.00201 5.66699H11.9987C12.4016 5.66699 12.7671 5.91065 12.9233 6.2855C13.0795 6.66035 12.992 7.08831 12.7078 7.3757L8.70942 11.3741H8.7063Z" fill="#131313" /></svg>;
}

function Checkbox({ checked }: { checked: boolean }) {
  return <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-solid ${checked ? 'border-[#c8a064] bg-[#c8a064]' : 'border-[#131313] bg-white'}`}>{checked ? <CheckIcon /> : null}</span>;
}

export function MultiSelectTableFilter({ value, onChange, width, allLabel, options }: MultiSelectTableFilterProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const sourceIdRef = useRef(nextInspectionManagementOverlaySourceId('select'));
  const selectedValues = useMemo(() => parseValue(value), [value]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedLabels = options.filter((option) => selectedSet.has(option.value)).map((option) => option.label);
  const displayValue = selectedLabels.length === 0 ? allLabel : selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} seleccionadas`;
  const visibleRowCount = options.length + 1;

  function close() {
    setOpen(false);
    setMenuPosition(null);
  }

  function openMenu() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    announceInspectionManagementOverlay({
      kind: 'select',
      owner: trigger,
      sourceId: sourceIdRef.current,
    });
    setMenuPosition(buildMenuPosition(trigger, visibleRowCount));
    setOpen(true);
  }

  function toggleMenu() {
    if (open) close();
    else openMenu();
  }

  function toggleOption(optionValue: string) {
    const nextValues = selectedSet.has(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];
    onChange(nextValues.join(','));
  }

  useEffect(() => subscribeToInspectionManagementOverlay((detail) => {
    if (detail.sourceId === sourceIdRef.current) return;
    setOpen(false);
    setMenuPosition(null);
  }), []);

  useEffect(() => {
    if (!open) return undefined;

    const reposition = () => {
      const trigger = triggerRef.current;
      if (trigger) setMenuPosition(buildMenuPosition(trigger, visibleRowCount));
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    reposition();
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, visibleRowCount]);

  const menu = open && menuPosition ? createPortal(
    <div
      ref={menuRef}
      className="fixed z-[11000] flex max-h-[360px] flex-col items-start overflow-y-auto rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
      style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, width: `${menuPosition.width}px` }}
      role="listbox"
      aria-label={allLabel}
      aria-multiselectable="true"
    >
      <button className={`flex w-full items-center gap-[8px] rounded-[8px] px-[8px] py-[12px] text-left transition-colors hover:bg-[#e3e3e3] ${selectedValues.length === 0 ? 'bg-[#e3e3e3]' : 'bg-white'}`} type="button" role="option" aria-selected={selectedValues.length === 0} onClick={() => onChange('')}>
        <Checkbox checked={selectedValues.length === 0} />
        <span className="min-w-0 flex-1 font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{allLabel}</span>
      </button>
      {options.map((option) => {
        const checked = selectedSet.has(option.value);
        return (
          <button key={option.value} className={`flex w-full items-center gap-[8px] rounded-[8px] px-[8px] py-[12px] text-left transition-colors hover:bg-[#e3e3e3] ${checked ? 'bg-[#e3e3e3]' : 'bg-white'}`} type="button" role="option" aria-selected={checked} onClick={() => toggleOption(option.value)}>
            <Checkbox checked={checked} />
            <span className="min-w-0 flex-1 font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.label}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <button ref={triggerRef} className="flex h-[26px] items-center justify-center gap-[8px] overflow-hidden rounded-[8px] border border-solid border-[#d1d1d1] bg-white px-[8px] py-[5px] font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0" style={{ width: `${width}px` }} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={toggleMenu}>
        <span className="min-w-0 flex-1 truncate text-left">{displayValue}</span>
        <ChevronDownIcon />
      </button>
      {menu}
    </div>
  );
}
