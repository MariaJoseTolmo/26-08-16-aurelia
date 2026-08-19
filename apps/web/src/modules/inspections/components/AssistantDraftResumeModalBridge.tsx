import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { InspectionType } from '@aurelia/contracts';
import { AssistantChatStep } from '../new-inspection/steps/AssistantChatStepV4';
import { useSubmitNewInspection } from '../new-inspection/hooks/useSubmitNewInspection';
import { clearNewInspectionDraftSnapshot, loadNewInspectionDraftSnapshot, type NewInspectionDraft, useNewInspectionDraftStore } from '../new-inspection/state/newInspectionDraft.store';
import { openAssistantDraftEventName } from './IncompleteDraftResumeControllerBridge';

function ChatBackIcon() {
  return <svg width="23" height="19" viewBox="0 0 23 19" fill="none" aria-hidden><path d="M9.5 1.75 1.75 9.5l7.75 7.75M2.5 9.5h18.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChatAureliaIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2.5 13.7 8l5.8 1.8-5.8 1.8L12 17.5l-1.7-5.9-5.8-1.8L10.3 8 12 2.5Z" fill="currentColor" /><path d="M18 15.5 18.7 18l2.3.7-2.3.7-.7 2.6-.7-2.6-2.3-.7 2.3-.7.7-2.5Z" fill="currentColor" /></svg>;
}

function ChatMoreIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden><circle cx="9" cy="4" r="1.5" fill="currentColor" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /></svg>;
}

function nowLabel() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function displayDate(value: string) {
  return value ? value.replaceAll('-', '/') : '';
}

function BotMark() {
  return <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon /></div>;
}

function BotBubble({ children }: { children: ReactNode }) {
  return <div className="mb-[10px] flex w-full items-end gap-[7px]"><BotMark /><div className="max-w-[286px] rounded-[16px] border border-[#E3E3E3] bg-white px-[13px] py-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"><div className="text-[15px] leading-[22px] text-[#131313] [&_strong]:font-bold [&_strong]:text-[#131313]">{children}</div><p className="mt-[7px] text-[12px] leading-none text-[#ACACAC]">{nowLabel()}</p></div></div>;
}

function UserBubble({ children }: { children: ReactNode }) {
  return <div className="mb-[10px] ml-auto max-w-[78%] rounded-[16px] bg-[#002659] px-[13px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"><div className="text-[13px] font-semibold leading-[18px] text-white">{children}</div><p className="mt-[6px] text-[11px] leading-none text-[rgba(255,255,255,0.55)]">{nowLabel()}</p></div>;
}

function ReconstructedTranscript({ draft }: { draft: NewInspectionDraft }) {
  const currentObservation = draft.findingObservations.find((item) => !item.saved) ?? draft.findingObservations[draft.findingObservations.length - 1] ?? null;
  return (
    <div data-aurelia-reconstructed-chat="true">
      <BotBubble>¡Hola, <strong>{draft.inspectorName}</strong>! 👋 Soy AurelIA. Voy a ayudarte a registrar esta inspección de forma rápida. ¿En qué <strong>área</strong> estás hoy?</BotBubble>
      {draft.areaName ? <UserBubble>{draft.areaName}</UserBubble> : null}
      {draft.areaName ? <BotBubble>Perfecto, <strong>{draft.areaName}</strong> ✓. Ahora el sector — ¿en cuál específicamente?</BotBubble> : null}
      {draft.sectorName ? <UserBubble>{draft.sectorName}</UserBubble> : null}
      {draft.areaName && draft.sectorName && draft.inspectionTypeSelected ? <BotBubble><strong>{draft.areaName} · {draft.sectorName} ✓</strong>. ¿Qué tipo de inspección es?</BotBubble> : null}
      {draft.inspectionTypeSelected ? <UserBubble>{draft.inspectionTypeLabel || 'Hallazgo'}</UserBubble> : null}
      {draft.inspectionTypeSelected && draft.inspectionDateSelected ? <BotBubble>Selecciona la <strong>fecha de inspección</strong>.</BotBubble> : null}
      {draft.inspectionDateSelected ? <UserBubble>{displayDate(draft.inspectionDate)}</UserBubble> : null}
      {draft.inspectionDateSelected && draft.locationCaptured ? <BotBubble>Capturemos la <strong>ubicación obligatoria</strong>.</BotBubble> : null}
      {draft.locationCaptured ? <UserBubble>Ubicación capturada · {draft.locationAccuracyLabel}</UserBubble> : null}
      {draft.locationCaptured && draft.findingTypeLabel ? <BotBubble>Selecciona el <strong>tipo de hallazgo</strong>.</BotBubble> : null}
      {draft.findingTypeLabel ? <UserBubble>{draft.findingTypeLabel}</UserBubble> : null}
      {draft.findingTypeLabel && currentObservation?.detectedCondition ? <BotBubble>Cuéntame la condición subestándar que detectaste en <strong>{draft.areaName} · {draft.sectorName}</strong>.</BotBubble> : null}
      {currentObservation?.detectedCondition ? <UserBubble>{currentObservation.detectedCondition}</UserBubble> : null}
      {currentObservation?.evidence ? <BotBubble>Entendido. Adjunta una foto del hallazgo:</BotBubble> : null}
      {currentObservation?.evidence ? <BotBubble>Foto recibida ✓. Analicé el historial de <strong>{draft.areaName}</strong> y te propongo:</BotBubble> : null}
      {currentObservation?.correctiveAction ? <UserBubble>{currentObservation.correctiveActionSource === 'ai' ? '✓ Medida aceptada' : currentObservation.correctiveAction}</UserBubble> : null}
      {currentObservation?.severityLabel ? <BotBubble>Definamos la criticidad del hallazgo.</BotBubble> : null}
      {currentObservation?.severityLabel ? <UserBubble>{currentObservation.severityLabel}</UserBubble> : null}
      {currentObservation?.saved ? <BotBubble>Llevas <strong>{draft.findingObservations.filter((item) => item.saved).length} observación</strong>. Revisa antes de continuar.</BotBubble> : null}
      {draft.findingCompanyName ? <UserBubble>✓ {draft.findingCompanyName} confirmada</UserBubble> : null}
    </div>
  );
}

function findChatScroller() {
  const panel = document.querySelector('.new-inspection-modal-panel');
  return Array.from(panel?.querySelectorAll('div') ?? []).find((node) => {
    const className = node.className.toString();
    return className.includes('flex-1') && className.includes('overflow-y-auto') && className.includes('bg-[#F4F6F9]');
  }) as HTMLElement | undefined;
}

function TranscriptPortal({ draft }: { draft: NewInspectionDraft }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    function syncHost() {
      const scroller = findChatScroller();
      if (!scroller) return;
      let nextHost = scroller.querySelector('[data-aurelia-transcript-host="true"]') as HTMLElement | null;
      if (!nextHost) {
        nextHost = document.createElement('div');
        nextHost.dataset.aureliaTranscriptHost = 'true';
        scroller.insertBefore(nextHost, scroller.firstChild);
      }
      setHost(nextHost);
    }
    syncHost();
    const timer = window.setInterval(syncHost, 150);
    return () => window.clearInterval(timer);
  }, []);

  if (!host) return null;
  return createPortal(<ReconstructedTranscript draft={draft} />, host);
}

function TypeResumeStep({ onBack, onCancel, onSelect }: { onBack: () => void; onCancel: () => void; onSelect: (type: InspectionType, label: string) => void }) {
  const draft = useNewInspectionDraftStore();
  return (
    <>
      <div className="bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="flex h-[56px] items-center justify-between gap-[8px] px-[8px]">
          <button type="button" onClick={onBack} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatBackIcon /></button>
          <div className="flex flex-1 items-center gap-[8px]"><div className="relative h-[38px] w-[38px]"><div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon /></div><div className="absolute bottom-[2px] right-[1px] h-[10px] w-[10px] rounded-full border-[2px] border-[#002659] bg-[#00B398]" /></div><div><p className="text-[14px] font-bold leading-[17px] text-white">AurelIA</p><div className="mt-[1px] flex items-center gap-[4px]"><span className="h-[6px] w-[6px] rounded-full bg-[#00B398]" /><p className="text-[12px] leading-[14px] text-[rgba(255,255,255,0.62)]">Activo</p></div></div></div>
          <button type="button" onClick={onCancel} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatMoreIcon /></button>
        </div>
        <div className="px-[16px] pb-[7px]"><div className="mb-[5px] flex gap-[3px]">{Array.from({ length: 6 }).map((_, index) => <div key={index} className={`h-[3px] flex-1 rounded ${index === 0 ? 'bg-[rgba(200,160,100,0.75)]' : 'bg-[rgba(255,255,255,0.22)]'}`} />)}</div><div className="flex h-[17px] items-center justify-between"><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">Paso 1 · Identificación</p><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">14%</p></div></div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#F4F6F9] px-[12px] pb-[16px] pt-[12px]">
        <ReconstructedTranscript draft={draft} />
        <div className="mb-[10px] flex w-full items-end gap-[7px]"><BotMark /><div className="max-w-[286px] rounded-[16px] border border-[#E3E3E3] bg-white px-[13px] py-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"><p className="text-[15px] leading-[22px] text-[#131313]"><strong>{draft.areaName} · {draft.sectorName} ✓</strong>. ¿Qué tipo de inspección es?</p><p className="mt-[7px] text-[12px] leading-none text-[#ACACAC]">Retomado</p></div></div>
        <div className="mb-[10px] ml-[33px] flex flex-col gap-[6px]">
          <button type="button" onClick={() => onSelect(InspectionType.ENVIRONMENTAL, 'Hallazgo')} className="flex min-h-[34px] items-center justify-center gap-[8px] rounded-full border-[1.5px] border-[#D1D1D1] bg-white px-[13.5px] py-[6px] text-[13px] font-semibold leading-[16px] text-[#0d3862]">⌕ Hallazgo</button>
          <button type="button" onClick={() => onSelect(InspectionType.REGULATORY, 'Checklist normativo')} className="flex min-h-[34px] items-center justify-center gap-[8px] rounded-full border-[1.5px] border-[#D1D1D1] bg-white px-[13.5px] py-[6px] text-[13px] font-semibold leading-[16px] text-[#0d3862]">▣ Checklist normativo</button>
        </div>
      </div>
      <div className="border-t border-[#E3E3E3] bg-white px-[12px] pb-[8px] pt-[9px]"><div className="flex w-full gap-[8px]"><input disabled placeholder="O escribe aquí…" className="h-[41px] flex-1 rounded-full border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[15px] text-[15px] outline-none placeholder:text-[#ACACAC] disabled:text-[#ACACAC]" /><button type="button" disabled className="flex h-[38px] min-w-[38px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39] opacity-50">➤</button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>
    </>
  );
}

export function AssistantDraftResumeModalBridge() {
  const [open, setOpen] = useState(false);
  const [typePending, setTypePending] = useState(false);
  const hydrateDraft = useNewInspectionDraftStore((state) => state.hydrate);
  const resetDraft = useNewInspectionDraftStore((state) => state.reset);
  const setFlowMode = useNewInspectionDraftStore((state) => state.setFlowMode);
  const setInspectionType = useNewInspectionDraftStore((state) => state.setInspectionType);
  const draft = useNewInspectionDraftStore();
  const submitMutation = useSubmitNewInspection();

  useEffect(() => {
    function openDraft() {
      const snapshot = loadNewInspectionDraftSnapshot();
      if (!snapshot || snapshot.draft.flowMode !== 'assistant') return;
      hydrateDraft(snapshot.draft);
      setFlowMode('assistant');
      setTypePending(!snapshot.draft.inspectionTypeSelected);
      submitMutation.reset();
      setOpen(true);
    }
    window.addEventListener(openAssistantDraftEventName, openDraft);
    return () => window.removeEventListener(openAssistantDraftEventName, openDraft);
  }, [hydrateDraft, setFlowMode, submitMutation]);

  function closeAndDiscard() {
    clearNewInspectionDraftSnapshot();
    resetDraft();
    submitMutation.reset();
    setOpen(false);
  }

  function closeOnly() {
    setOpen(false);
  }

  function selectType(type: InspectionType, label: string) {
    setFlowMode('assistant');
    setInspectionType(type, label);
    setTypePending(false);
  }

  function saveInspection() {
    submitMutation.mutate(draft, {
      onSuccess: () => {
        clearNewInspectionDraftSnapshot();
        resetDraft();
        setOpen(false);
      },
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <div className="new-inspection-modal-panel relative flex h-[calc(100vh-32px)] max-h-[920px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          {typePending ? <TypeResumeStep onBack={closeOnly} onCancel={closeAndDiscard} onSelect={selectType} /> : <><AssistantChatStep onBack={closeOnly} onSave={saveInspection} onCancelInspection={closeAndDiscard} saving={submitMutation.isPending} errorMessage={submitMutation.error instanceof Error ? submitMutation.error.message : null} resumeFromDraft /><TranscriptPortal draft={draft} /></>}
        </div>
      </div>
    </div>
  );
}
