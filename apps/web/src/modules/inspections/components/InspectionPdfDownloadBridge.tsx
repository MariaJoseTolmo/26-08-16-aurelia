import { useEffect, type ReactElement } from 'react';
import { downloadInspectionPdf } from '../../../shared/services/inspection-reports.service';

function setDownloadButtonPending(button: HTMLButtonElement | null) {
  if (!button) return () => undefined;

  const originalHtml = button.innerHTML;
  const originalDisabled = button.disabled;
  const originalAriaBusy = button.getAttribute('aria-busy');
  const spinner = document.createElement('span');
  spinner.setAttribute('aria-hidden', 'true');
  Object.assign(spinner.style, {
    width: '14px',
    height: '14px',
    flex: '0 0 14px',
    border: '2px solid #d1d1d1',
    borderTopColor: '#333333',
    borderRadius: '9999px',
  });
  const animation = spinner.animate(
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 750, iterations: Infinity },
  );
  const label = document.createElement('span');
  label.textContent = 'Generando PDF…';

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.replaceChildren(spinner, label);

  return () => {
    animation.cancel();
    button.innerHTML = originalHtml;
    button.disabled = originalDisabled;
    if (originalAriaBusy === null) button.removeAttribute('aria-busy');
    else button.setAttribute('aria-busy', originalAriaBusy);
  };
}

export function InspectionPdfDownloadBridge(): ReactElement | null {
  useEffect(() => {
    const originalOpen = window.open;
    const patchedOpen = ((url?: string | URL, target?: string, features?: string) => {
      const href = url ? String(url) : '';
      const match = href.match(/\/api\/inspections\/([^/]+)\/export\/pdf(?:\?.*)?$/);
      if (match?.[1]) {
        const activeButton = document.activeElement instanceof HTMLButtonElement
          ? document.activeElement
          : null;
        const restoreButton = setDownloadButtonPending(activeButton);
        void downloadInspectionPdf(decodeURIComponent(match[1]))
          .catch(() => {
            window.alert('No fue posible generar el PDF de la inspección. Intenta nuevamente.');
          })
          .finally(restoreButton);
        return null;
      }
      return originalOpen.call(window, url, target, features);
    }) as typeof window.open;

    window.open = patchedOpen;
    return () => {
      if (window.open === patchedOpen) window.open = originalOpen;
    };
  }, []);

  return null;
}
