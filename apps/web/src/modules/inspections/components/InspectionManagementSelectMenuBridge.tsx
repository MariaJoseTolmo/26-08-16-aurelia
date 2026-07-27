import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import {
  announceInspectionManagementOverlay,
  nextInspectionManagementOverlaySourceId,
  subscribeToInspectionManagementOverlay,
} from './inspection-management-overlay';

type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
};

type SelectMenuState = {
  top: number;
  left: number;
  width: number;
  select: HTMLSelectElement;
  options: SelectOption[];
};

const viewportMargin = 8;
const triggerGap = 6;
const maxMenuHeight = 280;

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function selectValues(select: HTMLSelectElement) {
  return Array.from(select.options).map((option) => option.value);
}

function isPageSizeSelect(select: HTMLSelectElement) {
  const values = selectValues(select);
  return values.length === 3 && values[0] === '10' && values[1] === '25' && values[2] === '50';
}

function isManagementSelect(select: HTMLSelectElement) {
  if (normalizedPath() !== '/inspections') return false;
  return Boolean(select.closest('table')) || isPageSizeSelect(select);
}

function readOptions(select: HTMLSelectElement): SelectOption[] {
  return Array.from(select.options).map((option) => ({
    value: option.value,
    label: option.textContent?.trim() || option.label || option.value,
    disabled: option.disabled,
  }));
}

function buildMenuState(select: HTMLSelectElement): SelectMenuState {
  const rect = select.getBoundingClientRect();
  const options = readOptions(select);
  const width = Math.min(Math.max(rect.width, 180), 280);
  const contentHeight = Math.min(options.length * 40 + 16, maxMenuHeight);
  const left = Math.min(Math.max(viewportMargin, rect.left), window.innerWidth - width - viewportMargin);
  const below = rect.bottom + triggerGap;
  const top = below + contentHeight > window.innerHeight - viewportMargin
    ? Math.max(viewportMargin, rect.top - contentHeight - triggerGap)
    : below;
  return { top, left, width, select, options };
}

function setSelectExpanded(select: HTMLSelectElement, expanded: boolean) {
  select.setAttribute('aria-haspopup', 'listbox');
  select.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function setNativeSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  if (setter) setter.call(select, value);
  else select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

export function InspectionManagementSelectMenuBridge(): ReactElement | null {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<SelectMenuState | null>(null);
  const sourceIdRef = useRef(nextInspectionManagementOverlaySourceId('select'));
  const [menu, setMenu] = useState<SelectMenuState | null>(null);

  function updateMenu(next: SelectMenuState | null) {
    const previous = menuRef.current;
    if (previous && previous.select !== next?.select) setSelectExpanded(previous.select, false);
    if (!next && previous) setSelectExpanded(previous.select, false);
    if (next) setSelectExpanded(next.select, true);
    menuRef.current = next;
    setMenu(next);
  }

  function toggleSelect(select: HTMLSelectElement) {
    if (menuRef.current?.select === select) {
      updateMenu(null);
      return;
    }

    announceInspectionManagementOverlay({
      kind: 'select',
      owner: select,
      sourceId: sourceIdRef.current,
    });
    select.focus({ preventScroll: true });
    updateMenu(buildMenuState(select));
  }

  function chooseOption(option: SelectOption) {
    const current = menuRef.current;
    if (!current || option.disabled) return;
    setNativeSelectValue(current.select, option.value);
    updateMenu(null);
    current.select.focus({ preventScroll: true });
  }

  useEffect(() => {
    const unsubscribeOverlay = subscribeToInspectionManagementOverlay((detail) => {
      if (detail.sourceId === sourceIdRef.current) return;
      if (menuRef.current) updateMenu(null);
    });

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (portalRef.current?.contains(target)) return;
      const element = target instanceof Element ? target : target.parentElement;
      const select = element?.closest('select');
      if (select instanceof HTMLSelectElement && isManagementSelect(select)) {
        event.preventDefault();
        event.stopPropagation();
        toggleSelect(select);
        return;
      }
      if (menuRef.current) updateMenu(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLSelectElement
        && isManagementSelect(target)
        && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')
      ) {
        event.preventDefault();
        toggleSelect(target);
        return;
      }
      if (event.key === 'Escape' && menuRef.current) updateMenu(null);
    }

    function repositionMenu() {
      const current = menuRef.current;
      if (!current) return;
      if (!document.body.contains(current.select) || !isManagementSelect(current.select)) {
        updateMenu(null);
        return;
      }
      const next = buildMenuState(current.select);
      menuRef.current = next;
      setMenu(next);
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', repositionMenu);
    window.addEventListener('scroll', repositionMenu, true);

    return () => {
      unsubscribeOverlay();
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', repositionMenu);
      window.removeEventListener('scroll', repositionMenu, true);
      if (menuRef.current) setSelectExpanded(menuRef.current.select, false);
    };
  }, []);

  if (!menu) return null;

  return createPortal(
    <div
      ref={portalRef}
      data-inspection-management-select-portal="true"
      className="fixed z-[11000] flex max-h-[280px] flex-col items-start overflow-y-auto rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]"
      style={{ top: `${menu.top}px`, left: `${menu.left}px`, width: `${menu.width}px` }}
      role="listbox"
      aria-label="Opciones del filtro"
    >
      {menu.options.map((option) => {
        const selected = option.value === menu.select.value;
        return (
          <button
            key={`${option.value}-${option.label}`}
            type="button"
            className={`flex h-[40px] min-h-[40px] w-full shrink-0 items-center rounded-[8px] px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[22.7px] text-[#131313] transition-colors ${option.disabled ? 'cursor-not-allowed bg-white opacity-40' : selected ? 'bg-[#e3e3e3] hover:bg-[#e3e3e3]' : 'bg-white hover:bg-[#e3e3e3]'}`}
            disabled={option.disabled}
            role="option"
            aria-selected={selected}
            onClick={() => chooseOption(option)}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
