import { useState } from 'react';
import type { InspectionDetailEvidenceResponse, InspectionDetailFindingItemResponse } from '@aurelia/contracts';
import { env } from '../../../shared/config/env';
import { InspectionDetailStatusChipIcon } from './InspectionDetailIcons';

const API_URL = env.apiUrl;
const apiOrigin = API_URL.replace(/\/api\/?$/, '');

function BackIcon() {
  return <svg width="23" height="19" viewBox="0 0 23 19" fill="none" aria-hidden="true"><path d="M9.5 1.75 1.75 9.5l7.75 7.75M2.5 9.5h18.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ArrowRightIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M1 7h15M10.5 1.5 16 7l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ArrowLeftIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M17 7H2M7.5 1.5 2 7l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function OfflineIcon() {
  return <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true"><path d="m1 1 11 9M3.2 4.1A5.4 5.4 0 0 1 6.5 3c1.25 0 2.4.4 3.32 1.08M5.1 6.04A2.6 2.6 0 0 1 6.5 5.63c.5 0 .96.13 1.36.37M6.5 8.35h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CameraIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M5.25 5.25 6.5 3.5h5l1.25 1.75H15A1.5 1.5 0 0 1 16.5 6.75v6A1.5 1.5 0 0 1 15 14.25H3a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 3 5.25h2.25Z" fill="currentColor" /><circle cx="9" cy="9.75" r="2.75" fill="white" /></svg>;
}

function ResponsibleIcon() {
  return <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true"><path d="M6.5 1.2a2 2 0 0 1 2 2v.8h1.1a.7.7 0 0 1 .7.7v1.1H2.7V4.7a.7.7 0 0 1 .7-.7h1.1v-.8a2 2 0 0 1 2-2Zm-4 5.4h8v2.2a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V6.6Z" fill="currentColor" /></svg>;
}

function ObservationIcon() {
  return <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true"><path d="M2 2.2h1.2M5 2.2h6M2 5.5h1.2M5 5.5h6M2 8.8h1.2M5 8.8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M2.1 1.2 3 2.1l1.3-1.4M2.1 4.5 3 5.4 4.3 4M2.1 7.8 3 8.7l1.3-1.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CheckIcon() {
  return <svg width="35" height="28" viewBox="0 0 35 28" fill="none" aria-hidden="true"><path d="M3 14.5 13 24.5 32 3.5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function severityClassName(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('crítico') || normalized.includes('critico')) return 'bg-[#ffd0db] text-[#570b1d]';
  if (normalized.includes('grave')) return 'bg-[#ffd0db] text-[#570b1d]';
  if (normalized.includes('alto')) return 'bg-[#ffe1cd] text-[#532a0e]';
  if (normalized.includes('moder')) return 'bg-[#fbe1d0] text-[#69462e]';
  return 'bg-[#e0ffd3] text-[#2a5c16]';
}

function resolveEvidenceContentUrl(evidence: InspectionDetailEvidenceResponse | undefined) {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function formatDateTime(value: string | null | undefined, fallback = '01-06-2026 · 09:14') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()} · ${hours}:${minutes}`;
}

function formatDate(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatDueDate(value: string | null | undefined) {
  if (!value) return 'Mar 10 jun. 2026';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Mar 10 jun. 2026';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).replace('.', '');
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function FindingPill({ children, className }: { children: string; className: string }) {
  return <span className={`inline-flex h-[19px] items-center rounded-[6px] px-[8px] text-[11px] font-bold leading-none ${className}`}>{children}</span>;
}

function TextBlock({ title, children, bordered = false }: { title: string; children: string | null | undefined; bordered?: boolean }) {
  return <div className={`flex w-full flex-col items-start rounded-[8px] bg-white px-[10px] py-[8px] ${bordered ? 'border border-[#e3e3e3]' : ''}`}><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">{title}</p><p className="pt-[3px] text-[12px] font-normal leading-[16.8px] text-[#131313]">{children || '—'}</p></div>;
}

function EvidenceImage({ title, evidence, fallbackDate }: { title: string; evidence: InspectionDetailEvidenceResponse | undefined; fallbackDate?: string }) {
  const url = resolveEvidenceContentUrl(evidence);
  return <div className="relative h-[80px] overflow-hidden rounded-[8px] bg-[linear-gradient(165deg,#1e3050_0%,#0f1f35_100%)]">{url ? <img className="h-full w-full object-cover" src={url} alt={title} /> : null}<div className="absolute left-[8px] top-[6px] rounded-[4px] bg-[rgba(0,0,0,0.55)] px-[7px] py-[2px]"><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-white">{title}</p></div><div className="absolute bottom-[6px] right-[8px] rounded-[4px] bg-[rgba(0,0,0,0.5)] px-[6px] py-[2px]"><p className="text-[9px] font-normal leading-none text-[rgba(255,255,255,0.8)]">{formatDateTime(evidence?.capturedAt, fallbackDate)}</p></div></div>;
}

function Stepper({ step }: { step: 1 | 2 }) {
  return <div className="shrink-0 border-b border-[#e3e3e3] bg-white px-[14px] pb-[9px] pt-[10px]"><div className="flex items-center"><div className="relative flex h-[35px] min-w-0 flex-1 flex-col items-center"><div className="absolute left-1/2 top-[10px] h-[2px] w-full bg-[#d1d1d1]" /><div className={`z-10 flex size-[22px] items-center justify-center rounded-full border-2 text-[9px] font-bold ${step === 2 ? 'border-[#c8a064] bg-[#c8a064] text-white' : 'border-[#c8a064] bg-white text-[#c8a064]'}`}>{step === 2 ? '✓' : '1'}</div><p className="pt-[3px] text-[8px] font-bold leading-[10px] text-[#8e6e3e]">Detalle</p></div><div className="relative flex h-[35px] w-[96px] flex-col items-center"><div className="absolute left-1/2 top-[10px] h-[2px] w-full bg-[#d1d1d1]" /><div className={`z-10 flex size-[22px] items-center justify-center rounded-full border-2 bg-white text-[9px] font-bold ${step === 2 ? 'border-[#c8a064] text-[#c8a064]' : 'border-[#d1d1d1] text-[#acacac]'}`}>2</div><p className={`pt-[3px] text-[8px] leading-[10px] ${step === 2 ? 'font-bold text-[#8e6e3e]' : 'font-normal text-[#acacac]'}`}>Resumen</p></div><div className="flex h-[35px] min-w-0 flex-1 flex-col items-center"><div className="flex size-[22px] items-center justify-center rounded-full border-[1.5px] border-[#d1d1d1] bg-white text-[9px] font-bold text-[#acacac]">3</div><p className="pt-[3px] text-[8px] font-normal leading-[10px] text-[#acacac]">Confirm.</p></div></div><div className="mt-[6px] h-[2px] w-full rounded-[2px] bg-[#e3e3e3]"><div className={`h-[2px] rounded-[2px] bg-gradient-to-r from-[#8e6e3e] to-[#c8a064] ${step === 2 ? 'w-[110px]' : 'w-0'}`} /></div></div>;
}

function Header({ subtitle, onBack }: { subtitle: string; onBack: () => void }) {
  return <><div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-full items-center gap-[4px] px-[4px]"><button type="button" onClick={onBack} className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.92)]" aria-label="Volver"><BackIcon /></button><div className="min-w-0 flex-1 px-[4px]"><p className="truncate text-[14px] font-semibold leading-[17px] text-white">Detalle del hallazgo</p><p className="mt-[1px] text-[11px] leading-[13px] text-[rgba(255,255,255,0.55)]">Paso 2 de 4 · {subtitle}</p></div><div className="mr-[4px] flex h-[20px] shrink-0 items-center rounded-[16px] bg-[#c8a064] px-[10px] text-[10px] font-bold text-[#001e39]">EECC</div></div></div><div className="flex shrink-0 items-center gap-[7px] border-b border-[#c8a064] bg-[#2a1a04] px-[16px] pb-[6px] pt-[5px] text-[#c8a064]"><OfflineIcon /><p className="text-[11px] font-semibold leading-none">Sin red · guardando localmente</p></div></>;
}

function SavedHeader() {
  return <><div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-full items-center gap-[4px] px-[14px]"><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold leading-[17px] text-white">Guardado</p><p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">SGA · Gold Fields Salares Norte</p></div><div className="flex h-[20px] shrink-0 items-center rounded-[16px] bg-[#c8a064] px-[10px] text-[10px] font-bold text-[#001e39]">GF HSE</div></div></div><div className="flex shrink-0 items-center gap-[7px] border-b border-[#c8a064] bg-[#2a1a04] px-[16px] pb-[6px] pt-[5px] text-[#c8a064]"><OfflineIcon /><p className="text-[11px] font-semibold leading-none">Sin red · guardando localmente</p></div><div className="shrink-0 border-b border-[#e3e3e3] bg-white px-[14px] pb-[9px] pt-[10px]"><div className="mt-[6px] h-[2px] w-full rounded-[2px] bg-[#e3e3e3]"><div className="h-[2px] w-full rounded-[2px] bg-gradient-to-r from-[#8e6e3e] to-[#c8a064]" /></div></div></>;
}

function SavedView({ onDone, rejectedFlow }: { onDone: () => void; rejectedFlow: boolean }) {
  return <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#f7f7f7]"><SavedHeader /><div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#f7f7f7] px-[38px] py-[24px]"><div className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-[#3a9b3a]"><CheckIcon /></div><h2 className="mt-[12px] text-center text-[18px] font-bold leading-[22px] text-[#3a9b3a]">{rejectedFlow ? 'Corrección de observación marcado como ejecutado' : 'Hallazgo marcado como ejecutado'}</h2><div className="mt-[12px] w-full rounded-[10px] border border-[#6cc24a] bg-[#e0ffd3] px-[12px] py-[10px]"><p className="text-[12px] font-normal leading-[18px] text-[#2a5c16]">Evidencia enviada. El Admin GF HSE ha recibido una alerta para revisar y validar el cierre definitivo de la observación.</p></div><div className="mt-[12px] w-full rounded-[12px] bg-[#f7f7f7] p-[14px]"><p className="text-center text-[13px] font-bold leading-none text-[#131313]">Próximo paso — Admin GF</p><p className="pt-[4px] text-center text-[12px] font-normal leading-[18px] text-[#646464]">El Admin GF revisará cada fotografía de cierre. Si cumple el estándar, cambiará el estado a <span className="font-bold">Cerrado</span>. Si no cumple, recibirás notificación de rechazo y el plazo se reactivará obs. por obs.</p></div><button type="button" className="mt-[12px] flex h-[50px] w-[280px] items-center justify-center rounded-[14px] bg-[#c8a064] text-[14px] font-bold text-white" onClick={onDone}>Ir a Mis hallazgos</button></div><div className="shrink-0 border-t border-[#e3e3e3] bg-white pt-[18px]"><div className="mx-auto mb-[4px] h-[4px] w-[120px] rounded-[2px] bg-[#d1d1d1]" /></div></div>;
}

function PhotoInput({ file, onChange, rejectedFlow }: { file: File | null; onChange: (file: File | null) => void; rejectedFlow: boolean }) {
  if (file) {
    return <label className="flex h-[60px] w-full cursor-pointer items-center gap-[8px] rounded-[8px] bg-[#3a9b3a] px-[12px] py-[10px]"><input type="file" accept="image/*" className="hidden" onChange={(event) => onChange(event.target.files?.[0] ?? file)} /><span className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.25)] text-white"><CameraIcon /></span><span className="min-w-0 truncate text-[12px] font-bold leading-none text-white">{file.name}</span></label>;
  }
  return <><p className="text-[13px] font-bold leading-none text-[#131313]">{rejectedFlow ? 'Reemplazar foto “Después”' : 'Fotografía "Después" *'}</p><label className="mt-[6px] flex min-h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#d1d1d1] bg-[#f6faff] px-[16px] py-[24px]"><input type="file" accept="image/*" className="hidden" onChange={(event) => onChange(event.target.files?.[0] ?? null)} /><p className="text-center text-[28px] leading-none">📷</p><p className="pt-[6px] text-center text-[13px] font-semibold leading-none text-[#646464]">Tomar foto o galería</p><p className="pt-[3px] text-center text-[11px] leading-none text-[#acacac]">Fecha, hora y GPS automáticos</p></label></>;
}

export function FindingManualExecutionView({ subtitle, item, index = 1, isSubmitting = false, onBack, onCancel, onSubmit }: { subtitle: string; item?: InspectionDetailFindingItemResponse | null; index?: number; isSubmitting?: boolean; onBack: () => void; onCancel: () => void; onSubmit: (description: string, file: File) => void | Promise<void> }) {
  const [description, setDescription] = useState('');
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [saved, setSaved] = useState(false);
  const beforeEvidence = item?.beforeEvidence[0];
  const afterEvidence = item?.afterEvidence[0];
  const isRejectedFlow = item?.statusGroup === 'rejected';
  const severityLabel = item?.severityLabel ?? 'Moderada';
  const condition = item?.condition ?? '[Descripción realizada por el usuario que levanta la inspección]';
  const proposedAction = item?.proposedCorrectiveAction ?? '[Medida correctiva que recomienda el usuario que tomó la inspección]';
  const rejectionReason = item?.rejectionReason ?? '[Motivo ingresado por usuario que rechazó la observación]';
  const executedActionDescription = item?.executedActionDescription ?? '[Acción que realizó el usuario al momento de ejecutar el hallazgo por primera vez]';
  const statusLabel = isRejectedFlow ? 'Rechazada' : item?.statusGroup === 'executed' ? 'Ejecutado' : item?.statusGroup === 'closed' ? 'Cerrado' : 'Abierto';
  const statusIcon = isRejectedFlow ? 'rejected' : 'open';
  const statusClass = isRejectedFlow ? 'bg-[#f7f7f7] text-[#646464]' : 'bg-[#fbe9be] text-[#5e4c22]';
  const dueDateLabel = formatDueDate(item?.dueAt);
  const riskLabel = item?.severityLabel ? `${item.severityLabel.toLowerCase()} · SLA extendido por Admin GF` : 'Riesgo alto · SLA extendido por Admin GF';
  const canAdvance = Boolean(afterFile && description.trim().length > 0 && !isSubmitting);
  const responsible = item?.responsibleUsers[0];
  const responsibleName = responsible?.fullName ?? '[Nombre y apellido usuario 1]';
  const responsiblePosition = responsible?.position ?? 'Coordinador';
  const responsibleCompany = item?.responsibleCompanyName ?? responsible?.companyName ?? '—';

  async function submit() {
    if (!canAdvance || !afterFile) return;
    await onSubmit(description.trim(), afterFile);
    setSaved(true);
  }

  function handleBack() {
    if (step === 2) {
      setStep(1);
      return;
    }
    onBack();
  }

  if (saved) return <SavedView onDone={onCancel} rejectedFlow={isRejectedFlow} />;

  if (step === 2) {
    return <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#f7f7f7]"><Header subtitle={subtitle} onBack={handleBack} /><Stepper step={2} /><div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f7] px-[14px] pt-[14px]"><section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="flex h-[29px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]"><span className="text-[#646464]"><ResponsibleIcon /></span><p className="text-[10px] font-bold uppercase leading-none tracking-[0.5px] text-[#646464]">Responsables</p></div><div className="flex items-center justify-between border-b border-[#e3e3e3] px-[12px] py-[9px]"><p className="text-[12px] font-normal leading-none text-[#646464]">Fecha ejecución</p><p className="text-right text-[12px] font-bold leading-none text-[#131313]">{formatDate(new Date().toISOString())}</p></div><div className="flex items-center justify-between border-b border-[#e3e3e3] px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">EECC</p><p className="max-w-[180px] truncate text-right text-[11px] font-bold leading-none text-[#131313]">{responsibleCompany}</p></div><div className="flex items-center gap-[10px] px-[12px] py-[10px]"><div className="flex size-[32px] shrink-0 items-center justify-center rounded-[16px] bg-[#c8a064] text-[12px] font-bold leading-none text-[#001e39]">{initials(responsibleName)}</div><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold leading-none text-[#131313]">{responsibleName}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{responsiblePosition}</p></div>{responsible?.currentUser ? <span className="inline-flex h-[16px] items-center rounded-[5px] bg-[#c5fff6] px-[7px] text-[10px] font-bold leading-none text-[#00b398]">Tú</span> : null}</div></section><section className="mt-[12px] overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="flex h-[29px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]"><span className="text-[#646464]"><ObservationIcon /></span><p className="text-[10px] font-bold uppercase leading-none tracking-[0.5px] text-[#646464]">{isRejectedFlow ? 'Corrección' : 'Observación respondida'}</p></div><div className="flex flex-col gap-[8px] px-[12px] pb-[10px] pt-[9px]"><div className="flex items-center justify-between"><div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(severityLabel)}>{severityLabel}</FindingPill></div><span className="inline-flex items-center rounded-[99px] bg-[#e0ffd3] px-[10px] py-[4px] text-[10px] font-bold uppercase leading-none tracking-[1px] text-[#2a5c16]">Respondida</span></div><p className="text-[12px] font-normal leading-[16.8px] text-[#131313]">{isRejectedFlow ? description.trim() : condition}</p>{isRejectedFlow ? <ul className="list-disc pl-[20px] text-[12px] font-normal leading-[16.8px] text-[#131313]"><li>Se ha reemplazado la fotografía</li></ul> : null}</div></section><div className="mt-[12px] rounded-[10px] bg-[#e6f3ff] px-[11px] py-[9px]"><p className="text-[12px] font-normal leading-[18px] text-[#0d3862]">Al enviar, el Admin GF HSE recibirá una alerta para validar cada observación. Solo el Admin GF puede cambiar el estado a Cerrado definitivamente.</p></div></div><div className="shrink-0 border-t border-[#e3e3e3] bg-white pb-[8px] pt-[10px]"><div className="flex gap-[10px] px-[14px]"><button type="button" className="flex h-[50px] items-center justify-center gap-[8px] rounded-[14px] border-2 border-[#c8a064] bg-white px-[20px] text-[14px] font-bold text-[#c8a064]" onClick={() => setStep(1)} disabled={isSubmitting}><ArrowLeftIcon />Atrás</button><button type="button" className="flex h-[50px] min-w-0 flex-1 items-center justify-center gap-[8px] rounded-[14px] bg-[#3a9b3a] px-[12px] text-[14px] font-bold text-white disabled:opacity-50" onClick={submit} disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar al ADMIN GF'} <ArrowRightIcon /></button></div><div className="mx-auto mb-[4px] mt-[12px] h-[4px] w-[120px] rounded-[2px] bg-[#d1d1d1]" /></div></div>;
  }

  return <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#f7f7f7]"><Header subtitle={subtitle} onBack={handleBack} /><Stepper step={1} /><div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f7] px-[14px] pt-[14px]"><div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between"><div className="flex min-w-0 items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(severityLabel)}>{severityLabel}</FindingPill></div><span className={`inline-flex h-[19px] items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold leading-none ${statusClass}`}><InspectionDetailStatusChipIcon status={statusIcon} />{statusLabel}</span></div><div className="flex flex-col gap-[4px] pt-[12px]"><EvidenceImage title="Foto antes" evidence={beforeEvidence} /><TextBlock title="Condición detectada" bordered>{condition}</TextBlock><TextBlock title="Medida correctiva propuesta">{proposedAction}</TextBlock>{isRejectedFlow ? <TextBlock title="Motivo de rechazo">{rejectionReason}</TextBlock> : null}<div className="border-t-[1.5px] border-[#c8a064] bg-[#fffdf7] px-[12px] pb-[12px] pt-[13.5px]"><p className="text-[11px] font-bold uppercase leading-none tracking-[0.66px] text-[#8e6e3e]">Tu respuesta</p>{isRejectedFlow && afterEvidence ? <div className="pt-[10px]"><EvidenceImage title="Foto después" evidence={afterEvidence} fallbackDate="01-06-2026 · 10:30" /></div> : null}<div className="pt-[10px]"><PhotoInput file={afterFile} onChange={setAfterFile} rejectedFlow={isRejectedFlow} /></div>{isRejectedFlow ? <div className="pt-[8px]"><TextBlock title="Descripción de la acción tomada" bordered>{executedActionDescription}</TextBlock></div> : null}<div className="pt-[12px]"><p className="text-[13px] font-bold leading-none text-[#131313]">{isRejectedFlow ? 'Describa la corrección *' : 'Descripción de la acción tomada *'}</p><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-[6px] h-[80px] min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#d1d1d1] bg-[#f6faff] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#757575]" placeholder="Describa la acción correctiva ejecutada..." /></div></div></div></div><div className="pt-[16px]"><div className="rounded-[10px] bg-[#001e39] px-[14px] py-[10px]"><p className="text-[9px] font-bold uppercase leading-none tracking-[2px] text-[rgba(255,255,255,0.45)]">Fecha límite SLA</p><p className="pt-[3px] text-[14px] font-bold leading-[18px] tracking-[1.5px] text-[#c8a064]">{dueDateLabel} <span className="text-[11px] font-normal tracking-normal text-[rgba(255,255,255,0.55)]">{riskLabel}</span></p></div></div><div className="mt-[12px] rounded-[10px] border border-[#ffcd56] bg-[#ffeab8] px-[12px] py-[10px]"><p className="text-[12px] leading-[18px] text-[#463100]"><span className="font-bold">BLOQUEANTE:</span> Debes adjuntar fotografía "Después" en la observación. Sin foto no es posible marcar como Ejecutado.</p></div></div><div className="shrink-0 border-t border-[#e3e3e3] bg-white pb-[8px] pt-[10px]"><div className="flex gap-[10px] px-[14px]"><button type="button" className="flex h-[50px] items-center justify-center rounded-[14px] border-2 border-[#c8a064] bg-white px-[20px] text-[14px] font-bold text-[#c8a064]" onClick={onCancel} disabled={isSubmitting}>Cancelar</button><button type="button" className={`flex h-[50px] min-w-0 flex-1 items-center justify-center gap-[8px] rounded-[14px] px-[12px] text-[14px] font-bold ${canAdvance ? 'bg-[#c8a064] text-white' : 'bg-[#d1d1d1] text-[#acacac]'}`} disabled={!canAdvance} onClick={() => setStep(2)}>Marcar como ejecutado <ArrowRightIcon /></button></div><div className="mx-auto mb-[4px] mt-[12px] h-[4px] w-[120px] rounded-[2px] bg-[#d1d1d1]" /></div></div>;
}
