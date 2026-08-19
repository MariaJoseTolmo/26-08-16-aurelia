import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { downloadInspectionPdf } from '../../../shared/services/inspection-reports.service';
import { getInspectionManagementTable } from '../../../shared/services/inspections.service';
import {
  announceInspectionManagementOverlay,
  nextInspectionManagementOverlaySourceId,
  subscribeToInspectionManagementOverlay,
} from './inspection-management-overlay';
import { subscribeInspectionDom } from './inspection-dom-subscription';

type MenuState = {
  top: number;
  left: number;
  width: number;
  source: HTMLElement;
  trigger: HTMLButtonElement | null;
};

function getDirectButtons(element: HTMLElement) {
  return Array.from(element.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
}

function normalizeInspectionNumber(value: string) {
  return value.replace(/\s+/g, ' ').trim().replace(/^#/, '');
}

function inspectionNumberFromMenu(menu: HTMLElement) {
  const firstCell = menu.closest('tr')?.querySelector('td');
  return normalizeInspectionNumber(firstCell?.textContent ?? '');
}

function findMenu() {
  const triggers = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="menu"][aria-expanded="true"]'));
  for (const trigger of triggers) {
    if (!trigger.closest('table')) continue;
    const candidate = trigger.nextElementSibling;
    if (!(candidate instanceof HTMLElement)) continue;
    if (candidate.closest('[data-inspection-actions-portal="true"]')) continue;
    if (candidate.parentElement !== trigger.parentElement) continue;
    return candidate;
  }
  return undefined;
}

function getTrigger(menu: HTMLElement) {
  const previous = menu.previousElementSibling;
  if (previous instanceof HTMLButtonElement && previous.matches('button[aria-haspopup="menu"]')) return previous;
  const trigger = menu.parentElement?.querySelector('button[aria-haspopup="menu"]');
  return trigger instanceof HTMLButtonElement ? trigger : null;
}

function buildMenuState(menu: HTMLElement): MenuState | null {
  const trigger = getTrigger(menu);
  if (!trigger) return null;
  const rect = trigger.getBoundingClientRect();
  const width = 220;
  const height = 96;
  const margin = 8;
  const left = Math.min(Math.max(margin, rect.right - width), window.innerWidth - width - margin);
  const below = rect.bottom + 6;
  const top = below + height > window.innerHeight - margin
    ? Math.max(margin, rect.top - height - 6)
    : below;
  return { top, left, width, source: menu, trigger };
}

export function InspectionTableActionMenuBridge(): ReactElement | null {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const hiddenSourceRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<MenuState | null>(null);
  const sourceIdRef = useRef(nextInspectionManagementOverlaySourceId('action'));
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  function updateMenu(next: MenuState | null) {
    menuRef.current = next;
    setMenu(next);
  }

  useEffect(() => {
    function restoreHiddenSource() {
      if (!hiddenSourceRef.current) return;
      hiddenSourceRef.current.style.visibility = '';
      hiddenSourceRef.current.style.pointerEvents = '';
      hiddenSourceRef.current = null;
    }

    function syncMenu() {
      const source = findMenu();
      if (!source) {
        restoreHiddenSource();
        if (menuRef.current) updateMenu(null);
        return;
      }
      const next = buildMenuState(source);
      if (!next) {
        restoreHiddenSource();
        if (menuRef.current) updateMenu(null);
        return;
      }
      const isNewSource = hiddenSourceRef.current !== source;
      if (hiddenSourceRef.current && isNewSource) restoreHiddenSource();
      if (isNewSource) {
        announceInspectionManagementOverlay({ kind: 'action', owner: next.trigger ?? source, sourceId: sourceIdRef.current });
      }
      if (source.style.visibility !== 'hidden') source.style.visibility = 'hidden';
      if (source.style.pointerEvents !== 'none') source.style.pointerEvents = 'none';
      hiddenSourceRef.current = source;
      const current = menuRef.current;
      if (current?.source === source && current.top === next.top && current.left === next.left) return;
      updateMenu(next);
    }

    let frame: number | null = null;
    const scheduleMenuSync = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        syncMenu();
      });
    };

    const unsubscribeOverlay = subscribeToInspectionManagementOverlay((detail) => {
      const current = menuRef.current;
      if (!current || detail.sourceId === sourceIdRef.current) return;
      current.trigger?.click();
    });
    const unsubscribeDom = subscribeInspectionDom(scheduleMenuSync);
    window.addEventListener('resize', scheduleMenuSync);
    window.addEventListener('scroll', scheduleMenuSync, true);

    return () => {
      unsubscribeOverlay();
      unsubscribeDom();
      window.removeEventListener('resize', scheduleMenuSync);
      window.removeEventListener('scroll', scheduleMenuSync, true);
      if (frame !== null) window.cancelAnimationFrame(frame);
      restoreHiddenSource();
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const current = menuRef.current;
      if (!current || !(event.target instanceof Node)) return;
      if (portalRef.current?.contains(event.target) || current.trigger?.contains(event.target)) return;
      current.trigger?.click();
    }
    document.addEventListener('mousedown', handleOutsideClick, true);
    return () => document.removeEventListener('mousedown', handleOutsideClick, true);
  }, []);

  function activateSourceButton(index: number) {
    const current = menuRef.current;
    const button = current ? getDirectButtons(current.source)[index] : undefined;
    if (button instanceof HTMLButtonElement) button.click();
  }

  async function handleDownloadInspectionPdf() {
    const current = menuRef.current;
    if (!current || isDownloadingPdf) return;
    const inspectionNumber = inspectionNumberFromMenu(current.source);
    if (!inspectionNumber) {
      window.alert('No fue posible identificar la inspección seleccionada.');
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const response = await getInspectionManagementTable({ page: 1, pageSize: 10, id: inspectionNumber });
      const selected = response.rows.find((row) => normalizeInspectionNumber(row.inspectionNumber) === inspectionNumber) ?? response.rows[0];
      if (!selected) throw new Error('Inspection not found');
      await downloadInspectionPdf(selected.inspectionId);
      current.trigger?.click();
    } catch {
      window.alert('No fue posible generar el PDF de la inspección. Intenta nuevamente.');
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  if (!menu) return null;
  return createPortal(
    <div ref={portalRef} data-inspection-actions-portal="true" className="fixed z-[11000] flex flex-col items-start rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]" style={{ top: `${menu.top}px`, left: `${menu.left}px`, width: `${menu.width}px` }} role="menu">
      <button type="button" onClick={() => activateSourceButton(0)} className="flex h-[40px] w-full items-center rounded-[8px] bg-white px-[8px] py-[12px] text-left text-[14px] text-[#131313] transition-colors hover:bg-[#e3e3e3]" role="menuitem">Ver detalles</button>
      <button type="button" disabled={isDownloadingPdf} onClick={handleDownloadInspectionPdf} className="flex h-[40px] w-full items-center rounded-[8px] bg-white px-[8px] py-[12px] text-left text-[14px] text-[#131313] transition-colors hover:bg-[#e3e3e3] disabled:cursor-wait disabled:opacity-60" role="menuitem">{isDownloadingPdf ? 'Generando PDF…' : 'PDF (.pdf)'}</button>
    </div>,
    document.body,
  );
}
