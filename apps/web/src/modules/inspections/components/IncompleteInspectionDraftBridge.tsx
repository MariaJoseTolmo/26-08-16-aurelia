import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InspectionType } from '@aurelia/contracts';
import { clearNewInspectionDraftSnapshot, loadNewInspectionDraftSnapshot } from '../new-inspection/state/newInspectionDraft.store';
import { subscribeInspectionDom } from './inspection-dom-subscription';

type DraftSnapshot = NonNullable<ReturnType<typeof loadNewInspectionDraftSnapshot>>;
type DraftProgress = { step: number; percent: number };

const hostId = 'aurelia-incomplete-inspection-draft-host';
const resumeDraftEventName = 'aurelia:resume-new-inspection-draft';
const resumeDraftStorageKey = 'aurelia:resume-new-inspection-draft';
const draftChangedEventName = 'aurelia:new-inspection-drafts-changed';

function isInspectionsRoute() {
  return window.location.pathname.startsWith('/inspections');
}

function isInspectionModalOpen() {
  return document.querySelector('.new-inspection-modal-panel') !== null;
}

function findPageContent() {
  return Array.from(document.querySelectorAll('div')).find((element) => {
    const className = element.className.toString();
    return className.includes('bg-[#f7f7f7]') && className.includes('h-[calc(100vh-56px)]') && className.includes('flex-col');
  }) as HTMLElement | undefined;
}

function findOrCreateHost() {
  if (!isInspectionsRoute()) return null;
  const pageContent = findPageContent();
  if (!pageContent) return null;
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    host.className = 'w-full pt-[16px]';
  }
  const filtersBar = pageContent.children[1] ?? null;
  if (host.parentElement !== pageContent) pageContent.insertBefore(host, filtersBar);
  else if (filtersBar && host.nextElementSibling !== filtersBar) pageContent.insertBefore(host, filtersBar);
  return host;
}

function removeHost() {
  document.getElementById(hostId)?.remove();
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Guardado localmente';
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / dayMs);
  const time = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (diffDays === 0) return `Hoy ${time}`;
  if (diffDays === 1) return `Ayer ${time}`;
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function draftKind(snapshot: DraftSnapshot) {
  if (snapshot.draft.inspectionType === InspectionType.ENVIRONMENTAL) return 'Hallazgo';
  return snapshot.draft.inspectionTypeLabel || 'Checklist';
}

function draftArea(snapshot: DraftSnapshot) {
  return snapshot.draft.areaName || 'Área pendiente';
}

function draftSubtitle(snapshot: DraftSnapshot) {
  return [snapshot.draft.areaName, snapshot.draft.sectorName, snapshot.draft.findingCompanyName || snapshot.draft.inspectorCompanyName, formatSavedAt(snapshot.savedAt)].filter(Boolean).join(' · ');
}

function snapshotKey(snapshot: DraftSnapshot | null) {
  if (!snapshot) return 'empty';
  return [
    snapshot.savedAt,
    snapshot.draft.areaId,
    snapshot.draft.sectorId,
    snapshot.draft.inspectionType,
    snapshot.draft.findingTypeId,
    snapshot.draft.templateId,
    snapshot.draft.locationCaptured ? '1' : '0',
    snapshot.draft.findingObservations.length,
    snapshot.draft.findingCompanyId,
    snapshot.draft.findingResponsibleIds.join(','),
  ].join('|');
}

function resolveDraftProgress(snapshot: DraftSnapshot): DraftProgress {
  const draft = snapshot.draft;
  const savedObservations = draft.findingObservations.filter((item) => item.saved);
  const currentObservation = draft.findingObservations.find((item) => !item.saved) ?? draft.findingObservations[draft.findingObservations.length - 1] ?? null;
  if (!draft.areaId || !draft.sectorId) return { step: 1, percent: 14 };
  if (!draft.locationCaptured || (!draft.findingTypeId && !draft.templateId)) return { step: 2, percent: 28 };
  if (!currentObservation && Object.keys(draft.answersByItemId).length === 0) return { step: 2, percent: 28 };
  if (currentObservation && (!currentObservation.detectedCondition || !currentObservation.evidence)) return { step: 2, percent: 28 };
  if (currentObservation && (!currentObservation.correctiveAction || !currentObservation.severityId || !currentObservation.saved)) return { step: 3, percent: 42 };
  if (savedObservations.length > 0 && !draft.findingCompanyId) return { step: 4, percent: 57 };
  if (draft.findingCompanyId && draft.findingResponsibleIds.length === 0) return { step: 5, percent: 71 };
  return { step: 5, percent: 86 };
}

function clickNewInspectionButton() {
  const button = Array.from(document.querySelectorAll('button')).find((element) => element.textContent?.includes('Nueva inspección')) as HTMLButtonElement | undefined;
  button?.click();
}

function DraftIcon() {
  return <svg className="h-[18px] w-[22.5px] shrink-0" fill="none" viewBox="0 0 23 18" aria-hidden><path d="M3.1 1.5h9.2l3.1 3.1v11.9H3.1z" fill="#463100" /><path d="M12.3 1.5v3.1h3.1" stroke="#FFEAB8" strokeWidth="1.2" strokeLinejoin="round" /><path d="M14.2 11.8 18.4 7.6a1.4 1.4 0 0 1 2 2l-4.2 4.2-2.6.6z" fill="#463100" stroke="#FFEAB8" strokeWidth="0.8" /></svg>;
}

function ChevronRightIcon() {
  return <svg className="h-[13px] w-[16.25px] shrink-0" fill="none" viewBox="0 0 17 13" aria-hidden><path d="M5.8 1.4 11.6 6.5 5.8 11.6" stroke="#ACACAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IncompleteDraftBanner({ snapshot, onResume, onDiscard }: { snapshot: DraftSnapshot; onResume: () => void; onDiscard: () => void }) {
  const progress = resolveDraftProgress(snapshot);
  return (
    <div className="relative w-full overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex min-h-[92px] items-stretch">
        <div className="flex w-[219px] shrink-0 flex-col justify-center p-[14px]"><p className="whitespace-nowrap text-[15px] font-bold text-[#131313]">Formularios inconclusos</p><p className="mt-[2px] text-[12px] text-[#646464]">Continúa donde lo dejaste · guardados localmente</p></div>
        <button className="relative flex min-w-0 flex-1 items-center gap-[12px] border-l-[1.5px] border-[#e3e3e3] bg-white py-[14px] pl-[15.5px] pr-[14px] text-left" type="button" onClick={onResume}>
          <div className="flex size-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#ffeab8]"><DraftIcon /></div>
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold text-[#131313]">{draftKind(snapshot)} · {draftArea(snapshot)}</p><p className="mt-[3px] truncate text-[11px] text-[#646464]">{draftSubtitle(snapshot)}</p><div className="mt-[8px] flex items-center gap-[8px]"><div className="h-[4px] min-w-[120px] flex-1 overflow-hidden rounded-[2px] bg-[#e3e3e3]"><div className="h-[4px] rounded-[2px] bg-[#c8a064]" style={{ width: `${progress.percent}%` }} /></div><span className="w-[30px] text-[10px] font-bold text-[#8e6e3e]">{progress.percent}%</span></div></div>
          <ChevronRightIcon /><span className="absolute right-[46px] top-[11.5px] rounded-[6px] border border-[#e8c86a] bg-[#ffeab8] px-[7px] py-[2px] text-[10px] font-bold text-[#463100]">Paso {progress.step}/5</span>
        </button>
      </div>
      <div className="absolute left-[210px] top-[11.4px] size-[16px] rounded-[8px] bg-[#c4365a]" />
      <button className="absolute right-[12px] top-[12px] hidden rounded-[6px] border border-[#e3e3e3] bg-white px-[8px] py-[3px] text-[10px] font-semibold text-[#646464]" type="button" onClick={onDiscard}>Descartar</button>
    </div>
  );
}

export function IncompleteInspectionDraftBridge(): JSX.Element | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [snapshot, setSnapshot] = useState<DraftSnapshot | null>(null);
  const snapshotRef = useRef<DraftSnapshot | null>(null);

  useEffect(() => {
    const sync = () => {
      const stored = isInspectionsRoute() ? loadNewInspectionDraftSnapshot() : null;
      const nextSnapshot = stored ?? (isInspectionModalOpen() ? snapshotRef.current : null);
      const nextHost = nextSnapshot ? findOrCreateHost() : null;
      if (snapshotKey(snapshotRef.current) !== snapshotKey(nextSnapshot)) {
        snapshotRef.current = nextSnapshot;
        setSnapshot(nextSnapshot);
      }
      setHost((previous) => previous === nextHost ? previous : nextHost);
      if (!nextSnapshot) removeHost();
    };

    const unsubscribeDom = subscribeInspectionDom(sync);
    window.addEventListener(draftChangedEventName, sync);
    window.addEventListener('storage', sync);
    return () => {
      unsubscribeDom();
      window.removeEventListener(draftChangedEventName, sync);
      window.removeEventListener('storage', sync);
      removeHost();
    };
  }, []);

  function resumeDraft() {
    window.sessionStorage.setItem(resumeDraftStorageKey, '1');
    window.dispatchEvent(new Event(resumeDraftEventName));
    window.setTimeout(clickNewInspectionButton, 0);
  }

  function discardDraft() {
    clearNewInspectionDraftSnapshot();
    window.sessionStorage.removeItem(resumeDraftStorageKey);
    snapshotRef.current = null;
    setSnapshot(null);
    removeHost();
  }

  if (!host || !snapshot) return null;
  return createPortal(<IncompleteDraftBanner snapshot={snapshot} onResume={resumeDraft} onDiscard={discardDraft} />, host);
}
