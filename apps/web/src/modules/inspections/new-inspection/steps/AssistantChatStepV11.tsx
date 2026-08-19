import { useEffect, useState, type ChangeEvent, type ComponentProps, type ReactNode } from 'react';
import { AssistantChatStep as AssistantChatStepV10 } from './AssistantChatStepV10';
import { ChatAureliaIcon, ChatBackIcon, ChatMoreIcon, ChatSendIcon } from '../icons/AssistantChatIcons';
import { saveNewInspectionDraftSnapshot, useNewInspectionDraftStore, type NewInspectionPickedAsset } from '../state/newInspectionDraft.store';

type AssistantChatStepProps = ComponentProps<typeof AssistantChatStepV10>;

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function displayDate(value: string) {
  return value ? value.replaceAll('-', '/') : '';
}

function fileAsset(file: File): NewInspectionPickedAsset {
  return { name: file.name, file };
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

function Header({ onBack }: { onBack: () => void }) {
  return <div className="bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-[56px] items-center justify-between gap-[8px] px-[8px]"><button type="button" onClick={onBack} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatBackIcon /></button><div className="flex flex-1 items-center gap-[8px]"><div className="relative h-[38px] w-[38px]"><div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon className="h-[24px] w-[24px]" /></div><div className="absolute bottom-[2px] right-[1px] h-[10px] w-[10px] rounded-full border-[2px] border-[#002659] bg-[#00B398]" /></div><div><p className="text-[14px] font-bold leading-[17px] text-white">AurelIA</p><div className="mt-[1px] flex items-center gap-[4px]"><span className="h-[6px] w-[6px] rounded-full bg-[#00B398]" /><p className="text-[12px] leading-[14px] text-[rgba(255,255,255,0.62)]">Activo</p></div></div></div><button type="button" className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatMoreIcon /></button></div><div className="px-[16px] pb-[7px]"><div className="mb-[5px] flex gap-[3px]">{Array.from({ length: 6 }).map((_, index) => <div key={index} className={`h-[3px] flex-1 rounded ${index <= 1 ? 'bg-[rgba(200,160,100,0.75)]' : 'bg-[rgba(255,255,255,0.22)]'}`} />)}</div><div className="flex h-[17px] items-center justify-between"><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">Paso 2 · Observación</p><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">28%</p></div></div></div>;
}

function Footer() {
  return <div className="border-t border-[#E3E3E3] bg-white px-[12px] pb-[8px] pt-[9px]"><div className="flex w-full gap-[8px]"><input disabled placeholder="O escribe aquí…" className="h-[41px] flex-1 rounded-full border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[15px] text-[15px] outline-none placeholder:text-[#ACACAC] disabled:text-[#ACACAC]" /><button type="button" disabled className="flex h-[38px] min-w-[38px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39] opacity-50"><ChatSendIcon /></button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
}

function RebuiltHistory({ includeCondition }: { includeCondition: boolean }) {
  const draft = useNewInspectionDraftStore();
  const observation = draft.findingObservations.find((item) => !item.saved) ?? draft.findingObservations[draft.findingObservations.length - 1];
  return <><BotBubble>¡Hola, <strong>{draft.inspectorName}</strong>! 👋 Soy AurelIA. Voy a ayudarte a registrar esta inspección de forma rápida. ¿En qué <strong>área</strong> estás hoy?</BotBubble><UserBubble>{draft.areaName}</UserBubble><BotBubble>Perfecto, <strong>{draft.areaName}</strong> ✓. Ahora el sector — ¿en cuál específicamente?</BotBubble><UserBubble>{draft.sectorName}</UserBubble><BotBubble><strong>{draft.areaName} · {draft.sectorName} ✓</strong>. ¿Qué tipo de inspección es?</BotBubble><UserBubble>{draft.inspectionTypeLabel || 'Hallazgo'}</UserBubble><BotBubble>Selecciona la <strong>fecha de inspección</strong>.</BotBubble><UserBubble>{displayDate(draft.inspectionDate)}</UserBubble><BotBubble>Capturemos la <strong>ubicación obligatoria</strong>.</BotBubble><UserBubble>Ubicación capturada · {draft.locationAccuracyLabel}</UserBubble><BotBubble>Selecciona el <strong>tipo de hallazgo</strong>.</BotBubble><UserBubble>{draft.findingTypeLabel}</UserBubble>{includeCondition ? <><BotBubble>Cuéntame la condición subestándar que detectaste en <strong>{draft.areaName} · {draft.sectorName}</strong>.</BotBubble><UserBubble>{observation?.detectedCondition}</UserBubble></> : null}</>;
}

function ConditionResume({ props }: { props: AssistantChatStepProps }) {
  const draft = useNewInspectionDraftStore();
  const [conditionText, setConditionText] = useState('');
  useEffect(() => saveNewInspectionDraftSnapshot(useNewInspectionDraftStore.getState()), []);
  useEffect(() => useNewInspectionDraftStore.subscribe((state) => saveNewInspectionDraftSnapshot(state)), []);
  function saveCondition() {
    const value = conditionText.trim();
    if (!value) return;
    const id = draft.findingObservations.find((item) => !item.saved)?.id ?? draft.addFindingObservation();
    draft.updateFindingObservation(id, { detectedCondition: value });
    saveNewInspectionDraftSnapshot(useNewInspectionDraftStore.getState());
  }
  return <><Header onBack={props.onBack} /><div className="flex-1 overflow-y-auto bg-[#F4F6F9] px-[12px] pb-[16px] pt-[12px]"><RebuiltHistory includeCondition={false} /><BotBubble>Cuéntame la condición subestándar que detectaste en <strong>{draft.areaName} · {draft.sectorName}</strong>.</BotBubble><div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><textarea value={conditionText} onChange={(event) => setConditionText(event.target.value)} rows={4} className="w-full resize-none rounded-[10px] border border-[#D1D1D1] bg-[#F4F6F9] p-[10px] text-[13px] outline-none" placeholder="Describe la condición detectada" /><button type="button" onClick={saveCondition} className="mt-[8px] h-[36px] w-full rounded-[10px] bg-[#C8A064] text-[12px] font-bold text-white">Guardar descripción</button></div></div><Footer /></>;
}

function EvidenceResume({ props, onDone }: { props: AssistantChatStepProps; onDone: () => void }) {
  const draft = useNewInspectionDraftStore();
  const observation = draft.findingObservations.find((item) => !item.saved) ?? draft.findingObservations[draft.findingObservations.length - 1];
  useEffect(() => saveNewInspectionDraftSnapshot(useNewInspectionDraftStore.getState()), []);
  useEffect(() => useNewInspectionDraftStore.subscribe((state) => saveNewInspectionDraftSnapshot(state)), []);
  function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !observation) return;
    draft.updateFindingObservation(observation.id, { evidence: fileAsset(file) });
    saveNewInspectionDraftSnapshot(useNewInspectionDraftStore.getState());
    event.target.value = '';
    onDone();
  }
  return <><Header onBack={props.onBack} /><div className="flex-1 overflow-y-auto bg-[#F4F6F9] px-[12px] pb-[16px] pt-[12px]"><RebuiltHistory includeCondition /><BotBubble>Entendido. Adjunta una foto del hallazgo:</BotBubble><div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border-[1.5px] border-dashed border-[#D1D1D1] bg-white p-[14px]"><div className="flex flex-col items-center gap-[8px]"><div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#F4F6F9] text-[18px] text-[#646464]">▣</div><p className="text-[12px] font-bold leading-none text-[#333333]">Adjuntar fotografía del hallazgo</p><p className="text-center text-[10px] leading-none text-[#ACACAC]">Fecha, hora y GPS se registran automáticamente</p><label className="flex h-[34px] w-full cursor-pointer items-center justify-center gap-[5px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] text-[11px] font-semibold text-[#333333]"><input type="file" className="hidden" accept="image/*" onChange={onPhoto} /><span>▣</span><span>Desde galería</span></label></div></div></div><Footer /></>;
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  const draft = useNewInspectionDraftStore();
  const [doneEvidenceResume, setDoneEvidenceResume] = useState(false);
  const observation = draft.findingObservations.find((item) => !item.saved) ?? draft.findingObservations[draft.findingObservations.length - 1];
  const resumeAfterType = props.resumeFromDraft && draft.flowMode !== 'manual' && Boolean(draft.findingTypeId && !observation?.detectedCondition);
  const resumeEvidence = props.resumeFromDraft && draft.flowMode !== 'manual' && Boolean(draft.findingTypeId && observation?.detectedCondition && !observation.evidence && !doneEvidenceResume);
  if (resumeAfterType) return <ConditionResume props={props} />;
  if (resumeEvidence) return <EvidenceResume props={props} onDone={() => setDoneEvidenceResume(true)} />;
  return <AssistantChatStepV10 {...props} />;
}
