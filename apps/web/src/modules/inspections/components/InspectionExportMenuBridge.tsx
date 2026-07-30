import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { InspectionExportReportModal, type InspectionExportFormat } from './InspectionExportReportModal';

type ExportMenuState = {
  top: number;
  left: number;
  trigger: HTMLButtonElement;
};

const menuWidth = 235;
const menuHeight = 96;
const viewportMargin = 8;
const triggerGap = 8;

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function isInspectionExportTrigger(button: HTMLButtonElement) {
  const path = normalizedPath();
  return (path === '/inspections' || path === '/inspections/history')
    && normalizeText(button.textContent ?? '') === 'Exportar';
}

function buildMenuState(trigger: HTMLButtonElement): ExportMenuState {
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(Math.max(viewportMargin, rect.right - menuWidth), window.innerWidth - menuWidth - viewportMargin);
  const below = rect.bottom + triggerGap;
  const top = below + menuHeight > window.innerHeight - viewportMargin ? Math.max(viewportMargin, rect.top - menuHeight - triggerGap) : below;
  return { top, left, trigger };
}

function setTriggerExpanded(trigger: HTMLButtonElement, expanded: boolean) {
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const icons = trigger.querySelectorAll('svg');
  const caret = icons.length > 0 ? icons[icons.length - 1] : null;
  if (!(caret instanceof SVGElement)) return;
  caret.style.transform = expanded ? 'rotate(180deg)' : '';
  caret.style.transformOrigin = 'center';
}

export function InspectionExportMenuBridge(): ReactElement | null {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<ExportMenuState | null>(null);
  const [menu, setMenu] = useState<ExportMenuState | null>(null);
  const [modalFormat, setModalFormat] = useState<InspectionExportFormat | null>(null);

  function updateMenu(next: ExportMenuState | null) {
    const previous = menuRef.current;
    if (previous && previous.trigger !== next?.trigger) setTriggerExpanded(previous.trigger, false);
    if (!next && previous) setTriggerExpanded(previous.trigger, false);
    if (next) setTriggerExpanded(next.trigger, true);
    menuRef.current = next;
    setMenu(next);
  }

  function selectFormat(format: InspectionExportFormat) {
    updateMenu(null);
    setModalFormat(format);
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (portalRef.current?.contains(target)) return;

      const element = target instanceof Element ? target : target.parentElement;
      const button = element?.closest('button');
      if (button instanceof HTMLButtonElement && isInspectionExportTrigger(button)) {
        event.preventDefault();
        event.stopPropagation();
        if (menuRef.current?.trigger === button) updateMenu(null);
        else updateMenu(buildMenuState(button));
        return;
      }

      if (menuRef.current) updateMenu(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuRef.current) updateMenu(null);
    }

    function repositionMenu() {
      const current = menuRef.current;
      if (!current) return;
      const next = buildMenuState(current.trigger);
      menuRef.current = next;
      setMenu(next);
    }

    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', repositionMenu);
    window.addEventListener('scroll', repositionMenu, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', repositionMenu);
      window.removeEventListener('scroll', repositionMenu, true);
      if (menuRef.current) setTriggerExpanded(menuRef.current.trigger, false);
    };
  }, []);

  if (!menu && !modalFormat) return null;

  return (
    <>
      {menu ? createPortal(
        <div
          ref={portalRef}
          className="fixed z-[10000] flex h-[96px] w-[235px] flex-col items-start rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]"
          style={{ top: `${menu.top}px`, left: `${menu.left}px` }}
          role="menu"
          aria-label="Formatos de exportación"
        >
          <button
            type="button"
            className="flex h-[40px] w-full shrink-0 items-center rounded-[8px] bg-white px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313] hover:bg-[#e3e3e3]"
            role="menuitem"
            onClick={() => selectFormat('excel')}
          >
            Excel (.xlsx)
          </button>
          <button
            type="button"
            className="flex h-[40px] w-full shrink-0 items-center rounded-[8px] bg-white px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313] hover:bg-[#e3e3e3]"
            role="menuitem"
            onClick={() => selectFormat('pdf')}
          >
            PDF (.pdf)
          </button>
        </div>,
        document.body,
      ) : null}
      <InspectionExportReportModal
        open={Boolean(modalFormat)}
        format={modalFormat}
        initialInspectionState={normalizedPath() === '/inspections/history' ? 'closed' : 'all'}
        onClose={() => setModalFormat(null)}
      />
    </>
  );
}
