import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InspectionAnswerValue, type InspectionChecklistItem, type InspectionChecklistTemplateResponse } from '@aurelia/contracts';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { getCompanyUsers, getInspectionFindingSeverities, getInspectionTemplates, getResponsibleCompanies } from '../../../../shared/services/inspections.service';
import { SelectSheet, type SelectSheetOption } from '../components/SelectSheet';
import { useNewInspectionDraftStore, type NewInspectionChecklistItemDetail } from '../state/newInspectionDraft.store';

interface ChecklistObservationsStepProps {
  onBack: () => void;
  onNext: () => void;
}

type ChecklistItemRow = InspectionChecklistItem & { sectionTitle: string };
type SeverityChoice = { id: string; label: string; closureTimeLabel: string };
type SeverityByItemId = Record<string, SeverityChoice | undefined>;
type SlaByItemId = Record<string, string | undefined>;

function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const setOn = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  return online;
}

function getItemsCount(template: InspectionChecklistTemplateResponse) {
  return template.sections.reduce((total, section) => total + section.items.length, 0);
}

function getTemplateItems(template: InspectionChecklistTemplateResponse | undefined): ChecklistItemRow[] {
  if (!template) return [];
  return template.sections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((section) => section.items.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({ ...item, sectionTitle: section.title })));
}

function getTemplateTitle(template: InspectionChecklistTemplateResponse | undefined, fallback: string | null) {
  const source = template?.name ?? fallback ?? 'Checklist normativo';
  return source.replace(/^Almacenamiento de\s+/i, '').replace(/\s*-\s*/g, ' – ').trim() || source;
}

function CaretDownIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m4.5 7 4.5 4 4.5-4" stroke="#131313" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CameraIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M5.4 2 6.6.6h4.8L12.6 2H16a1.4 1.4 0 0 1 1.4 1.4v8.2A1.4 1.4 0 0 1 16 13H2a1.4 1.4 0 0 1-1.4-1.4V3.4A1.4 1.4 0 0 1 2 2h3.4Z" fill="currentColor" /><circle cx="9" cy="7.4" r="2.6" fill="rgba(255,255,255,0.75)" /></svg>;
}

function TrashIcon() {
  return <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true"><path d="M2.4 3.2h10.2M5.5 3.2V2h4v1.2M4.2 4.4l.5 6.1h5.6l.5-6.1" stroke="#7A0E23" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MinusIcon() {
  return <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true"><path d="M2 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function ManualStepper() {
  const steps: { label: string; complete?: boolean; active?: boolean }[] = [
    { label: 'Datos', complete: true },
    { label: 'Tipo', complete: true },
    { label: 'Obs.', active: true },
    { label: 'Resumen' },
  ];

  return <div className="shrink-0 border-b border-[#E3E3E3] bg-white px-[14px] pb-[9px] pt-[10px]"><div className="flex items-center">{steps.map((step, index) => <div key={step.label} className="relative h-[35px] w-[83px] shrink-0">{index < steps.length - 1 ? <div className={`absolute left-[33px] top-[11px] h-[2px] ${index === 2 ? 'w-[81px]' : 'w-[73px]'} ${step.complete ? 'bg-[#C8A064]' : 'bg-[#D1D1D1]'}`} /> : null}<div className={`absolute left-[22.2px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold ${step.complete ? 'border-[1.5px] border-[#C8A064] bg-[#C8A064] text-white' : step.active ? 'border-2 border-[#C8A064] bg-white text-[#C8A064]' : 'border-[1.5px] border-[#D1D1D1] bg-white text-[#ACACAC]'}`}>{step.complete ? '✓' : index + 1}</div><p className={`absolute top-[25px] w-full text-center text-[8px] leading-[9.6px] ${step.complete || step.active ? 'font-semibold text-[#8E6E3E]' : 'text-[#ACACAC]'}`}>{step.label}</p></div>)}</div><div className="mt-[6px] h-[2px] w-full overflow-hidden rounded-[2px] bg-[#E3E3E3]"><div className="h-[2px] w-[249px] rounded-[2px] bg-gradient-to-r from-[#8E6E3E] to-[#C8A064]" /></div></div>;
}

function UploadBox({ value, label, subtitle, onPick }: { value: string | null; label: string; subtitle?: string; onPick: (name: string, file: File) => void }) {
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onPick(file.name, file);
  }

  if (value) {
    return <label className="flex min-h-[60px] w-full cursor-pointer items-center gap-[8px] rounded-[8px] bg-[#3A9B3A] px-[12px] py-[10px] text-white"><input type="file" className="hidden" accept="image/*" onChange={onChange} /><span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.25)]"><CameraIcon /></span><span className="truncate text-[12px] font-bold leading-none">{value}</span></label>;
  }

  return <label className="flex min-h-[108px] w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#D1D1D1] bg-[#F6FAFF] px-[16px] py-[24px] text-center"><input type="file" className="hidden" accept="image/*" onChange={onChange} /><span className="text-[28px] leading-none">📷</span><span className="mt-[6px] text-[13px] font-semibold leading-none text-[#646464]">{label}</span>{subtitle ? <span className="mt-[3px] text-[11px] leading-none text-[#ACACAC]">{subtitle}</span> : null}</label>;
}

function AnswerButton({ label, selected, tone, onPress }: { label: string; selected: boolean; tone: 'yes' | 'no' | 'na'; onPress: () => void }) {
  const selectedClass = tone === 'yes' ? 'border-[#3A9B3A] bg-[#3A9B3A] text-white' : tone === 'no' ? 'border-[#C4365A] bg-[#C4365A] text-white' : 'border-[#8A8A8A] bg-[#E6E8EA] text-[#131313]';
  return <button type="button" onClick={onPress} className={`flex h-[40px] flex-1 items-center justify-center rounded-[8px] border-[1.5px] px-[8px] text-[12px] font-bold leading-none ${selected ? selectedClass : 'border-[#D1D1D1] bg-[#F6FAFF] text-[#131313]'}`}>{label}</button>;
}

function SlaBox({ severity, slaLabel, onReassign }: { severity?: SeverityChoice; slaLabel?: string; onReassign: () => void }) {
  if (!severity) return <div className="mt-[12px] flex min-h-[64px] w-full items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[#E3E3E3] bg-[#F7F7F7] p-[15.5px]"><p className="text-center text-[12px] text-[#ACACAC]">Seleccione criticidad para calcular SLA</p></div>;
  return <div className="mt-[12px] flex min-h-[64px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#E8A06A] bg-[#FFE1CD] p-[15.5px]"><div><p className="text-[9px] font-bold uppercase leading-none tracking-[0.63px] text-[#333]">SLA calculado</p><p className="mt-[2px] text-[20px] font-bold leading-[20px] text-[#333]">{slaLabel ?? severity.closureTimeLabel}</p></div><button type="button" onClick={onReassign} className="h-[40px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-white px-[15.5px] text-[13px] font-semibold text-[#333]">Reasignar SLA</button></div>;
}

function SlaReassignSheet({ visible, calculatedLabel, severityLabel, onClose, onApply }: { visible: boolean; calculatedLabel: string; severityLabel?: string | null; onClose: () => void; onApply: (label: string) => void }) {
  const [days, setDays] = useState(0);
  const canApply = days > 0;

  useEffect(() => {
    if (visible) setDays(0);
  }, [visible]);

  if (!visible) return null;

  return <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1200] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-black/40" onClick={onClose}><div className="w-full rounded-t-[16px] bg-white px-[14px] pb-[24px] pt-[12px]" onClick={(event) => event.stopPropagation()}><div className="flex w-full flex-col items-center pt-[10px]"><div className="h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div><p className="mt-[24px] text-[14px] font-bold leading-none text-[#131313]">Reasignar SLA</p><div className="mt-[24px] grid gap-[8px]"><div className="grid gap-[8px] py-[9px]"><div className="flex items-center justify-between border-t border-[#E3E3E3] pb-[9px] pt-[10px]"><span className="text-[12px] font-medium text-[#646464]">SLA calculado</span><span className="text-[12px] font-bold text-[#131313]">{calculatedLabel}</span></div><div className="flex items-center justify-between border-y border-[#E3E3E3] py-[10px]"><span className="text-[12px] font-medium text-[#646464]">Criticidad</span><span className="rounded-[8px] bg-[#FFE1CD] px-[9px] py-[5px] text-[10px] font-bold leading-none text-[#532A0E]">{severityLabel ?? 'Alto'}</span></div></div><div className="rounded-[10px] border border-[#E3E3E3] bg-white px-[9px] py-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#646464]">Ingrese el nuevo SLA</p><div className="mt-[8px] flex gap-[8px]"><button type="button" className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[#E3E3E3] bg-white text-[#646464]" onClick={() => setDays((value) => Math.max(0, value - 1))}><MinusIcon /></button><div className="flex h-[50px] min-w-0 flex-1 items-center rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF]"><input type="number" min={0} value={days} onChange={(event) => setDays(Math.max(0, Number(event.target.value) || 0))} className="min-w-0 flex-1 bg-transparent text-center text-[14px] font-medium text-[#131313] outline-none" /><span className="pr-[12px] text-[14px] font-medium text-[#131313]">Días hábiles</span></div><button type="button" className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[#E3E3E3] bg-white text-[24px] font-light text-[#646464]" onClick={() => setDays((value) => value + 1)}>+</button></div><p className="mt-[2px] text-[11px] leading-[14.3px] text-[#ACACAC]">Este será el SLA final para esta observación</p></div></div><div className="mt-[24px] flex gap-[8px]"><button type="button" className="h-[44px] flex-1 rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064]" onClick={onClose}>Cancelar</button><button type="button" className={`h-[44px] flex-1 rounded-[14px] px-[12px] text-[15px] font-bold shadow-[0_2px_5px_rgba(200,160,100,0.3)] ${canApply ? 'bg-[#C8A064] text-white' : 'bg-[#D1D1D1] text-[#ACACAC]'}`} onClick={() => canApply && onApply(`${days} Días hábiles`)} disabled={!canApply}>Reasignar SLA</button></div></div></div>;
}

function CompanySelectionSheet({ visible, options, selectedId, loading, onClose, onSelect }: { visible: boolean; options: SelectSheetOption[]; selectedId?: string | null; loading?: boolean; onClose: () => void; onSelect: (option: SelectSheetOption) => void }) {
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return options;
    return options.filter((option) => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(value));
  }, [options, query]);

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  if (!visible) return null;

  return <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-[rgba(19,19,19,0.75)]" onClick={onClose}><div className="flex h-[705px] max-h-[88%] w-full flex-col rounded-t-[16px] bg-white px-[14px] pb-[24px] pt-[12px]" onClick={(event) => event.stopPropagation()}><div className="flex w-full flex-col items-center pt-[10px]"><div className="h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div><div className="mt-[24px] grid gap-[12px]"><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Seleccione la empresa</p><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ingrese nombre de la empresa" className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#131313]" /></div><div className="mt-[12px] min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-white p-[8px]">{loading ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">Cargando empresas...</p> : null}{!loading && filteredOptions.length === 0 ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">No hay empresas disponibles</p> : null}{!loading ? filteredOptions.map((option) => <button key={option.id} type="button" onClick={() => onSelect(option)} className={`flex min-h-[46.7px] w-full items-center rounded-[8px] px-[8px] py-[12px] text-left ${option.id === selectedId ? 'bg-[#F6FAFF]' : 'bg-white'}`}><span className="min-w-0 flex-1 text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.label}</span></button>) : null}</div></div></div>;
}

function PersonnelSelectionSheet({ visible, options, selectedIds, loading, onClose, onSave }: { visible: boolean; options: SelectSheetOption[]; selectedIds: string[]; loading?: boolean; onClose: () => void; onSave: (ids: string[]) => void }) {
  const [draftIds, setDraftIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setDraftIds(selectedIds);
  }, [selectedIds, visible]);

  function toggle(id: string) {
    setDraftIds((value) => value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  if (!visible) return null;

  return <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-[rgba(19,19,19,0.75)]" onClick={onClose}><div className="flex max-h-[76%] w-full flex-col overflow-hidden rounded-t-[16px] bg-white" onClick={(event) => event.stopPropagation()}><div className="flex w-full flex-col items-center px-[14px] py-[12px]"><div className="mt-[10px] h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div><div className="bg-white px-[14px] py-[12px]"><p className="text-[14px] font-bold leading-none text-[#131313]">Seleccione al personal encargado</p></div><div className="min-h-0 flex-1 overflow-y-auto bg-white p-[8px] shadow-[0_4px_8px_rgba(19,19,19,0.24)]">{loading ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">Cargando personal...</p> : null}{!loading && options.length === 0 ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">No hay personal disponible</p> : null}{!loading ? options.map((option) => { const selected = draftIds.includes(option.id); return <button key={option.id} type="button" onClick={() => toggle(option.id)} className="flex h-[40px] w-full items-center gap-[8px] rounded-[8px] bg-white px-[8px] py-[12px] text-left"><span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${selected ? 'border-[#C8A064] bg-[#C8A064] text-white' : 'border-[#131313] bg-white text-transparent'}`}>✓</span><span className="min-w-0 flex-1 truncate text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.label} - {option.description ?? 'Tipo de perfil'}</span></button>; }) : null}</div><div className="flex w-full gap-[8px] border-t border-[#E3E3E3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" className="h-[44px] flex-1 rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064]" onClick={onClose}>Cancelar</button><button type="button" className="h-[44px] flex-1 rounded-[14px] bg-[#C8A064] px-[12px] text-[15px] font-bold text-white shadow-[0_2px_5px_rgba(200,160,100,0.3)]" onClick={() => { onSave(draftIds); onClose(); }}>Guardar selección</button></div></div></div>;
}

function SummaryBox({ detail, severity, slaLabel, onDelete }: { detail: NewInspectionChecklistItemDetail; severity?: SeverityChoice; slaLabel?: string; onDelete: () => void }) {
  return <div className="mb-[10px] ml-[32px] mr-[12px] rounded-[10px] border-[1.5px] border-[#E3E3E3] bg-white p-[13.5px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between"><div className="flex items-center gap-[8px]"><span className="rounded-[6px] bg-[#E6F3FF] px-[8px] py-[3px] text-[11px] font-bold leading-none text-[#24588B]">Obs. 1</span>{severity ? <span className="rounded-[8px] bg-[#FFE1CD] px-[7px] py-[4px] text-[10px] font-bold leading-none text-[#532A0E]">{severity.label}</span> : null}</div><button type="button" onClick={onDelete} className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] border border-[#FFD0DB] bg-[#FFD0DB]"><TrashIcon /></button></div><div className="mt-[12px] grid gap-[4px]"><div className="rounded-[8px] border border-[#E3E3E3] bg-white px-[10px] py-[8px]"><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">Condición detectada</p><p className="mt-[4px] text-[12px] leading-[16.8px] text-[#131313]">{detail.detectedCondition || 'Sin descripción'}</p></div><div className="rounded-[8px] bg-[#F7F7F7] px-[10px] py-[8px]"><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">Medida correctiva propuesta</p><p className="mt-[4px] text-[12px] leading-[16.8px] text-[#131313]">{detail.correctiveAction || 'Sin medida correctiva'}</p></div>{detail.evidence ? <div className="border-t-[1.5px] border-[#C8A064] bg-[#FFFDF7] px-[10px] py-[9.5px]"><UploadBox value={detail.evidence.name} label="Tomar foto o galería" onPick={() => {}} /></div> : null}<div className="flex items-center justify-between border-t border-[#E3E3E3] px-[12px] pb-[9px] pt-[10px]"><span className="text-[12px] font-medium text-[#646464]">SLA calculado</span><span className="text-right text-[12px] font-bold text-[#131313]">{slaLabel ?? severity?.closureTimeLabel ?? 'xx días hábiles'}</span></div></div></div>;
}

function NoInitialForm({ detail, onDetail, onAdd }: { detail: NewInspectionChecklistItemDetail; onDetail: (patch: Partial<NewInspectionChecklistItemDetail>) => void; onAdd: () => void }) {
  return <div className="pb-[20px] pl-[32px] pr-[12px]"><p className="text-[13px] font-bold leading-[18px] text-[#C4365A]">Condición detectada / Plazo de corrección*</p><textarea className="mt-[8px] min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] placeholder:text-[#757575]" value={detail.detectedCondition ?? ''} onChange={(event) => onDetail({ detectedCondition: event.target.value })} placeholder="Describe la condición subestándar, su ubicación exacta y la norma que incumple..." /><p className="mt-[16px] text-[13px] font-bold leading-[18px] text-[#131313]">Presione el recuadro si la observación necesita registro de foto, medidas correctivas, criticidad y SLA. (Opcional)</p><button type="button" onClick={onAdd} className="mt-[12px] flex h-[48px] w-full items-center justify-center gap-[12px] rounded-[10px] border-2 border-dashed border-[#D1D1D1] bg-[#F6FAFF] text-[14px] font-bold text-[#24588B]"><span className="text-[26px] font-normal leading-none">+</span>Agregar registros</button></div>;
}

function NoExtendedForm({ detail, severity, slaLabel, severities, onDetail, onCancel, onSave, onOpenSeverity, onOpenSla }: { detail: NewInspectionChecklistItemDetail; severity?: SeverityChoice; slaLabel?: string; severities: SelectSheetOption[]; onDetail: (patch: Partial<NewInspectionChecklistItemDetail>) => void; onCancel: () => void; onSave: () => void; onOpenSeverity: () => void; onOpenSla: () => void }) {
  const canSave = Boolean(detail.detectedCondition?.trim() && detail.evidence && detail.correctiveAction?.trim() && severity);
  return <div className="pb-[20px] pl-[32px] pr-[12px]"><p className="text-[13px] font-bold leading-[18px] text-[#C4365A]">Condición detectada / Plazo de corrección*</p><textarea className="mt-[8px] min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] placeholder:text-[#757575]" value={detail.detectedCondition ?? ''} onChange={(event) => onDetail({ detectedCondition: event.target.value })} placeholder="Describe la condición subestándar, su ubicación exacta y la norma que incumple..." /><p className="mt-[16px] text-[13px] font-bold text-[#131313]">Fotografía "Antes" *</p><div className="mt-[8px]"><UploadBox value={detail.evidence?.name ?? null} label="Tomar foto o galería" subtitle="Fecha, hora y GPS automáticos" onPick={(name, file) => onDetail({ evidence: { name, file } })} /></div><p className="mt-[16px] text-[13px] font-bold text-[#131313]">Medidas correctivas propuestas</p><textarea className="mt-[8px] min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] placeholder:text-[#757575]" value={detail.correctiveAction ?? ''} onChange={(event) => onDetail({ correctiveAction: event.target.value })} placeholder="Qué debe hacer la EECC para corregir esta condición..." /><p className="mt-[16px] text-[18px] font-bold leading-[21.6px] text-[#131313]">Seleccione la criticidad</p><p className="mt-[4px] text-[12px] leading-[16.8px] text-[#646464]">Califica el riesgo global de esta visita · aplica a las observaciones registradas</p><button type="button" onClick={onOpenSeverity} className="mt-[12px] flex min-h-[50px] w-full items-center justify-between gap-[10px] rounded-[10px] border border-[#D1D1D1] bg-[#F6FAFF] px-[14px] py-[14px] text-left" disabled={severities.length === 0}><span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#131313]">{severity?.label ?? 'Seleccione'}</span><CaretDownIcon /></button><SlaBox severity={severity} slaLabel={slaLabel} onReassign={onOpenSla} /><div className="mt-[18px] flex gap-[10px]"><button type="button" onClick={onCancel} className="flex h-[44px] flex-1 items-center justify-center rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064]">Cancelar</button><button type="button" onClick={onSave} disabled={!canSave} className={`flex h-[44px] flex-1 items-center justify-center gap-[8px] rounded-[14px] px-[12px] text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(200,160,100,0.25)] ${canSave ? 'bg-[#C8A064]' : 'bg-[#D1D1D1]'}`}>✓ Guardar observación</button></div></div>;
}

function YesComment({ detail, onDetail }: { detail: NewInspectionChecklistItemDetail; onDetail: (patch: Partial<NewInspectionChecklistItemDetail>) => void }) {
  return <div className="pb-[10px] pl-[32px] pr-[12px]"><p className="text-[13px] font-bold text-[#131313]">Comentario (Opcional)</p><textarea className="mt-[6px] min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] placeholder:text-[#757575]" value={detail.comment ?? ''} onChange={(event) => onDetail({ comment: event.target.value })} placeholder="Describa una condición o comentario de mejora a modo de consideración si lo desea." /></div>;
}

function ChecklistItemCard({ item, index, answer, detail, severity, slaLabel, severities, editing, onAnswer, onDetail, onAddRecords, onCancelRecords, onSaveRecords, onDeleteRecords, onOpenSeverity, onOpenSla }: { item: ChecklistItemRow; index: number; answer: InspectionAnswerValue | undefined; detail: NewInspectionChecklistItemDetail; severity?: SeverityChoice; slaLabel?: string; severities: SelectSheetOption[]; editing: boolean; onAnswer: (value: InspectionAnswerValue) => void; onDetail: (patch: Partial<NewInspectionChecklistItemDetail>) => void; onAddRecords: () => void; onCancelRecords: () => void; onSaveRecords: () => void; onDeleteRecords: () => void; onOpenSeverity: () => void; onOpenSla: () => void }) {
  const isNo = answer === InspectionAnswerValue.NOT_COMPLIANT;
  const isYes = answer === InspectionAnswerValue.COMPLIANT;
  const hasRecords = Boolean(detail.evidence || detail.correctiveAction?.trim() || severity);
  const toneClass = isNo ? 'border-l-[#C4365A]' : isYes ? 'border-l-[#3A9B3A]' : answer === InspectionAnswerValue.NOT_APPLICABLE ? 'border-l-[#9CA3AF]' : 'border-l-transparent';
  return <div className={`border-b border-l-[3px] border-b-[#E3E3E3] ${toneClass}`}><div className="flex items-start px-[12px] pb-[6px] pt-[11px]"><span className="shrink-0 pt-px text-[10px] font-bold leading-none text-[#ACACAC]">{index + 1}</span><p className="ml-[2px] flex-1 text-[12px] leading-[18px] text-[#131313]">{item.question}</p></div><div className="flex gap-[6px] pb-[10px] pl-[32px] pr-[12px]"><AnswerButton label="SÍ" tone="yes" selected={isYes} onPress={() => onAnswer(InspectionAnswerValue.COMPLIANT)} /><AnswerButton label="NO" tone="no" selected={isNo} onPress={() => onAnswer(InspectionAnswerValue.NOT_COMPLIANT)} /><AnswerButton label="N/A" tone="na" selected={answer === InspectionAnswerValue.NOT_APPLICABLE} onPress={() => onAnswer(InspectionAnswerValue.NOT_APPLICABLE)} /></div>{isNo && !editing && hasRecords ? <SummaryBox detail={detail} severity={severity} slaLabel={slaLabel} onDelete={onDeleteRecords} /> : null}{isNo && !editing && !hasRecords ? <NoInitialForm detail={detail} onDetail={onDetail} onAdd={onAddRecords} /> : null}{isNo && editing ? <NoExtendedForm detail={detail} severity={severity} slaLabel={slaLabel} severities={severities} onDetail={onDetail} onCancel={onCancelRecords} onSave={onSaveRecords} onOpenSeverity={onOpenSeverity} onOpenSla={onOpenSla} /> : null}{isYes ? <YesComment detail={detail} onDetail={onDetail} /> : null}</div>;
}

function ProgressCard({ answeredCount, totalCount }: { answeredCount: number; totalCount: number }) {
  const width = totalCount ? `${(answeredCount / totalCount) * 100}%` : '0%';
  return <div className="rounded-[12px] border border-[#E3E3E3] bg-white px-[15px] py-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.05)]"><p className="text-[12px] font-bold leading-none text-[#131313]">{answeredCount} de {totalCount} respondidos</p><div className="mt-[8px] h-[6px] w-full overflow-hidden rounded-[4px] bg-[#E3E3E3]"><div className="h-[6px] rounded-[4px] bg-[#3A9B3A]" style={{ width }} /></div></div>;
}

function hasRequiredFindingDetail(detail: NewInspectionChecklistItemDetail | undefined) {
  return Boolean(detail?.detectedCondition?.trim());
}

export function ChecklistObservationsStep({ onBack, onNext }: ChecklistObservationsStepProps) {
  const user = useSessionStore((state) => state.user);
  const online = useOnlineStatus();
  const draft = useNewInspectionDraftStore();
  const setTemplate = useNewInspectionDraftStore((state) => state.setTemplate);
  const setAnswer = useNewInspectionDraftStore((state) => state.setAnswer);
  const setItemDetail = useNewInspectionDraftStore((state) => state.setItemDetail);
  const setGeneralPhoto = useNewInspectionDraftStore((state) => state.setGeneralPhoto);
  const setFindingCompany = useNewInspectionDraftStore((state) => state.setFindingCompany);
  const setFindingResponsibles = useNewInspectionDraftStore((state) => state.setFindingResponsibles);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [usersPickerOpen, setUsersPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [severityPickerItemId, setSeverityPickerItemId] = useState<string | null>(null);
  const [slaSheetItemId, setSlaSheetItemId] = useState<string | null>(null);
  const [severityByItemId, setSeverityByItemId] = useState<SeverityByItemId>({});
  const [slaByItemId, setSlaByItemId] = useState<SlaByItemId>({});
  const templatesQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'templates'], queryFn: getInspectionTemplates });
  const companiesQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'companies'], queryFn: getResponsibleCompanies });
  const severitiesQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'finding-severities'], queryFn: getInspectionFindingSeverities });
  const usersByCompanyQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'company-users', draft.findingCompanyId], queryFn: () => getCompanyUsers(draft.findingCompanyId ?? ''), enabled: Boolean(draft.findingCompanyId) });
  const templates = templatesQuery.data ?? [];
  const selectedTemplate = templates.find((template) => template.id === draft.templateId);
  const items = useMemo(() => getTemplateItems(selectedTemplate), [selectedTemplate]);
  const templateOptions = useMemo<SelectSheetOption[]>(() => templates.map((template) => ({ id: template.id, label: template.name, description: `${template.code} · ${getItemsCount(template)} ítems` })), [templates]);
  const companyOptions = useMemo<SelectSheetOption[]>(() => (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.name, description: company.code ?? undefined })), [companiesQuery.data]);
  const severityOptions = useMemo<SelectSheetOption[]>(() => (severitiesQuery.data ?? []).map((severity) => ({ id: severity.id, label: severity.name, description: severity.description })), [severitiesQuery.data]);
  const userOptions = useMemo<SelectSheetOption[]>(() => (usersByCompanyQuery.data ?? []).map((item) => ({ id: item.id, label: item.fullName, description: item.position ?? undefined })), [usersByCompanyQuery.data]);
  const selectedUsersLabel = draft.findingResponsibleIds.length > 0 ? `${draft.findingResponsibleIds.length} responsables seleccionados` : 'Seleccione personal';
  const answeredCount = items.filter((item) => Boolean(draft.answersByItemId[item.id])).length;
  const hasFindings = items.some((item) => draft.answersByItemId[item.id] === InspectionAnswerValue.NOT_COMPLIANT);
  const missingFindingDetails = items.some((item) => draft.answersByItemId[item.id] === InspectionAnswerValue.NOT_COMPLIANT && !hasRequiredFindingDetail(draft.detailsByItemId[item.id]));
  const canContinue = Boolean(selectedTemplate && draft.generalPhoto && items.length > 0 && answeredCount === items.length && !missingFindingDetails && !editingItemId && (!hasFindings || (draft.findingCompanyId && draft.findingResponsibleIds.length > 0)));
  const templateCode = draft.templateCode ?? selectedTemplate?.code ?? 'FR-00007';
  const templateItemsCount = draft.templateItemsCount ?? (selectedTemplate ? getItemsCount(selectedTemplate) : 15);
  const templateTitle = getTemplateTitle(selectedTemplate, draft.templateName);
  const activeSlaSeverity = slaSheetItemId ? severityByItemId[slaSheetItemId] : undefined;
  const activeSlaLabel = slaSheetItemId ? slaByItemId[slaSheetItemId] ?? activeSlaSeverity?.closureTimeLabel ?? 'SLA pendiente' : 'SLA pendiente';

  function selectTemplate(option: SelectSheetOption) {
    const template = templates.find((item) => item.id === option.id);
    if (!template) return;
    setTemplate({ id: template.id, name: template.name, code: template.code, itemsCount: getItemsCount(template) });
    setTemplatePickerOpen(false);
    setEditingItemId(null);
    setSeverityByItemId({});
    setSlaByItemId({});
  }

  function selectCompany(option: SelectSheetOption) {
    setFindingCompany(option.id, option.label);
    setCompanyPickerOpen(false);
    setUsersPickerOpen(false);
  }

  function selectSeverity(option: SelectSheetOption) {
    if (!severityPickerItemId) return;
    const severity = severitiesQuery.data?.find((item) => item.id === option.id);
    setSeverityByItemId((current) => ({ ...current, [severityPickerItemId]: { id: option.id, label: option.label, closureTimeLabel: severity?.closureTimeLabel ?? 'SLA pendiente' } }));
    setSlaByItemId((current) => ({ ...current, [severityPickerItemId]: undefined }));
    setSeverityPickerItemId(null);
  }

  return <><div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-full items-center gap-[4px] px-[4px]"><button type="button" className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[28px] text-[rgba(255,255,255,0.92)]" onClick={onBack}>‹</button><div className="min-w-0 flex-1 px-[4px]"><p className="truncate text-[14px] font-semibold leading-[17px] text-white">Observaciones</p><p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">Paso 3 de 5</p></div><div className="flex h-[20px] w-[56px] items-center justify-center rounded-[16px] bg-[#C8A064]"><span className="text-[10px] font-bold leading-none text-[#001E39]">GF HSE</span></div></div></div>{!online || !user ? <div className="flex h-[23px] shrink-0 items-center gap-[7px] border-b border-[#C8A064] bg-[#2A1A04] px-[16px] pb-[6px] pt-[5px]"><span className="text-[11px] font-semibold leading-none text-[#C8A064]">Sin red · guardando localmente</span></div> : null}<ManualStepper /><div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-[14px] pb-[16px] pt-[14px]"><div className="grid gap-[12px]"><div><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Checklist normativo</p><p className="mt-[4px] w-[332px] text-[12px] leading-[16.8px] text-[#646464]">Responde todos los ítems · los NO quedarán registrados como observaciones</p></div><div className="rounded-[12px] border-[1.5px] border-[#E3E3E3] bg-white p-[15.5px] shadow-[0_1px_1.5px_rgba(0,0,0,0.05)]"><p className="text-[13px] font-bold leading-none text-[#131313]">Seleccione la plantilla *</p><button type="button" onClick={() => setTemplatePickerOpen(true)} className="mt-[6px] flex min-h-[50px] w-full items-center justify-between gap-[10px] rounded-[10px] border border-[#D1D1D1] bg-[#F6FAFF] px-[14px] py-[14px] text-left" disabled={templatesQuery.isLoading}><span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#131313]">{templatesQuery.isLoading ? 'Cargando plantillas...' : draft.templateName ?? 'Seleccione'}</span><CaretDownIcon /></button><div className="mt-[12px] flex h-[13px] items-center gap-[8px]"><span className="text-[11px] text-[#646464]"># {templateCode}</span><span className="text-[11px] text-[#646464]">☷ {templateItemsCount} ítems</span></div></div>{selectedTemplate ? <ProgressCard answeredCount={answeredCount} totalCount={items.length} /> : null}{selectedTemplate ? <UploadBox value={draft.generalPhoto?.name ?? null} label="Tomar foto o galería" subtitle="Fecha, hora y GPS automáticos" onPick={(name, file) => setGeneralPhoto({ name, file })} /> : null}{selectedTemplate ? <div className="min-h-px w-full overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"><div className="flex items-center justify-between bg-[#001E39] px-[14px] py-[10px]"><p className="truncate text-[12px] font-bold leading-none text-white">{templateTitle}</p><p className="ml-[10px] shrink-0 text-[10px] font-normal leading-none text-[rgba(255,255,255,0.45)]">{templateCode}</p></div>{items.map((item, index) => <ChecklistItemCard key={item.id} item={item} index={index} answer={draft.answersByItemId[item.id]} detail={draft.detailsByItemId[item.id] ?? {}} severity={severityByItemId[item.id]} slaLabel={slaByItemId[item.id]} severities={severityOptions} editing={editingItemId === item.id} onAnswer={(value) => { setAnswer(item.id, value); if (value === InspectionAnswerValue.NOT_COMPLIANT) setEditingItemId(null); }} onDetail={(patch) => setItemDetail(item.id, patch)} onAddRecords={() => setEditingItemId(item.id)} onCancelRecords={() => setEditingItemId(null)} onSaveRecords={() => setEditingItemId(null)} onDeleteRecords={() => { setItemDetail(item.id, { correctiveAction: '', evidence: null }); setSeverityByItemId((current) => ({ ...current, [item.id]: undefined })); setSlaByItemId((current) => ({ ...current, [item.id]: undefined })); }} onOpenSeverity={() => setSeverityPickerItemId(item.id)} onOpenSla={() => setSlaSheetItemId(item.id)} />)}</div> : null}{hasFindings ? <div className="rounded-[12px] border border-[#E1E1E1] bg-white p-[14px]"><p className="text-[18px] font-bold text-[#131313]">Responsables</p><p className="mt-[8px] text-[13px] font-bold text-[#131313]">Empresa encargada de los hallazgos</p><button type="button" onClick={() => setCompanyPickerOpen(true)} className="mt-[4px] flex h-[50px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[12px]"><span className="truncate text-[14px] font-medium text-[#131313]">{draft.findingCompanyName ?? 'Seleccione empresa'}</span><CaretDownIcon /></button><p className="mt-[10px] text-[13px] font-bold text-[#131313]">Personal encargado de los hallazgos</p><button type="button" onClick={() => setUsersPickerOpen(true)} disabled={!draft.findingCompanyId} className="mt-[4px] flex h-[50px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[12px] disabled:opacity-70"><span className="truncate text-[14px] font-medium text-[#131313]">{selectedUsersLabel}</span><CaretDownIcon /></button></div> : null}</div></div><div className="shrink-0 border-t border-[#E3E3E3] bg-white pb-[8px] pt-[10px]"><div className="flex w-full gap-[10px] px-[14px]"><button type="button" className="!flex !h-[50px] !w-auto !min-w-0 !shrink-0 !items-center !justify-center !gap-[8px] !rounded-[14px] !border-[2px] !border-[#C8A064] !bg-white !px-[20px] !text-[14px] !font-bold !text-[#C8A064]" onClick={onBack}>← Atrás</button><button type="button" className={`!flex !h-[50px] !w-auto !min-w-0 !flex-1 !items-center !justify-center !gap-[8px] !rounded-[14px] !text-[14px] !font-bold ${canContinue ? '!bg-[#C8A064] !text-white !shadow-[0_2px_4px_rgba(200,160,100,0.25)]' : '!bg-[#D1D1D1] !text-[#ACACAC] !shadow-none'}`} onClick={onNext} disabled={!canContinue}>Continuar →</button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div><SelectSheet visible={templatePickerOpen} title="Seleccionar plantilla" subtitle="Catálogo online/cache local" options={templateOptions} selectedId={draft.templateId} loading={templatesQuery.isLoading} emptyText="No hay plantillas disponibles" onClose={() => setTemplatePickerOpen(false)} onSelect={selectTemplate} /><CompanySelectionSheet visible={companyPickerOpen} options={companyOptions} selectedId={draft.findingCompanyId} loading={companiesQuery.isLoading} onClose={() => setCompanyPickerOpen(false)} onSelect={selectCompany} /><PersonnelSelectionSheet visible={usersPickerOpen} options={userOptions} selectedIds={draft.findingResponsibleIds} loading={usersByCompanyQuery.isLoading} onClose={() => setUsersPickerOpen(false)} onSave={setFindingResponsibles} /><SelectSheet visible={Boolean(severityPickerItemId)} title="Seleccionar criticidad" options={severityOptions} selectedId={severityPickerItemId ? severityByItemId[severityPickerItemId]?.id : undefined} loading={severitiesQuery.isLoading} emptyText="No hay criticidades disponibles" onClose={() => setSeverityPickerItemId(null)} onSelect={selectSeverity} /><SlaReassignSheet visible={Boolean(slaSheetItemId)} calculatedLabel={activeSlaLabel} severityLabel={activeSlaSeverity?.label} onClose={() => setSlaSheetItemId(null)} onApply={(label) => { if (slaSheetItemId) setSlaByItemId((current) => ({ ...current, [slaSheetItemId]: label })); setSlaSheetItemId(null); }} /></>;
}
