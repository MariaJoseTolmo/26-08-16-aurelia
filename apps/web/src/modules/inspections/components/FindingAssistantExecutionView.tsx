import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InspectionEvidenceRelationType, InspectionFindingStatus, type InspectionDetailEvidenceResponse, type InspectionDetailFindingItemResponse } from '@aurelia/contracts';
import { env } from '../../../shared/config/env';
import { updateInspectionFinding } from '../../../shared/services/inspection-detail.service';
import { createEvidence, linkEvidence, uploadFile } from '../../../shared/services/inspections.service';
import { suggestFindingExecutionAction } from '../../../shared/services/findingAssistantExecution.service';
import { ChatAureliaIcon, ChatBackIcon, ChatMoreIcon, ChatSendIcon } from '../new-inspection/icons/AssistantChatIcons';

const API_URL = env.apiUrl;
const apiOrigin = API_URL.replace(/\/api\/?$/, '');
const photoReceivedText = 'Foto recibida ✓. Te propongo esta descripción basada en la medida solicitada. Acéptala o edítala.';

type AssistantPhase = 'details' | 'response' | 'summary' | 'done';

type ExtraBubble = {
  id: string;
  from: 'agent' | 'user';
  text: string;
};

type AssistantViewProps = {
  subtitle: string;
  inspectionLabel?: string;
  item?: InspectionDetailFindingItemResponse | null;
  index?: number;
  isSubmitting?: boolean;
  onBack: () => void;
  onCancel: () => void;
};

type FooterProps = {
  phase: AssistantPhase;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onDone: () => void;
  onConfirm: () => void;
  confirming: boolean;
};

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatDateTime(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'dd-mm-aaaa · 00:00';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()} · ${hours}:${minutes}`;
}

function daysLabel(value: string | null | undefined) {
  if (!value) return 'XX días hábiles';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'XX días hábiles';
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return `${days} días hábiles`;
}

function severityClassName(value: string | null | undefined) {
  const normalized = (value ?? '').toLowerCase();
  if (normalized.includes('crítico') || normalized.includes('critico') || normalized.includes('grave')) return 'bg-[#FFD0DB] text-[#570B1D]';
  if (normalized.includes('alto')) return 'bg-[#FFE1CD] text-[#532A0E]';
  if (normalized.includes('moder')) return 'bg-[#FBE1D0] text-[#69462E]';
  return 'bg-[#E0FFD3] text-[#2A5C16]';
}

function resolveEvidenceContentUrl(evidence: InspectionDetailEvidenceResponse | undefined) {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function evidenceLabel(evidence: InspectionDetailEvidenceResponse | undefined, fallback: string) {
  return evidence?.title ?? evidence?.description ?? fallback;
}

function firstName(value: string | null | undefined, fallback: string) {
  return value?.trim().split(/\s+/)[0] ?? fallback;
}

function CameraRetroIcon({ className = 'size-[18px]' }: { className?: string }) {
  return <svg viewBox="0 0 512 512" fill="none" aria-hidden="true" className={className}><path fill="currentColor" d="M220.6 121.2 271.1 96H448c35.3 0 64 28.7 64 64v256c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64h94.1c24.2 0 46.4 13.7 57.2 35.4l5.3 10.6ZM256 416a112 112 0 1 0 0-224 112 112 0 1 0 0 224Zm0-176a64 64 0 1 1 0 128 64 64 0 1 1 0-128Zm176-32a24 24 0 1 0 0-48 24 24 0 1 0 0 48Z" /></svg>;
}

function ImageIcon({ className = 'size-[18px]' }: { className?: string }) {
  return <svg viewBox="0 0 512 512" fill="none" aria-hidden="true" className={className}><path fill="currentColor" d="M448 80c8.8 0 16 7.2 16 16v319.8l-5-6.5-136-176c-4.5-5.9-11.6-9.3-19-9.3s-14.4 3.4-19 9.3L202 340.7l-30.5-42.7c-4.5-6.3-11.7-10-19.5-10s-15 3.7-19.5 10.1l-80 112L48 416.3V96c0-8.8 7.2-16 16-16h384ZM64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64Zm80 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96Z" /></svg>;
}

function BellIcon({ className = 'size-[14px]' }: { className?: string }) {
  return <svg viewBox="0 0 448 512" fill="none" aria-hidden="true" className={className}><path fill="currentColor" d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416h400c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32Zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7Z" /></svg>;
}

function ShieldIcon({ className = 'size-[12px]' }: { className?: string }) {
  return <svg viewBox="0 0 512 512" fill="none" aria-hidden="true" className={className}><path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9l188.3 79.9c22 9.3 38.3 31 38.3 57.2 0 99.6-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0C57.3 420.7 16 239.6 16 140c0-26.2 16.3-47.9 38.3-57.2L242.6 2.9C246.8 1 251.4 0 256 0Zm0 66.8v378.1C394 378 432 230.1 432 141.4L256 66.8Z" /></svg>;
}

function WorkerIcon({ className = 'size-[12px]' }: { className?: string }) {
  return <svg viewBox="0 0 448 512" fill="none" aria-hidden="true" className={className}><path fill="currentColor" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256Zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304h-91.4Z" /></svg>;
}

function Header({ subtitle, phase, onBack }: { subtitle: string; phase: AssistantPhase; onBack: () => void }) {
  const stepIndex = phase === 'details' ? 0 : phase === 'response' ? 1 : 2;
  const labels = ['Paso 1 · Detalles del hallazgo', 'Paso 2 · Tu respuesta', 'Paso 3 · Resumen'];
  const percents = ['33%', '66%', '100%'];
  return (
    <>
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <div className="flex h-full items-center gap-[4px] px-[4px]">
          <button type="button" onClick={onBack} className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full" aria-label="Volver"><ChatBackIcon /></button>
          <div className="min-w-0 flex-1 px-[4px]">
            <p className="truncate text-[14px] font-semibold leading-[17px] text-white">Ejecutar observación</p>
            <p className="mt-[1px] flex items-center gap-[4px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]"><span className="h-[6px] w-[6px] rounded-full bg-[#00B398]" />AurelIA · Asistente EECC · {subtitle}</p>
          </div>
          <div className="mr-[4px] flex h-[22px] shrink-0 items-center rounded-[16px] bg-[#00B398] px-[10px] text-[10px] font-bold text-white">EECC</div>
          <button type="button" className="flex h-[48px] w-[36px] shrink-0 items-center justify-center rounded-full" aria-label="Más opciones"><ChatMoreIcon /></button>
        </div>
      </div>
      <div className="shrink-0 bg-[#002659] px-[16px] pb-[7px] pt-[7px]">
        <div className="mb-[5px] flex gap-[3px]">
          {[0, 1, 2].map((item) => <div key={item} className={`h-[3px] flex-1 rounded-[2px] ${item < stepIndex ? 'bg-[#00B398]' : item === stepIndex ? 'bg-[rgba(0,179,152,0.45)]' : 'bg-[rgba(255,255,255,0.15)]'}`} />)}
        </div>
        <div className="flex justify-between">
          <p className="text-[10px] font-semibold leading-none text-[rgba(255,255,255,0.7)]">{labels[stepIndex]}</p>
          <p className="text-[10px] font-semibold leading-none text-[rgba(255,255,255,0.7)]">{percents[stepIndex]}</p>
        </div>
      </div>
    </>
  );
}

function BotAvatar() {
  return <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#00B398] text-[#001E39]"><ChatAureliaIcon className="h-[15px] w-[17px]" /></div>;
}

function AgentBubble({ children }: { children: ReactNode }) {
  return <div className="flex items-end gap-[7px]"><BotAvatar /><div className="max-w-[85%] rounded-[16px_16px_16px_4px] border border-[#E3E3E3] bg-white px-[12px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="text-[13px] leading-[19.5px] text-[#131313] [&_strong]:font-bold">{children}</div><p className="mt-[4px] text-[10px] leading-none text-[#ACACAC]">{currentTime()}</p></div></div>;
}

function UserBubble({ children }: { children: ReactNode }) {
  return <div className="flex justify-end"><div className="max-w-[78%] rounded-[16px_16px_4px_16px] bg-[#002659] px-[12px] py-[10px]"><div className="text-[13px] leading-[18px] text-white">{children}</div><p className="mt-[4px] text-[10px] leading-none text-[rgba(255,255,255,0.38)]">{currentTime()}</p></div></div>;
}

function TypingDots() {
  return <div className="flex items-end gap-[7px]"><BotAvatar /><div className="flex gap-[4px] rounded-[16px_16px_16px_4px] border border-[#E3E3E3] bg-white px-[14px] py-[10px]">{[0, 1, 2].map((item) => <span key={item} className="h-[6px] w-[6px] rounded-full bg-[#ACACAC]" />)}</div></div>;
}

function QuickOption({ children, onClick, tone = 'default', disabled = false }: { children: ReactNode; onClick: () => void; tone?: 'default' | 'teal'; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`ml-[33px] flex min-h-[34px] w-fit items-center gap-[6px] rounded-[20px] border-[1.5px] px-[14px] py-[7px] text-[12px] font-semibold transition disabled:opacity-55 ${tone === 'teal' ? 'border-[#00B398] bg-[#00B398] text-white' : 'border-[#D1D1D1] bg-white text-[#24588B]'}`}>{children}</button>;
}

function FindingBadge({ children, className }: { children: string; className: string }) {
  return <span className={`inline-flex h-[20px] items-center rounded-[6px] px-[8px] text-[10px] font-bold leading-none ${className}`}>{children}</span>;
}

function FindingCard({ item, index }: { item: InspectionDetailFindingItemResponse | null | undefined; index: number }) {
  const beforeEvidence = item?.beforeEvidence[0];
  const beforeUrl = resolveEvidenceContentUrl(beforeEvidence);
  return (
    <div className="ml-[33px] overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between bg-[#001E39] px-[14px] py-[9px]"><span className="min-w-0 truncate text-[11px] font-bold text-white">Obs. {index + 1}</span><FindingBadge className={severityClassName(item?.severityLabel)}>{item?.severityLabel ?? 'Moderado'}</FindingBadge></div>
      <div className="relative flex h-[110px] flex-col items-center justify-center gap-[6px] overflow-hidden border-b border-[#E3E3E3] bg-gradient-to-br from-[#E8F4FD] to-[#C8E6F0]">
        {beforeUrl ? <img src={beforeUrl} alt={evidenceLabel(beforeEvidence, `Foto Antes · Obs. ${index + 1}`)} className="h-full w-full object-cover" /> : <><ImageIcon className="size-[28px] text-[#24588B]" /><span className="text-[10px] text-[#646464]">Foto Antes · Obs. {index + 1}</span></>}
        <div className="absolute left-[10px] top-[8px] rounded-[4px] bg-[rgba(0,0,0,0.55)] px-[8px] py-[3px]"><p className="text-[9px] font-bold uppercase tracking-[1.5px] text-white">Foto antes</p></div>
        {beforeEvidence?.capturedAt ? <div className="absolute bottom-[8px] right-[10px] rounded-[4px] bg-[rgba(0,0,0,0.5)] px-[7px] py-[3px]"><p className="text-[9px] leading-none text-[rgba(255,255,255,0.85)]">{formatDateTime(beforeEvidence.capturedAt)}</p></div> : null}
      </div>
      <div className="flex flex-col gap-[7px] px-[12px] py-[10px]">
        <div className="flex gap-[8px]"><p className="min-w-[72px] pt-px text-[9px] font-bold uppercase tracking-[0.05em] text-[#646464]">Condición</p><p className="flex-1 text-[12px] font-medium leading-[16.8px] text-[#131313]">{item?.condition ?? '—'}</p></div>
        <div className="flex gap-[8px]"><p className="min-w-[72px] pt-px text-[9px] font-bold uppercase tracking-[0.05em] text-[#646464]">Medida solicitada</p><p className="flex-1 text-[12px] font-medium leading-[16.8px] text-[#131313]">{item?.proposedCorrectiveAction ?? '—'}</p></div>
      </div>
    </div>
  );
}

function SlaCard({ item }: { item: InspectionDetailFindingItemResponse | null | undefined }) {
  return <div className="ml-[33px] flex items-center gap-[10px] rounded-[10px] border-[1.5px] border-[#E8A06A] bg-[#FFE1CD] px-[12px] py-[10px]"><span className="text-[18px] text-[#532A0E]">◷</span><div><p className="text-[11px] font-bold text-[#532A0E]">Fecha límite: {formatDate(item?.dueAt)}</p><p className="mt-[2px] text-[10px] text-[#532A0E]">{daysLabel(item?.dueAt)} · <strong>SLA vigente</strong></p></div></div>;
}

function PhotoInput({ file, onChange }: { file: File | null; onChange: (file: File) => void }) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) onChange(nextFile);
    event.target.value = '';
  }
  if (file) {
    return <label className="flex h-[58px] cursor-pointer items-center gap-[8px] rounded-[10px] bg-[#3A9B3A] px-[12px] py-[10px]"><input type="file" accept="image/*" className="hidden" onChange={handleChange} /><span className="flex size-[40px] items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.25)] text-white"><CameraRetroIcon className="size-[18px]" /></span><span className="min-w-0 truncate text-[12px] font-bold text-white">{file.name}</span></label>;
  }
  return (
    <div className="rounded-[10px] border-[1.5px] border-dashed border-[#D1D1D1] px-[14px] py-[14px]">
      <div className="flex flex-col items-center gap-[8px]">
        <div className="flex size-[40px] items-center justify-center rounded-[10px] bg-[#F4F6F9] text-[#646464]"><CameraRetroIcon className="size-[18px]" /></div>
        <p className="text-[12px] font-bold text-[#333]">Adjuntar foto de evidencia</p>
        <p className="text-center text-[10px] text-[#ACACAC]">Fecha, hora y GPS se registran automáticamente</p>
        <div className="flex w-full gap-[8px]">
          <label className="flex h-[34px] flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] text-[11px] font-semibold text-[#333]"><input type="file" accept="image/*" className="hidden" onChange={handleChange} /><CameraRetroIcon className="size-[11px]" />Tomar foto</label>
          <label className="flex h-[34px] flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] text-[11px] font-semibold text-[#333]"><input type="file" accept="image/*" className="hidden" onChange={handleChange} /><ImageIcon className="size-[11px]" />Desde galería</label>
        </div>
      </div>
    </div>
  );
}

function ResponseCard({ item, file, suggestion, editing, accepted, description, onFile, onAccept, onEdit, onDescriptionChange, onSaveDescription }: { item: InspectionDetailFindingItemResponse | null | undefined; file: File | null; suggestion: string | null; editing: boolean; accepted: boolean; description: string; onFile: (file: File) => void; onAccept: () => void; onEdit: () => void; onDescriptionChange: (value: string) => void; onSaveDescription: () => void }) {
  return (
    <div className="ml-[33px] overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white">
      <div className="flex items-center gap-[6px] border-b border-[#E3E3E3] bg-[#F4F6F9] px-[12px] py-[8px]"><CameraRetroIcon className="size-[11px] text-[#00B398]" /><p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#646464]">Foto Después — evidencia de corrección</p></div>
      <div className="p-[12px]"><PhotoInput file={file} onChange={onFile} /></div>
      <div className="border-t border-[#E3E3E3] px-[12px] py-[10px]">
        <p className="mb-[6px] text-[10px] font-bold uppercase tracking-[0.05em] text-[#646464]">Descripción de la acción tomada</p>
        {suggestion && !editing ? (
          <div className="overflow-hidden rounded-[10px] border-[1.5px] border-[#C8A064] bg-white">
            <div className="flex items-center gap-[6px] border-b border-[rgba(200,160,100,0.2)] bg-[#FAE8C8] px-[12px] py-[7px]"><span className="text-[10px] text-[#8E6E3E]">✦</span><span className="text-[10px] font-bold text-[#8E6E3E]">Acción sugerida por AurelIA</span></div>
            <div className="px-[12px] py-[10px]"><p className="text-[12px] font-medium leading-[18px] text-[#131313]">{suggestion}</p></div>
            <div className="flex gap-[6px] px-[12px] pb-[10px]"><button type="button" onClick={onEdit} disabled={accepted} className="flex h-[34px] items-center justify-center rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-white px-[12px] text-[12px] font-semibold text-[#333] disabled:text-[#ACACAC]">✎ Editar</button><button type="button" onClick={onAccept} disabled={accepted} className="flex h-[34px] flex-1 items-center justify-center rounded-[8px] bg-[#00B398] text-[12px] font-bold text-white disabled:bg-[rgba(0,179,152,0.5)]">✓ Aceptar</button></div>
          </div>
        ) : null}
        {editing ? <div><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} className="min-h-[86px] w-full resize-none rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-white px-[12px] py-[10px] text-[12px] leading-[18px] text-[#131313] outline-none focus:border-[#00B398]" placeholder={item?.proposedCorrectiveAction ?? 'Describe la acción que tomaste…'} /><button type="button" onClick={onSaveDescription} className="mt-[8px] flex h-[36px] w-full items-center justify-center rounded-[8px] bg-[#00B398] text-[12px] font-bold text-white">Guardar descripción</button></div> : null}
        {!suggestion && !editing ? <p className="text-[11px] leading-[16px] text-[#ACACAC]">Adjunta una foto para que AurelIA proponga una descripción inicial.</p> : null}
      </div>
    </div>
  );
}


function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex border-b border-[#E3E3E3] px-[12px] py-[8px] last:border-b-0"><span className="w-[80px] shrink-0 text-[10px] font-medium text-[#646464]">{label}</span><div className="min-w-0 flex-1 text-[11px] font-semibold leading-[15px] text-[#131313]">{children}</div></div>;
}

function SummaryCard({ item, index, file, description, subtitle, inspectionLabel, summaryAt }: { item: InspectionDetailFindingItemResponse | null | undefined; index: number; file: File | null; description: string; subtitle: string; inspectionLabel?: string; summaryAt: string | null }) {
  const responsible = item?.responsibleUsers[0];
  const beforeEvidence = item?.beforeEvidence[0];
  const beforeUrl = resolveEvidenceContentUrl(beforeEvidence);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setAfterUrl(null);
      return undefined;
    }
    const nextUrl = URL.createObjectURL(file);
    setAfterUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  const inspectionNumber = inspectionLabel?.split(' · ')[0] ?? '';
  const inspectionDescription = inspectionLabel ?? subtitle;
  const companyName = item?.responsibleCompanyName ?? responsible?.companyName ?? '—';
  const executedBy = responsible?.fullName ?? 'Responsable EECC';
  const executedAt = summaryAt ?? new Date().toISOString();
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex min-h-[36px] items-center justify-between bg-[#001E39] px-[12px] py-[8px]"><span className="min-w-0 truncate text-[11px] font-bold text-white">Observación {inspectionNumber ? `${inspectionNumber} · ` : ''}Obs. {index + 1}</span><span className="rounded-[5px] bg-[#C5FFF6] px-[7px] py-[2px] text-[9px] font-bold text-[#006153]">Ejecutado</span></div>
      <div className="grid grid-cols-2 gap-[8px] px-[12px] py-[10px]">
        <div className="overflow-hidden rounded-[8px] border border-[#E3E3E3]"><div className="bg-[#001E39] px-[8px] py-[4px] text-[9px] font-bold uppercase text-[rgba(255,255,255,0.72)]">Antes · Inspector</div><div className="flex h-[80px] flex-col items-center justify-center gap-[4px] overflow-hidden bg-gradient-to-br from-[#E8F4FD] to-[#C8E6F0]">{beforeUrl ? <img src={beforeUrl} alt={evidenceLabel(beforeEvidence, 'Foto original')} className="h-full w-full object-cover" /> : <><ImageIcon className="size-[22px] text-[#24588B]" /><span className="text-[9px] text-[#646464]">Foto original</span></>}</div></div>
        <div className="overflow-hidden rounded-[8px] border border-[#E3E3E3]"><div className="bg-[#001E39] px-[8px] py-[4px] text-[9px] font-bold uppercase text-[rgba(255,255,255,0.72)]">Después · EECC</div><div className="flex h-[80px] flex-col items-center justify-center gap-[4px] overflow-hidden bg-gradient-to-br from-[#E0FFD3] to-[#C5F0B0]">{afterUrl ? <img src={afterUrl} alt="Evidencia posterior" className="h-full w-full object-cover" /> : <><ImageIcon className="size-[22px] text-[#2A5C16]" /><span className="text-[9px] text-[#2A5C16]">Evidencia ✓</span></>}</div></div>
      </div>
      <SummaryRow label="Ejecutado por">{executedBy}</SummaryRow>
      <SummaryRow label="Empresa">{companyName}</SummaryRow>
      <SummaryRow label="Fecha y hora">{formatDateTime(executedAt)}</SummaryRow>
      <SummaryRow label="Inspección">{inspectionDescription}</SummaryRow>
      <SummaryRow label="Criticidad"><FindingBadge className={severityClassName(item?.severityLabel)}>{item?.severityLabel ?? 'Moderado'}</FindingBadge></SummaryRow>
      <div className="flex flex-col gap-[4px] px-[12px] py-[8px]"><span className="text-[10px] font-medium text-[#646464]">Acción tomada</span><p className="text-[11px] leading-[16.5px] text-[#131313]">{description}</p></div>
    </div>
  );
}

function Footer({ phase, inputValue, onInputChange, onSend, onDone, onConfirm, confirming }: FooterProps) {
  if (phase === 'done') return <div className="shrink-0 border-t border-[#E3E3E3] bg-white px-[12px] pb-[6px] pt-[8px]"><button type="button" onClick={onDone} className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[14px] bg-[#C8A064] text-[14px] font-bold text-[#001E39]">← Volver a observaciones</button><div className="mx-auto mt-[10px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
  if (phase === 'summary') return <div className="shrink-0 border-t border-[#E3E3E3] bg-white px-[12px] pb-[6px] pt-[8px]"><button type="button" onClick={onConfirm} disabled={confirming} className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[14px] bg-[#00B398] text-[14px] font-bold text-white disabled:opacity-55">{confirming ? 'Guardando…' : '✓ Confirmar ejecución'}</button><div className="mx-auto mt-[10px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
  return <div className="shrink-0 border-t border-[#E3E3E3] bg-white px-[12px] pb-[6px] pt-[8px]"><div className="flex items-center gap-[8px]"><textarea value={inputValue} onChange={(event) => onInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder="Escribe aquí o usa los controles…" rows={1} className="min-h-[40px] max-h-[80px] flex-1 resize-none rounded-[20px] border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[14px] py-[10px] text-[13px] leading-[18px] text-[#131313] outline-none placeholder:text-[#ACACAC]" /><button type="button" onClick={onSend} className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#00B398] text-white"><ChatSendIcon /></button></div><div className="mx-auto mt-[10px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
}

function DoneScreen({ item, index, submittedAt }: { item: InspectionDetailFindingItemResponse | null | undefined; index: number; submittedAt: string | null }) {
  const responsible = item?.responsibleUsers[0];
  const executedAt = submittedAt ?? new Date().toISOString();
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-[24px] py-[28px] text-center">
      <div className="flex size-[76px] items-center justify-center rounded-full bg-[#00B398] text-[34px] text-white shadow-[0_10px_24px_rgba(0,179,152,0.32)]">✓</div>
      <h2 className="mt-[18px] text-[20px] font-bold leading-[24px] text-[#00B398]">¡Observación ejecutada!</h2>
      <p className="mt-[14px] max-w-[280px] text-[13px] leading-[20.8px] text-[#646464]">La observación <strong className="text-[#131313]">Obs. {index + 1}</strong> fue marcada como <strong className="text-[#00B398]">Ejecutada</strong> y quedará pendiente de revisión.</p>
      <div className="mt-[18px] w-full max-w-[300px] rounded-[12px] border-[1.5px] border-[#00B398] bg-[#C5FFF6] px-[16px] py-[14px] text-left">
        <div className="mb-[10px] flex items-center gap-[8px]"><div className="flex size-[32px] items-center justify-center rounded-[8px] bg-[#00B398] text-white"><BellIcon /></div><p className="text-[12px] font-bold text-[#006153]">Notificaciones enviadas</p></div>
        <div className="flex items-start gap-[7px] text-[12px] leading-[18px] text-[#006153]"><span className="mt-[3px] shrink-0"><ShieldIcon /></span><span><strong>Admin GF HSE</strong><br /><span className="text-[10px]">Revisará la evidencia para aprobar o rechazar</span></span></div>
        <div className="my-[10px] h-px bg-[rgba(0,179,152,0.35)]" />
        <div className="flex items-start gap-[7px] text-[12px] leading-[18px] text-[#006153]"><span className="mt-[3px] shrink-0"><WorkerIcon /></span><span><strong>{responsible?.fullName ?? 'Responsable EECC'}</strong><br /><span className="text-[10px]">Fue notificada de la ejecución</span></span></div>
      </div>
      <div className="mt-[14px] grid w-full max-w-[300px] grid-cols-2 gap-[8px]"><div className="rounded-[8px] border border-[#E3E3E3] bg-white p-[10px]"><p className="text-[14px] font-bold text-[#131313]">{firstName(responsible?.fullName, 'EECC')}</p><p className="mt-[2px] text-[9px] text-[#646464]">Ejecutado por</p></div><div className="rounded-[8px] border border-[#E3E3E3] bg-white p-[10px]"><p className="text-[14px] font-bold text-[#00B398]">{currentTime()}</p><p className="mt-[2px] text-[9px] text-[#646464]">Hora de ejecución</p></div></div>
      <p className="mt-[14px] text-[11px] leading-[16.5px] text-[#ACACAC]">AurelIA · Gold Fields Salares Norte<br />{formatDate(executedAt)}</p>
    </div>
  );
}

export function FindingAssistantExecutionView({ subtitle, inspectionLabel, item, index = 0, isSubmitting = false, onBack, onCancel }: AssistantViewProps) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<AssistantPhase>('details');
  const [file, setFile] = useState<File | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [responseAccepted, setResponseAccepted] = useState(false);
  const [responseAckText, setResponseAckText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [summaryAt, setSummaryAt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [extraBubbles, setExtraBubbles] = useState<ExtraBubble[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (phase === 'done' || phase === 'summary') node.scrollTop = 0;
    else node.scrollTop = node.scrollHeight;
  }, [phase, file, suggestion, description, editing, loadingSuggestion, responseAccepted, extraBubbles.length]);

  async function handleFile(nextFile: File) {
    setFile(nextFile);
    setResponseAccepted(false);
    setResponseAckText(null);
    setLoadingSuggestion(true);
    const action = await suggestFindingExecutionAction({ item, areaLabel: subtitle });
    setSuggestion(action);
    setDescription(action);
    setEditing(false);
    setLoadingSuggestion(false);
  }

  function startResponse() {
    setPhase('response');
    setExtraBubbles((current) => [...current, { id: `${Date.now()}-user`, from: 'user', text: 'Sí, iniciar respuesta' }]);
  }

  function askQuestion() {
    setExtraBubbles((current) => [...current, { id: `${Date.now()}-user`, from: 'user', text: 'Tengo una consulta' }, { id: `${Date.now()}-agent`, from: 'agent', text: 'Claro, puedes revisar la condición detectada, la medida solicitada, la evidencia inicial y el SLA vigente antes de continuar.' }]);
  }

  function sendFreeText() {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    setExtraBubbles((current) => [...current, { id: `${Date.now()}-user`, from: 'user', text }, { id: `${Date.now()}-agent`, from: 'agent', text: 'Recibido. Mantengo el contexto de esta observación para ayudarte a completar la ejecución.' }]);
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setDescription(suggestion);
    setEditing(false);
    setResponseAccepted(true);
    setResponseAckText('✓ Descripción aceptada');
  }

  function saveDescription() {
    const value = description.trim();
    if (!value) return;
    setDescription(value);
    setEditing(false);
    setResponseAccepted(true);
    setResponseAckText('✓ Descripción guardada');
  }

  function showSummary() {
    if (!file || !description.trim() || !responseAccepted) return;
    setSummaryAt(new Date().toISOString());
    setPhase('summary');
  }

  function editSummary() {
    setPhase('response');
    setEditing(true);
    setResponseAccepted(false);
    setResponseAckText(null);
  }

  async function confirmExecution() {
    if (!item?.findingId || !file || !description.trim() || submitting) return;
    setSubmitting(true);
    const executedAt = new Date().toISOString();
    try {
      const fileResponse = await uploadFile(file, null);
      const evidence = await createEvidence({
        fileId: fileResponse.id,
        title: 'Evidencia posterior del hallazgo',
        description: description.trim(),
        evidenceType: 'photo',
        capturedAt: executedAt,
      });
      await linkEvidence(evidence.id, {
        entityType: 'inspection_finding',
        entityId: item.findingId,
        relationType: InspectionEvidenceRelationType.AFTER_PHOTO,
      });
      await updateInspectionFinding(item.findingId, {
        status: InspectionFindingStatus.IN_PROGRESS,
        executedAt,
        executedActionDescription: description.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setSubmittedAt(executedAt);
      setPhase('done');
    } finally {
      setSubmitting(false);
    }
  }

  function editSuggestion() {
    setEditing(true);
    setResponseAccepted(false);
    setResponseAckText(null);
  }

  function handleBack() {
    if (phase === 'summary') {
      setPhase('response');
      return;
    }
    if (phase === 'response') {
      setPhase('details');
      return;
    }
    onBack();
  }

  if (phase === 'done') {
    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#F4F6F9]">
        <Header subtitle={subtitle} phase={phase} onBack={onCancel} />
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F4F6F9]">
          <DoneScreen item={item} index={index} submittedAt={submittedAt} />
        </div>
        <Footer phase={phase} inputValue={inputValue} onInputChange={setInputValue} onSend={sendFreeText} onDone={onCancel} onConfirm={() => { void confirmExecution(); }} confirming={isSubmitting || submitting} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#F4F6F9]">
      <Header subtitle={subtitle} phase={phase} onBack={handleBack} />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F4F6F9] px-[12px] py-[12px]">
        <div className="flex flex-col gap-[10px]">
          {phase === 'summary' ? <>
            <AgentBubble>Revisa el resumen completo antes de confirmar:</AgentBubble>
            <SummaryCard item={item} index={index} file={file} description={description} subtitle={subtitle} inspectionLabel={inspectionLabel} summaryAt={summaryAt} />
            <AgentBubble>¿Todo correcto? Al confirmar, el hallazgo quedará como <strong>Ejecutado</strong> y el Admin GF e Inspector serán notificados para aprobar.</AgentBubble>
            <QuickOption onClick={editSummary}>✎ Editar algo</QuickOption>
          </> : <>
            <AgentBubble>¡Hola! 👋 Iniciaste el flujo asistido para ejecutar la <strong>Obs. {index + 1}</strong>. Revisa los detalles antes de continuar:</AgentBubble>
            <FindingCard item={item} index={index} />
            <SlaCard item={item} />
            {extraBubbles.map((bubble) => bubble.from === 'agent' ? <AgentBubble key={bubble.id}>{bubble.text}</AgentBubble> : <UserBubble key={bubble.id}>{bubble.text}</UserBubble>)}
            {phase === 'details' ? <><AgentBubble>¿Estás listo para registrar tu respuesta?</AgentBubble><QuickOption tone="teal" onClick={startResponse}>→ Sí, iniciar respuesta</QuickOption><QuickOption onClick={askQuestion}>? Tengo una consulta</QuickOption></> : null}
            {phase === 'response' ? <><AgentBubble>Perfecto. Completa tu respuesta: sube la foto <strong>Después</strong> y describe la acción que tomaste.</AgentBubble><ResponseCard item={item} file={file} suggestion={suggestion} editing={editing} accepted={responseAccepted} description={description} onFile={handleFile} onAccept={acceptSuggestion} onEdit={editSuggestion} onDescriptionChange={(value) => { setDescription(value); setResponseAccepted(false); setResponseAckText(null); }} onSaveDescription={saveDescription} />{loadingSuggestion ? <TypingDots /> : null}{file && suggestion && !loadingSuggestion ? <AgentBubble>{photoReceivedText}</AgentBubble> : null}{responseAccepted && responseAckText ? <UserBubble>{responseAckText}</UserBubble> : null}{responseAccepted ? <QuickOption tone="teal" disabled={isSubmitting} onClick={showSummary}>→ Continuar al resumen</QuickOption> : null}</> : null}
          </>}
        </div>
      </div>
      <Footer phase={phase} inputValue={inputValue} onInputChange={setInputValue} onSend={sendFreeText} onDone={onCancel} onConfirm={() => { void confirmExecution(); }} confirming={isSubmitting || submitting} />
    </div>
  );
}
