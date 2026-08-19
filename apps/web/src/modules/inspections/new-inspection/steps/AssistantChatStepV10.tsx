import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { InspectionType } from '@aurelia/contracts';
import { AssistantChatStep as AssistantChatStepV9 } from './AssistantChatStepV9';
import { useNewInspectionLocation } from '../hooks/useNewInspectionLocation';
import { ChatAureliaIcon, ChatBackIcon, ChatMoreIcon, ChatSendIcon } from '../icons/AssistantChatIcons';
import { saveNewInspectionDraftSnapshot, useNewInspectionDraftStore, type NewInspectionDraft } from '../state/newInspectionDraft.store';

type AssistantChatStepProps = ComponentProps<typeof AssistantChatStepV9>;

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function panel() {
  return document.querySelector('.new-inspection-modal-panel') as HTMLElement | null;
}

function suggestionCardFromButton(label: string, required: string) {
  const root = panel();
  if (!root) return null;
  const button = Array.from(root.querySelectorAll('button')).find((item) => cleanText(item.textContent) === label) as HTMLElement | undefined;
  const actions = button?.parentElement as HTMLElement | null | undefined;
  const card = actions?.parentElement as HTMLElement | null | undefined;
  if (!card || !cleanText(card.textContent).includes(required)) return null;
  return card;
}

function removeSuggestionClasses() {
  const root = panel();
  if (!root) return;
  root.querySelectorAll('.assistant-checklist-company-suggestion, .assistant-checklist-ai-suggestion').forEach((item) => {
    item.classList.remove('assistant-checklist-company-suggestion', 'assistant-checklist-ai-suggestion');
  });
}

function applySuggestionClasses() {
  removeSuggestionClasses();
  const companyCard = suggestionCardFromButton('Confirmar empresa', 'Empresa responsable sugerida');
  const measureCard = suggestionCardFromButton('Aceptar medida', 'Medida correctiva sugerida');
  if (companyCard) {
    companyCard.classList.add('assistant-checklist-company-suggestion');
    companyCard.style.width = '';
    companyCard.style.maxWidth = '';
  }
  if (measureCard) {
    measureCard.classList.add('assistant-checklist-ai-suggestion');
    measureCard.style.width = '';
    measureCard.style.maxWidth = '';
  }
}

function scheduleSuggestionPatch() {
  window.setTimeout(applySuggestionClasses, 0);
  window.setTimeout(applySuggestionClasses, 80);
  window.setTimeout(applySuggestionClasses, 180);
  window.setTimeout(applySuggestionClasses, 360);
}

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function todayLabel() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function displayDate(value: string) {
  return value ? value.replaceAll('-', '/') : '';
}

function BotMark() {
  return <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon className="h-[18px] w-[20px]" /></div>;
}

function BotBubble({ children }: { children: ReactNode }) {
  return <div className="mb-[10px] flex w-full items-end gap-[7px]"><BotMark /><div className="max-w-[286px] rounded-[16px] border border-[#E3E3E3] bg-white px-[13px] py-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"><div className="text-[15px] leading-[22px] text-[#131313] [&_strong]:font-bold [&_strong]:text-[#131313]">{children}</div><p className="mt-[7px] text-[12px] leading-none text-[#ACACAC]">{currentTime()}</p></div></div>;
}

function UserBubble({ children }: { children: ReactNode }) {
  return <div className="mb-[10px] ml-auto max-w-[78%] rounded-[16px] bg-[#002659] px-[13px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"><div className="text-[13px] font-semibold leading-[18px] text-white">{children}</div><p className="mt-[6px] text-[11px] leading-none text-[rgba(255,255,255,0.55)]">{currentTime()}</p></div>;
}

function findChatScroller() {
  const root = panel();
  return Array.from(root?.querySelectorAll('div') ?? []).find((node) => {
    const className = node.className.toString();
    return className.includes('flex-1') && className.includes('overflow-y-auto') && className.includes('bg-[#F4F6F9]');
  }) as HTMLElement | undefined;
}

function ReconstructedTranscript({ draft }: { draft: NewInspectionDraft }) {
  const currentObservation = draft.findingObservations.find((item) => !item.saved) ?? draft.findingObservations[draft.findingObservations.length - 1] ?? null;
  const savedCount = draft.findingObservations.filter((item) => item.saved).length;
  return (
    <div data-aurelia-reconstructed-chat="true">
      {draft.areaName ? <BotBubble>¡Hola, <strong>{draft.inspectorName}</strong>! 👋 Soy AurelIA. Voy a ayudarte a registrar esta inspección de forma rápida. ¿En qué <strong>área</strong> estás hoy?</BotBubble> : null}
      {draft.areaName ? <UserBubble>{draft.areaName}</UserBubble> : null}
      {draft.areaName && draft.sectorName ? <BotBubble>Perfecto, <strong>{draft.areaName}</strong> ✓. Ahora el sector — ¿en cuál específicamente?</BotBubble> : null}
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
      {currentObservation?.evidence ? <BotBubble>Foto recibida ✓. Analicé el historial de <strong>{draft.areaName}</strong> y te propongo una medida correctiva.</BotBubble> : null}
      {currentObservation?.correctiveAction ? <UserBubble>{currentObservation.correctiveActionSource === 'ai' ? '✓ Medida aceptada' : currentObservation.correctiveAction}</UserBubble> : null}
      {currentObservation?.severityLabel ? <BotBubble>Definamos la criticidad del hallazgo.</BotBubble> : null}
      {currentObservation?.severityLabel ? <UserBubble>{currentObservation.severityLabel}</UserBubble> : null}
      {savedCount > 0 ? <BotBubble>Llevas <strong>{savedCount} observación</strong>. Revisa antes de continuar.</BotBubble> : null}
      {draft.findingCompanyName ? <UserBubble>✓ {draft.findingCompanyName} confirmada</UserBubble> : null}
    </div>
  );
}

function TranscriptPortal() {
  const draft = useNewInspectionDraftStore();
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
    const interval = window.setInterval(syncHost, 150);
    return () => window.clearInterval(interval);
  }, []);

  if (!host) return null;
  return createPortal(<ReconstructedTranscript draft={draft} />, host);
}

function ChatHeader({ onBack }: { onBack: () => void }) {
  return <div className="bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-[56px] items-center justify-between gap-[8px] px-[8px]"><button type="button" onClick={onBack} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatBackIcon /></button><div className="flex flex-1 items-center gap-[8px]"><div className="relative h-[38px] w-[38px]"><div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon className="h-[24px] w-[24px]" /></div><div className="absolute bottom-[2px] right-[1px] h-[10px] w-[10px] rounded-full border-[2px] border-[#002659] bg-[#00B398]" /></div><div><p className="text-[14px] font-bold leading-[17px] text-white">AurelIA</p><div className="mt-[1px] flex items-center gap-[4px]"><span className="h-[6px] w-[6px] rounded-full bg-[#00B398]" /><p className="text-[12px] leading-[14px] text-[rgba(255,255,255,0.62)]">Activo</p></div></div></div><button type="button" className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatMoreIcon /></button></div><div className="px-[16px] pb-[7px]"><div className="mb-[5px] flex gap-[3px]">{Array.from({ length: 6 }).map((_, index) => <div key={index} className={`h-[3px] flex-1 rounded ${index === 0 ? 'bg-[rgba(200,160,100,0.75)]' : 'bg-[rgba(255,255,255,0.22)]'}`} />)}</div><div className="flex h-[17px] items-center justify-between"><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">Paso 1 · Identificación</p><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">14%</p></div></div></div>;
}

function ChatFooter() {
  return <div className="border-t border-[#E3E3E3] bg-white px-[12px] pb-[8px] pt-[9px]"><div className="flex w-full gap-[8px]"><input disabled placeholder="O escribe aquí…" className="h-[41px] flex-1 rounded-full border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[15px] text-[15px] outline-none placeholder:text-[#ACACAC] disabled:text-[#ACACAC]" /><button type="button" disabled className="flex h-[38px] min-w-[38px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39] opacity-50"><ChatSendIcon /></button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
}

function EarlyResumeStep({ props, onHandoff }: { props: AssistantChatStepProps; onHandoff: () => void }) {
  const draft = useNewInspectionDraftStore();
  const { captureLocation, capturing, locationError } = useNewInspectionLocation();

  useEffect(() => saveNewInspectionDraftSnapshot(useNewInspectionDraftStore.getState()), []);
  useEffect(() => useNewInspectionDraftStore.subscribe((state) => saveNewInspectionDraftSnapshot(state)), []);

  async function captureAndContinue() {
    const ok = await captureLocation();
    if (ok) {
      saveNewInspectionDraftSnapshot(useNewInspectionDraftStore.getState());
      onHandoff();
    }
  }

  function chooseEnvironmental() {
    draft.setInspectionType(InspectionType.ENVIRONMENTAL, 'Hallazgo');
  }

  function chooseToday() {
    draft.setInspectionDate(todayLabel());
  }

  return <><ChatHeader onBack={props.onBack} /><div className="flex-1 overflow-y-auto bg-[#F4F6F9] px-[12px] pb-[16px] pt-[12px]"><ReconstructedTranscript draft={draft} />{!draft.inspectionTypeSelected ? <><BotBubble><strong>{draft.areaName} · {draft.sectorName} ✓</strong>. ¿Qué tipo de inspección es?</BotBubble><div className="mb-[10px] ml-[33px] flex flex-col gap-[6px]"><button type="button" onClick={chooseEnvironmental} className="flex min-h-[34px] items-center justify-center gap-[8px] rounded-full border-[1.5px] border-[#D1D1D1] bg-white px-[13.5px] py-[6px] text-[13px] font-semibold leading-[16px] text-[#0d3862]">⌕ Hallazgo</button><button type="button" onClick={chooseEnvironmental} className="flex min-h-[34px] items-center justify-center gap-[8px] rounded-full border-[1.5px] border-[#D1D1D1] bg-white px-[13.5px] py-[6px] text-[13px] font-semibold leading-[16px] text-[#0d3862]">▣ Checklist normativo</button></div></> : null}{draft.inspectionTypeSelected && !draft.inspectionDateSelected ? <><BotBubble>Selecciona la <strong>fecha de inspección</strong>.</BotBubble><div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[12px] font-bold text-[#131313]">Fecha</p><button type="button" onClick={chooseToday} className="mt-[8px] flex h-[44px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[12px] text-left text-[13px] text-[#131313]"><span>Usar fecha de hoy</span><span>{displayDate(todayLabel())}</span></button></div></> : null}{draft.inspectionTypeSelected && draft.inspectionDateSelected && !draft.locationCaptured ? <><BotBubble>Capturemos la <strong>ubicación obligatoria</strong>.</BotBubble><div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[12px] font-bold text-[#131313]">Ubicación de la inspección</p><button type="button" onClick={captureAndContinue} disabled={capturing} className="mt-[8px] h-[44px] w-full rounded-[10px] bg-[#C8A064] text-[12px] font-bold text-white disabled:opacity-70">{capturing ? 'Capturando ubicación...' : 'Capturar ubicación'}</button><div className="mt-[8px] min-h-[48px] rounded-[8px] border border-[#E3E3E3] bg-[#F4F6F9] px-[12px] py-[15px] text-[11px] font-semibold text-[#131313]">{draft.locationLabel}</div>{locationError ? <p className="mt-[8px] text-[11px] font-semibold text-[#7A0E23]">{locationError}</p> : null}</div></> : null}</div><ChatFooter /></>;
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  const draft = useNewInspectionDraftStore();
  const [handoff, setHandoff] = useState(false);
  const resumeMode = props.resumeFromDraft && draft.flowMode !== 'manual';
  const earlyResume = resumeMode && !draft.locationCaptured && !handoff;

  useEffect(() => {
    scheduleSuggestionPatch();
    const observer = new MutationObserver(scheduleSuggestionPatch);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] });
    const interval = window.setInterval(applySuggestionClasses, 120);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  if (earlyResume) return <EarlyResumeStep props={props} onHandoff={() => setHandoff(true)} />;
  return <><AssistantChatStepV9 {...props} resumeFromDraft={props.resumeFromDraft || resumeMode} />{resumeMode ? <TranscriptPortal /> : null}</>;
}
