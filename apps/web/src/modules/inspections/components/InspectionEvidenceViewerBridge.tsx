import { useEffect, useMemo, useState } from 'react';
import { subscribeInspectionDom } from './inspection-dom-subscription';

type EvidenceViewerItem = { src: string; title: string };

function normalizeFileContentUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const [withoutHash = ''] = trimmed.split('#');
  const [clean = ''] = withoutHash.split('?');
  if (/\/api\/files\/[0-9a-f-]{36}\/content$/i.test(clean)) return trimmed;
  const match = clean.match(/^(.*\/api\/files\/[0-9a-f-]{36})\/?$/i);
  return match ? `${match[1]}/content` : trimmed;
}

function isEvidenceImage(image: HTMLImageElement) {
  const src = image.getAttribute('src') ?? '';
  return /\/api\/files\/[0-9a-f-]{36}\/content/i.test(normalizeFileContentUrl(src)) || src.startsWith('blob:');
}

function normalizeEvidenceImages(scope: Document | Element = document) {
  const images = Array.from(scope.querySelectorAll<HTMLImageElement>('section[role="dialog"] img'));
  images.forEach((image) => {
    const current = image.getAttribute('src') ?? '';
    const normalized = normalizeFileContentUrl(current);
    if (normalized !== current) image.setAttribute('src', normalized);
    if (!isEvidenceImage(image)) return;
    if (image.style.cursor !== 'pointer') image.style.cursor = 'pointer';
    image.dataset.evidenceViewerImage = 'true';
  });
}

function titleFromImage(image: HTMLImageElement, index: number) {
  return image.getAttribute('alt')?.trim() || image.getAttribute('data-title')?.trim() || `imagen-${index + 1}.jpg`;
}

function hasObservationContext(element: HTMLElement) {
  const text = element.textContent ?? '';
  return /Obs\.\s*\d+/i.test(text) && (text.includes('SLA calculado') || text.includes('SLA cerrado') || text.includes('Fecha de cierre') || text.includes('Ejecutar observación') || text.includes('Aprobar cierre') || text.includes('Rechazar'));
}

function findEvidenceGalleryScope(clickedImage: HTMLImageElement): Document | Element {
  const dialog = clickedImage.closest('section[role="dialog"]') ?? document;
  let current: HTMLElement | null = clickedImage.parentElement;
  while (current && current !== dialog) {
    const evidenceImages = Array.from(current.querySelectorAll('img')).filter((image): image is HTMLImageElement => image instanceof HTMLImageElement && isEvidenceImage(image));
    if (evidenceImages.length > 0 && hasObservationContext(current)) return current;
    current = current.parentElement;
  }
  return dialog;
}

function buildGallery(clickedImage: HTMLImageElement) {
  const scope = findEvidenceGalleryScope(clickedImage);
  const rawImages = Array.from(scope.querySelectorAll('img')).filter((image): image is HTMLImageElement => image instanceof HTMLImageElement && isEvidenceImage(image));
  const unique = new Map<string, EvidenceViewerItem>();
  rawImages.forEach((image, index) => {
    const src = normalizeFileContentUrl(image.currentSrc || image.src || image.getAttribute('src') || '');
    if (!src) return;
    const title = titleFromImage(image, index);
    const key = `${src}|${title}`;
    if (!unique.has(key)) unique.set(key, { src, title });
  });
  const items = Array.from(unique.values());
  const clickedSrc = normalizeFileContentUrl(clickedImage.currentSrc || clickedImage.src || clickedImage.getAttribute('src') || '');
  return { items, index: Math.max(0, items.findIndex((item) => item.src === clickedSrc)) };
}

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.6 1.6 14.4 14.4M14.4 1.6 1.6 14.4" stroke="#131313" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={direction === 'right' ? 'rotate-180' : ''}><path d="M10 3 5 8l5 5" stroke="#333333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function InspectionEvidenceViewerBridge() {
  const [items, setItems] = useState<EvidenceViewerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex] ?? null;
  const total = items.length;
  const canNavigate = total > 1;

  useEffect(() => subscribeInspectionDom(normalizeEvidenceImages), []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof HTMLImageElement)) return;
      if (event.target.closest('[data-evidence-viewer-dialog="true"]') || !event.target.closest('section[role="dialog"]')) return;
      normalizeEvidenceImages();
      if (!isEvidenceImage(event.target)) return;
      const gallery = buildGallery(event.target);
      if (!gallery.items.length) return;
      event.preventDefault();
      event.stopPropagation();
      setItems(gallery.items);
      setActiveIndex(gallery.index);
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    if (!activeItem) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setItems([]);
        setActiveIndex(0);
      } else if (event.key === 'ArrowLeft' && canNavigate) {
        setActiveIndex((current) => (current - 1 + total) % total);
      } else if (event.key === 'ArrowRight' && canNavigate) {
        setActiveIndex((current) => (current + 1) % total);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, canNavigate, total]);

  const displayTitle = useMemo(() => activeItem?.title || 'imagen.jpg', [activeItem]);
  if (!activeItem) return null;
  const close = () => { setItems([]); setActiveIndex(0); };
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-[rgba(19,19,19,0.75)] px-[32px] py-[16px]" role="presentation" onClick={close}>
      <div className="flex h-[min(704px,calc(100vh-32px))] w-[min(1132px,calc(100vw-64px))] flex-col overflow-hidden rounded-[24px] border border-[#d1d1d1] bg-white" role="dialog" aria-modal="true" aria-label="Visor de evidencia" data-evidence-viewer-dialog="true" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-[#e3e3e3] px-[15px]"><p className="truncate pr-[24px] text-[18px] font-bold text-[#2a2a2a]">{displayTitle}</p><button type="button" className="flex size-[32px] items-center justify-center" onClick={close} aria-label="Cerrar visor"><CloseIcon /></button></div>
        <div className="mx-[15px] mt-[15px] flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black"><img src={activeItem.src} alt={displayTitle} className="h-full max-h-full w-full max-w-full object-contain" /></div>
        <div className="mx-[15px] mb-[5px] flex h-[48px] shrink-0 items-center justify-between border-y border-[#d1d1d1] px-[16px]"><button type="button" className="flex size-[32px] items-center justify-center rounded-[8px] disabled:opacity-35" onClick={() => canNavigate && setActiveIndex((current) => (current - 1 + total) % total)} disabled={!canNavigate} aria-label="Imagen anterior"><ArrowIcon direction="left" /></button><p className="text-[14px] text-[#131313]">{activeIndex + 1}/{total}</p><button type="button" className="flex size-[32px] items-center justify-center rounded-[8px] disabled:opacity-35" onClick={() => canNavigate && setActiveIndex((current) => (current + 1) % total)} disabled={!canNavigate} aria-label="Imagen siguiente"><ArrowIcon direction="right" /></button></div>
      </div>
    </div>
  );
}
