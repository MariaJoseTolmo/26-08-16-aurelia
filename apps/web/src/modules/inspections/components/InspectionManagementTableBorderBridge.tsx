import { useEffect, type ReactElement } from 'react';
import { subscribeInspectionDom } from './inspection-dom-subscription';

const styleElementId = 'aurelia-inspection-management-table-borders';
const shellAttribute = 'data-aurelia-inspection-management-table-shell';
const scrollAttribute = 'data-aurelia-inspection-management-table-scroll';
const tableAttribute = 'data-aurelia-inspection-management-table';
const footerAttribute = 'data-aurelia-inspection-management-table-footer';

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function removeDecorations() {
  document.querySelectorAll(`[${shellAttribute}]`).forEach((element) => element.removeAttribute(shellAttribute));
  document.querySelectorAll(`[${scrollAttribute}]`).forEach((element) => element.removeAttribute(scrollAttribute));
  document.querySelectorAll(`[${tableAttribute}]`).forEach((element) => element.removeAttribute(tableAttribute));
  document.querySelectorAll(`[${footerAttribute}]`).forEach((element) => element.removeAttribute(footerAttribute));
}

function decorateManagementTable() {
  if (normalizedPath() !== '/inspections') {
    removeDecorations();
    return;
  }
  const table = document.querySelector<HTMLTableElement>('table.table-fixed');
  const scrollContainer = table?.parentElement;
  const shell = scrollContainer?.parentElement;
  const footer = scrollContainer?.nextElementSibling;
  if (!table || !scrollContainer || !shell || !(footer instanceof HTMLElement)) return;
  if (!shell.hasAttribute(shellAttribute)) shell.setAttribute(shellAttribute, 'true');
  if (!scrollContainer.hasAttribute(scrollAttribute)) scrollContainer.setAttribute(scrollAttribute, 'true');
  if (!table.hasAttribute(tableAttribute)) table.setAttribute(tableAttribute, 'true');
  if (!footer.hasAttribute(footerAttribute)) footer.setAttribute(footerAttribute, 'true');
}

function ensureStyles() {
  if (document.getElementById(styleElementId)) return;
  const style = document.createElement('style');
  style.id = styleElementId;
  style.textContent = `
    [${shellAttribute}="true"] { box-sizing: border-box; border: 1px solid #e3e3e3 !important; border-radius: 8px !important; padding: 1px !important; overflow: visible !important; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.05) !important; }
    [${scrollAttribute}="true"] { border-radius: 7px 7px 0 0; }
    [${tableAttribute}="true"] { border-collapse: separate !important; border-spacing: 0 !important; }
    [${tableAttribute}="true"] thead tr:first-child th:first-child { border-top-left-radius: 6px; }
    [${tableAttribute}="true"] thead tr:first-child th:last-child { border-top-right-radius: 6px; }
    [${tableAttribute}="true"] tr > :last-child { border-right: 0 !important; }
    [${footerAttribute}="true"] { border-radius: 0 0 6px 6px; }
  `;
  document.head.appendChild(style);
}

export function InspectionManagementTableBorderBridge(): ReactElement | null {
  useEffect(() => {
    ensureStyles();
    const unsubscribeDom = subscribeInspectionDom(decorateManagementTable);
    return () => {
      unsubscribeDom();
      removeDecorations();
      document.getElementById(styleElementId)?.remove();
    };
  }, []);
  return null;
}
