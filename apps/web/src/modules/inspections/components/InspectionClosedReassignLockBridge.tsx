import { useEffect } from 'react';
import { subscribeInspectionDom } from './inspection-dom-subscription';

type FindingCounts = { executed: number; open: number; closed: number; rejected: number };

function countFrom(text: string, label: string) {
  const match = text.match(new RegExp(`(\\d+)\\s+${label}`));
  return match ? Number(match[1]) : 0;
}

function readCounts(dialog: HTMLElement): FindingCounts {
  const text = dialog.innerText;
  return {
    executed: countFrom(text, 'Ejecutada'),
    open: countFrom(text, 'Abiertas'),
    closed: countFrom(text, 'Cerrada'),
    rejected: countFrom(text, 'Rechazada'),
  };
}

function isCompleted(dialog: HTMLElement) {
  const counts = readCounts(dialog);
  const total = counts.executed + counts.open + counts.closed + counts.rejected;
  return total > 0 && counts.closed === total && counts.executed === 0 && counts.open === 0 && counts.rejected === 0;
}

function setLocked(button: HTMLButtonElement, locked: boolean) {
  if (locked) {
    if (button.dataset.aureliaClosedLock === 'true') return;
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.dataset.aureliaClosedLock = 'true';
    button.classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }
  if (button.dataset.aureliaClosedLock !== 'true') return;
  button.disabled = false;
  button.removeAttribute('aria-disabled');
  delete button.dataset.aureliaClosedLock;
  button.classList.remove('opacity-50', 'cursor-not-allowed');
}

function patchReassignButtons() {
  const dialogs = Array.from(document.querySelectorAll('section[role="dialog"]'))
    .filter((node): node is HTMLElement => node instanceof HTMLElement && node.innerText.includes('Progreso de observaciones'));
  dialogs.forEach((dialog) => {
    const locked = isCompleted(dialog);
    const buttons = Array.from(dialog.querySelectorAll('button'))
      .filter((node): node is HTMLButtonElement => node instanceof HTMLButtonElement && node.textContent?.includes('Reasignar a otro compañero'));
    buttons.forEach((button) => setLocked(button, locked));
  });
}

export function InspectionClosedReassignLockBridge() {
  useEffect(() => subscribeInspectionDom(patchReassignButtons), []);
  return null;
}
