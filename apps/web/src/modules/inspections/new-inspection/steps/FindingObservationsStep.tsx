import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { SelectSheet, type SelectSheetOption } from '../components/SelectSheet';
import {
  type NewInspectionFindingObservationDraft,
  useNewInspectionDraftStore,
} from '../state/newInspectionDraft.store';
import {
  getCompanyUsers,
  getResponsibleCompanies,
  getInspectionFindingSeverities,
  getInspectionFindingTypes,
} from '../../../../shared/services/inspections.service';

interface FindingObservationsStepProps {
  onBack: () => void;
  onNext: () => void;
}

type FindingPicker = 'finding-type' | 'severity' | 'company' | 'users' | null;

function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

function findSeverityLabel(optionId: string, options: SelectSheetOption[]) {
  return options.find((item) => item.id === optionId)?.label ?? null;
}

function pluralizeObservation(count: number) {
  return count === 1 ? '1 observación' : `${count} observaciones`;
}

function BackIcon() {
  return <svg width="23" height="19" viewBox="0 0 23 19" fill="none" aria-hidden="true"><path d="M9.5 1.75 1.75 9.5l7.75 7.75M2.5 9.5h18.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function OfflineIcon() {
  return <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true"><path d="m1 1 11 9M2.2 4.1c2.5-1.8 5.8-1.8 8.3 0M4.5 6.1c1.2-.7 2.7-.7 3.9 0" stroke="#C8A064" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function ArrowLeftIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M17 7H2M7.5 1.5 2 7l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ArrowRightIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M1 7h15M10.5 1.5 16 7l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CaretDownIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m4.5 7 4.5 4 4.5-4" stroke="#131313" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PlusIcon() {
  return <svg width="17" height="14" viewBox="0 0 17 14" fill="none" aria-hidden="true"><path d="M8.5 2.5v9M4 7h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function CheckIcon() {
  return <svg width="16" height="13" viewBox="0 0 16 13" fill="none" aria-hidden="true"><path d="m2 6.6 3.6 3.6L14 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CameraIcon() {
  return <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M5.4 2 6.6.6h4.8L12.6 2H16a1.4 1.4 0 0 1 1.4 1.4v8.2A1.4 1.4 0 0 1 16 13H2a1.4 1.4 0 0 1-1.4-1.4V3.4A1.4 1.4 0 0 1 2 2h3.4Z" fill="currentColor" /><circle cx="9" cy="7.4" r="2.6" fill="rgba(255,255,255,0.75)" /></svg>;
}

function TrashIcon() {
  return <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true"><path d="M2.4 3.2h10.2M5.5 3.2V2h4v1.2M4.2 4.4l.5 6.1h5.6l.5-6.1" stroke="#7A0E23" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ObservationIcon() {
  return <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true"><path d="M7.5 1.2a5.3 5.3 0 1 0 0 10.6 5.3 5.3 0 0 0 0-10.6Zm0 2.8v3.1M7.5 9h.01" stroke="#8E6E3E" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function MinusIcon() {
  return <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true"><path d="M2 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function ManualStepper() {
  const steps = [
    { label: 'Datos', complete: true, active: false },
    { label: 'Tipo', complete: true, active: false },
    { label: 'Obs.', complete: false, active: true },
    { label: 'Resumen', complete: false, active: false },
  ];

  return (
    <div className="shrink-0 border-b border-[#E3E3E3] bg-white px-[14px] pb-[9px] pt-[10px]">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.label} className="relative h-[35px] w-[83px] shrink-0">
            {index < steps.length - 1 ? <div className={`absolute left-[33px] top-[11px] h-[2px] ${index === 2 ? 'w-[81px]' : 'w-[73px]'} ${step.complete ? 'bg-[#C8A064]' : 'bg-[#D1D1D1]'}`} /> : null}
            <div className={`absolute left-[22.2px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold ${step.complete ? 'border-[1.5px] border-[#C8A064] bg-[#C8A064] text-white' : step.active ? 'border-[2px] border-[#C8A064] bg-white text-[#C8A064]' : 'border-[1.5px] border-[#D1D1D1] bg-white text-[#ACACAC]'}`}>{step.complete ? '✓' : index + 1}</div>
            <p className={`absolute top-[25px] w-full text-center text-[8px] leading-[9.6px] ${step.complete || step.active ? 'font-semibold text-[#8E6E3E]' : 'text-[#ACACAC]'}`}>{step.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-[6px] h-[2px] w-full overflow-hidden rounded-[2px] bg-[#E3E3E3]"><div className="h-[2px] w-[249px] rounded-[2px] bg-gradient-to-r from-[#8E6E3E] to-[#C8A064]" /></div>
    </div>
  );
}

function InfoNotice({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[48px] w-full items-center gap-[12px] rounded-[12px] bg-[#4A90C4] py-[12px] pl-[14px] pr-[12px] text-white"><span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#4A90C4]">i</span><span className="text-[13px] font-bold leading-[16.9px]">{children}</span></div>;
}

function FieldLabel({ children }: { children: string }) {
  return <p className="text-[13px] font-bold leading-[15.5px] text-[#131313]">{children}</p>;
}

function SavedTextBlock({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div className={`${muted ? 'bg-[#F7F7F7]' : 'border border-[#E3E3E3] bg-white'} rounded-[8px] px-[10px] py-[8px]`}><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">{label}</p><p className="mt-[4px] text-[12px] leading-[16.8px] text-[#131313]">{value}</p></div>;
}

function PhotoUpload({ evidence, onChange }: { evidence: NewInspectionFindingObservationDraft['evidence']; onChange: (asset: NonNullable<NewInspectionFindingObservationDraft['evidence']>) => void }) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange({ name: file.name, file });
  }

  if (evidence) {
    return (
      <label className="flex min-h-[60px] w-full cursor-pointer items-center gap-[8px] rounded-[8px] bg-[#3A9B3A] px-[12px] py-[10px] text-white">
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.25)] text-white"><CameraIcon /></span>
        <span className="truncate text-[12px] font-bold leading-none">{evidence.name}</span>
      </label>
    );
  }

  return (
    <label className="flex min-h-[108px] w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#D1D1D1] bg-[#F6FAFF] px-[16px] py-[24px] text-center">
      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      <span className="text-[28px] leading-none">📷</span>
      <span className="mt-[6px] text-[13px] font-semibold leading-none text-[#646464]">Tomar foto o galería</span>
      <span className="mt-[3px] text-[11px] leading-none text-[#ACACAC]">Fecha, hora y GPS automáticos</span>
    </label>
  );
}

function CompanySearchSheet({
  visible,
  options,
  selectedId,
  loading,
  onClose,
  onSelect,
}: {
  visible: boolean;
  options: SelectSheetOption[];
  selectedId?: string | null;
  loading?: boolean;
  onClose: () => void;
  onSelect: (option: SelectSheetOption) => void;
}) {
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

  return (
    <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-[rgba(19,19,19,0.75)]" onClick={onClose}>
      <div className="flex h-[705px] max-h-[88%] w-full flex-col rounded-t-[16px] bg-white px-[14px] pb-[24px] pt-[12px]" onClick={(event) => event.stopPropagation()}>
        <div className="flex w-full flex-col items-center pt-[10px]"><div className="h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div>
        <div className="mt-[24px] grid gap-[12px]">
          <p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Seleccione la empresa</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ingrese nombre de la empresa"
            className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#131313]"
          />
        </div>
        <div className="mt-[12px] min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-white p-[8px]">
          {loading ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">Cargando empresas...</p> : null}
          {!loading && filteredOptions.length === 0 ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">No hay empresas disponibles</p> : null}
          {!loading ? filteredOptions.map((option) => <button key={option.id} type="button" onClick={() => onSelect(option)} className={`flex min-h-[46.7px] w-full items-center rounded-[8px] px-[8px] py-[12px] text-left ${option.id === selectedId ? 'bg-[#F6FAFF]' : 'bg-white'}`}><span className="min-w-0 flex-1 text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.label}</span></button>) : null}
        </div>
      </div>
    </div>
  );
}

function PersonnelSelectionSheet({
  visible,
  options,
  selectedIds,
  loading,
  onClose,
  onSave,
}: {
  visible: boolean;
  options: SelectSheetOption[];
  selectedIds: string[];
  loading?: boolean;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [draftIds, setDraftIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setDraftIds(selectedIds);
  }, [selectedIds, visible]);

  function toggle(id: string) {
    setDraftIds((value) => value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-[rgba(19,19,19,0.75)]" onClick={onClose}>
      <div className="flex max-h-[76%] w-full flex-col overflow-hidden rounded-t-[16px] bg-white" onClick={(event) => event.stopPropagation()}>
        <div className="flex w-full flex-col items-center px-[14px] py-[12px]"><div className="mt-[10px] h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div>
        <div className="bg-white px-[14px] py-[12px]"><p className="text-[14px] font-bold leading-none text-[#131313]">Seleccione al personal encargado</p></div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-[8px] shadow-[0_4px_8px_rgba(19,19,19,0.24)]">
          {loading ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">Cargando personal...</p> : null}
          {!loading && options.length === 0 ? <p className="px-[8px] py-[12px] text-[14px] leading-[22.7px] tracking-[0.28px] text-[#646464]">No hay personal disponible</p> : null}
          {!loading ? options.map((option) => {
            const selected = draftIds.includes(option.id);
            return <button key={option.id} type="button" onClick={() => toggle(option.id)} className="flex h-[40px] w-full items-center gap-[8px] rounded-[8px] bg-white px-[8px] py-[12px] text-left"><span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${selected ? 'border-[#C8A064] bg-[#C8A064] text-white' : 'border-[#131313] bg-white text-transparent'}`}>✓</span><span className="min-w-0 flex-1 truncate text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">{option.label} - {option.description ?? 'Tipo de perfil'}</span></button>;
          }) : null}
        </div>
        <div className="flex w-full gap-[8px] border-t border-[#E3E3E3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" className="h-[44px] flex-1 rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064]" onClick={onClose}>Cancelar</button><button type="button" className="h-[44px] flex-1 rounded-[14px] bg-[#C8A064] px-[12px] text-[15px] font-bold text-white shadow-[0_2px_5px_rgba(200,160,100,0.3)]" onClick={() => { onSave(draftIds); onClose(); }}>Guardar selección</button></div>
      </div>
    </div>
  );
}

function SlaReassignSheet({
  visible,
  calculatedLabel,
  severityLabel,
  onClose,
  onApply,
}: {
  visible: boolean;
  calculatedLabel: string;
  severityLabel: string | null | undefined;
  onClose: () => void;
  onApply: (label: string) => void;
}) {
  const [days, setDays] = useState(0);
  const canApply = days > 0;

  useEffect(() => {
    if (visible) setDays(0);
  }, [visible]);

  function apply() {
    if (!canApply) return;
    onApply(`${days} días hábiles`);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1200] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-black/40" onClick={onClose}>
      <div className="w-full rounded-t-[16px] bg-white px-[14px] pb-[24px] pt-[12px]" onClick={(event) => event.stopPropagation()}>
        <div className="flex w-full flex-col items-center pt-[10px]"><div className="h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]" /></div>
        <p className="mt-[24px] w-full text-[14px] font-bold leading-none text-[#131313]">Reasignar SLA</p>
        <div className="mt-[24px] grid w-full gap-[8px]">
          <div className="grid w-full gap-[8px] py-[9px]">
            <div className="flex items-center justify-between border-t border-[#E3E3E3] pb-[9px] pt-[10px]"><span className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</span><span className="text-right text-[12px] font-bold leading-none text-[#131313]">{calculatedLabel}</span></div>
            <div className="flex items-center justify-between border-y border-[#E3E3E3] py-[10px]"><span className="text-[12px] font-medium leading-none text-[#646464]">Criticidad</span><span className="rounded-[8px] bg-[#FFE1CD] px-[9px] py-[5px] text-[10px] font-bold leading-none text-[#532A0E]">{severityLabel ?? 'Alto'}</span></div>
          </div>
          <div className="w-full rounded-[10px] border border-[#E3E3E3] bg-white px-[9px] py-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
            <p className="text-[10px] font-bold uppercase leading-none tracking-[0.6px] text-[#646464]">Ingrese el nuevo SLA</p>
            <div className="mt-[8px] flex w-full items-end gap-[8px]">
              <button type="button" className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[#E3E3E3] bg-white text-[#646464]" onClick={() => setDays((value) => Math.max(0, value - 1))}><MinusIcon /></button>
              <div className="min-w-0 flex-1 pt-[6px]"><input type="number" min={0} value={days} onChange={(event) => setDays(Math.max(0, Number(event.target.value) || 0))} className="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] text-center text-[14px] font-medium text-[#131313] outline-none" aria-label="Nuevo SLA en días hábiles" /></div>
              <button type="button" className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-[#E3E3E3] bg-white text-[24px] font-light leading-none text-[#646464]" onClick={() => setDays((value) => value + 1)}>+</button>
            </div>
            <p className="mt-[2px] text-[11px] leading-[14.3px] text-[#ACACAC]">Este será el SLA final para esta observación</p>
          </div>
        </div>
        <div className="mt-[24px] flex w-full gap-[8px]"><button type="button" className="h-[44px] flex-1 rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064]" onClick={onClose}>Cancelar</button><button type="button" className={`h-[44px] flex-1 rounded-[14px] px-[12px] text-[15px] font-bold shadow-[0_2px_5px_rgba(200,160,100,0.3)] ${canApply ? 'bg-[#C8A064] text-white' : 'bg-[#D1D1D1] text-[#ACACAC]'}`} onClick={apply} disabled={!canApply}>Reasignar SLA</button></div>
      </div>
    </div>
  );
}

function ObservationCard({ observation, index, severityOptions, onOpenSeverity, onChange, onSave, onRemove }: { observation: NewInspectionFindingObservationDraft; index: number; severityOptions: SelectSheetOption[]; onOpenSeverity: () => void; onChange: (patch: Partial<Omit<NewInspectionFindingObservationDraft, 'id'>>) => void; onSave: () => void; onRemove: () => void }) {
  const [slaSheetOpen, setSlaSheetOpen] = useState(false);
  const complete = Boolean(observation.detectedCondition.trim() && observation.correctiveAction.trim() && observation.evidence && observation.severityId);
  const slaLabel = observation.severityClosureTimeLabel ?? findSeverityLabel(observation.severityId ?? '', severityOptions) ?? '5 días hábiles';

  return (
    <div className="w-full rounded-[12px] border-[1.5px] border-[#C8A064] bg-white p-[15.5px] shadow-[0_2px_4px_rgba(200,160,100,0.15)]">
      <div className="flex items-center gap-[6px]"><ObservationIcon /><p className="text-[12px] font-bold uppercase leading-none tracking-[0.6px] text-[#8E6E3E]">Nueva observación {index + 1}</p></div>
      <div className="mt-[10px] grid gap-[10px]">
        <div className="grid gap-[6px]"><FieldLabel>Condición detectada *</FieldLabel><textarea className="min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#757575]" placeholder="Describe la condición subestándar, su ubicación exacta y la norma que incumple..." value={observation.detectedCondition} onChange={(event) => onChange({ detectedCondition: event.target.value })} /></div>
        <div className="grid gap-[6px]"><FieldLabel>Fotografía "Antes" *</FieldLabel><PhotoUpload evidence={observation.evidence} onChange={(evidence) => onChange({ evidence })} /></div>
        <div className="grid gap-[6px]"><FieldLabel>Medidas correctivas propuestas</FieldLabel><textarea className="min-h-[80px] w-full resize-none rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[15.5px] py-[14.5px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#757575]" placeholder="Qué debe hacer la EECC para corregir esta condición..." value={observation.correctiveAction} onChange={(event) => onChange({ correctiveAction: event.target.value })} /></div>
        <div className="grid gap-[10px]"><div><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Seleccione la criticidad</p><p className="mt-[4px] text-[12px] leading-[16.8px] text-[#646464]">Califica el riesgo global de esta visita · aplica a las observaciones registradas</p></div><button type="button" onClick={onOpenSeverity} className="flex h-[48px] w-full items-end justify-between rounded-[10px] border border-[#D1D1D1] bg-[#F6FAFF] px-[14px] py-[15px]"><span className="truncate text-[14px] font-medium leading-none text-[#131313]">{observation.severityLabel ?? 'Seleccione'}</span><CaretDownIcon /></button>{observation.severityId ? <div className="flex min-h-[64px] items-center justify-between rounded-[10px] border-[1.5px] border-[#E8A06A] bg-[#FFE1CD] p-[15.5px]"><div><p className="text-[9px] font-bold uppercase leading-none tracking-[0.63px] text-[#333]">SLA calculado</p><p className="mt-[2px] text-[20px] font-bold leading-[20px] text-[#333]">{slaLabel}</p></div><button type="button" className="h-[40px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-white px-[15.5px] text-[13px] font-semibold text-[#333]" onClick={() => setSlaSheetOpen(true)}>Reasignar SLA</button></div> : <div className="flex min-h-[64px] items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[#E3E3E3] bg-[#F7F7F7] p-[15.5px]"><p className="text-center text-[12px] text-[#ACACAC]">Seleccione criticidad para calcular SLA</p></div>}</div>
        <div className="flex h-[48px] gap-[8px] pt-[4px]"><button type="button" onClick={onRemove} className="h-[44px] flex-1 rounded-[14px] border-2 border-[#C8A064] bg-white px-[20px] text-[13px] font-bold text-[#C8A064]">Cancelar</button><button type="button" onClick={onSave} disabled={!complete} className={`flex h-[44px] items-center justify-center gap-[8px] rounded-[14px] px-[12px] text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(200,160,100,0.25)] ${complete ? 'bg-[#C8A064]' : 'bg-[#D1D1D1]'}`}><CheckIcon />Guardar observación</button></div>
      </div>
      <SlaReassignSheet visible={slaSheetOpen} calculatedLabel={slaLabel} severityLabel={observation.severityLabel} onClose={() => setSlaSheetOpen(false)} onApply={(label) => { onChange({ severityClosureTimeLabel: label }); setSlaSheetOpen(false); }} />
    </div>
  );
}

function SavedObservationCard({ observation, index, onRemove }: { observation: NewInspectionFindingObservationDraft; index: number; onRemove: () => void }) {
  return (
    <div className="w-full rounded-[10px] border-[1.5px] border-[#E3E3E3] bg-white p-[13.5px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between"><div className="flex items-center gap-[8px]"><span className="rounded-[6px] bg-[#E6F3FF] px-[8px] py-[3px] text-[11px] font-bold leading-none text-[#24588B]">Obs. {index + 1}</span><span className="rounded-[8px] bg-[#FFE1CD] px-[7px] py-[4px] text-[10px] font-bold leading-none text-[#532A0E]">{observation.severityLabel ?? 'Moderado'}</span></div><button type="button" onClick={onRemove} className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] border border-[#FFD0DB] bg-[#FFD0DB]"><TrashIcon /></button></div>
      <div className="mt-[12px] grid gap-[4px]"><SavedTextBlock label="Condición detectada" value={observation.detectedCondition || 'Sin descripción'} /><SavedTextBlock label="Medida correctiva propuesta" value={observation.correctiveAction || 'Sin medida correctiva'} muted />{observation.evidence ? <div className="border-t-[1.5px] border-[#C8A064] bg-[#FFFDF7] px-[10px] py-[9.5px]"><div className="flex min-h-[60px] items-center gap-[8px] rounded-[8px] bg-[#3A9B3A] px-[12px] py-[10px] text-white"><span className="flex h-[40px] w-[40px] items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.25)]"><CameraIcon /></span><span className="truncate text-[12px] font-bold">{observation.evidence.name}</span></div></div> : null}<div className="flex items-center justify-between border-t border-[#E3E3E3] px-[12px] pb-[9px] pt-[10px]"><span className="text-[12px] font-medium text-[#646464]">SLA calculado</span><span className="text-right text-[12px] font-bold text-[#131313]">{observation.severityClosureTimeLabel ?? 'xx días hábiles'}</span></div></div>
    </div>
  );
}

export function FindingObservationsStep({ onBack, onNext }: FindingObservationsStepProps) {
  const user = useSessionStore((state) => state.user);
  const online = useOnlineStatus();
  const draft = useNewInspectionDraftStore();
  const [picker, setPicker] = useState<FindingPicker>(null);
  const [observationIdForSeverity, setObservationIdForSeverity] = useState<string | null>(null);
  const setFindingType = useNewInspectionDraftStore((state) => state.setFindingType);
  const addFindingObservation = useNewInspectionDraftStore((state) => state.addFindingObservation);
  const updateFindingObservation = useNewInspectionDraftStore((state) => state.updateFindingObservation);
  const removeFindingObservation = useNewInspectionDraftStore((state) => state.removeFindingObservation);
  const setFindingCompany = useNewInspectionDraftStore((state) => state.setFindingCompany);
  const setFindingResponsibles = useNewInspectionDraftStore((state) => state.setFindingResponsibles);

  const findingTypesQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'finding-types'], queryFn: getInspectionFindingTypes });
  const severitiesQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'finding-severities'], queryFn: getInspectionFindingSeverities });
  const companiesQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'companies'], queryFn: getResponsibleCompanies });
  const usersByCompanyQuery = useQuery({ queryKey: ['inspections', 'new-inspection', 'company-users', draft.findingCompanyId], queryFn: () => getCompanyUsers(draft.findingCompanyId ?? ''), enabled: Boolean(draft.findingCompanyId) });
  const findingTypeOptions = useMemo<SelectSheetOption[]>(() => (findingTypesQuery.data ?? []).map((item) => ({ id: item.id, label: item.name })), [findingTypesQuery.data]);
  const severityOptions = useMemo<SelectSheetOption[]>(() => (severitiesQuery.data ?? []).map((item) => ({ id: item.id, label: item.name, description: item.description })), [severitiesQuery.data]);
  const companyOptions = useMemo<SelectSheetOption[]>(() => (companiesQuery.data ?? []).map((item) => ({ id: item.id, label: item.name, description: item.code ?? undefined })), [companiesQuery.data]);
  const userOptions = useMemo<SelectSheetOption[]>(() => (usersByCompanyQuery.data ?? []).map((item) => ({ id: item.id, label: item.fullName, description: item.position ?? undefined })), [usersByCompanyQuery.data]);

  function onSelectFindingType(option: SelectSheetOption) {
    setFindingType(option.id, option.label);
    setPicker(null);
  }

  function onSelectCompany(option: SelectSheetOption) {
    setFindingCompany(option.id, option.label);
    setPicker(null);
  }

  function onSelectSeverity(option: SelectSheetOption) {
    if (!observationIdForSeverity) return;
    const catalogSeverity = severitiesQuery.data?.find((item) => item.id === option.id);
    updateFindingObservation(observationIdForSeverity, {
      severityId: option.id,
      severityLabel: option.label,
      severityClosureTimeLabel: catalogSeverity?.closureTimeLabel ?? null,
    });
    setPicker(null);
    setObservationIdForSeverity(null);
  }

  function addObservation() {
    if (!draft.findingTypeId) return;
    addFindingObservation();
  }

  const savedObservations = draft.findingObservations.filter((item) => item.saved);
  const activeObservations = draft.findingObservations.filter((item) => !item.saved);
  const hasSavedObservation = savedObservations.length > 0;
  const hasActiveObservation = activeObservations.length > 0;
  const showFindingTypeSelector = !hasSavedObservation;
  const canContinue = Boolean(hasSavedObservation && draft.findingCompanyId && draft.findingResponsibleIds.length > 0);
  const showOfflineBanner = !online || !user;
  const addObservationEnabled = Boolean(draft.findingTypeId);

  return (
    <>
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-full items-center gap-[4px] px-[4px]"><button type="button" className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.92)]" onClick={onBack} aria-label="Atrás"><BackIcon /></button><div className="min-w-0 flex-1 px-[4px]"><p className="truncate text-[14px] font-semibold leading-[17px] text-white">Observaciones</p><p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">Paso 3 de 5</p></div><div className="pr-[4px]"><div className="flex h-[20px] w-[56px] items-center justify-center rounded-[16px] bg-[#C8A064]"><span className="text-[10px] font-bold leading-none text-[#001E39]">GF HSE</span></div></div></div></div>
      {showOfflineBanner ? <div className="flex h-[23px] shrink-0 items-center gap-[7px] border-b border-[#C8A064] bg-[#2A1A04] px-[16px] pb-[6px] pt-[5px]"><OfflineIcon /><span className="text-[11px] font-semibold leading-none text-[#C8A064]">Sin red · guardando localmente</span></div> : null}
      <ManualStepper />
      <div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-[14px] pb-[16px] pt-[14px]">
        {showFindingTypeSelector ? <><div><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Tipo de hallazgo</p><p className="mt-[4px] w-[332px] text-[12px] leading-[16.8px] text-[#646464]">Seleccione el tipo de hallazgo antes de continuar con las observaciones para esta inspección.</p></div><button type="button" onClick={() => setPicker('finding-type')} className="mt-[12px] flex h-[48px] w-full items-end justify-between rounded-[10px] border border-[#D1D1D1] bg-[#F6FAFF] px-[14px] py-[15px]"><span className="truncate text-[14px] font-medium leading-none text-[#131313]">{draft.findingTypeLabel ?? 'Seleccione'}</span><CaretDownIcon /></button></> : null}
        <div className={showFindingTypeSelector ? 'mt-[12px]' : ''}><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Observaciones</p><p className="mt-[4px] w-[332px] text-[12px] leading-[16.8px] text-[#646464]">Registra cada condición detectada en esta visita · una a una</p></div>
        <div className="mt-[12px] grid gap-[12px]">
          {!hasSavedObservation && !hasActiveObservation ? <><InfoNotice>Sin observaciones aún</InfoNotice><button type="button" onClick={addObservation} disabled={!addObservationEnabled} className={`flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[10px] border-[2px] border-dashed border-[#D1D1D1] bg-[#F6FAFF] text-[13px] font-semibold ${addObservationEnabled ? 'text-[#24588B]' : 'text-[#D1D1D1]'}`}><PlusIcon />Agregar observación</button></> : null}
          {hasSavedObservation ? <InfoNotice>La inspección contiene: {pluralizeObservation(savedObservations.length)}</InfoNotice> : null}
          {draft.findingObservations.map((observation, observationIndex) => observation.saved ? <SavedObservationCard key={observation.id} observation={observation} index={observationIndex} onRemove={() => removeFindingObservation(observation.id)} /> : <ObservationCard key={observation.id} observation={observation} index={observationIndex} severityOptions={severityOptions} onOpenSeverity={() => { setObservationIdForSeverity(observation.id); setPicker('severity'); }} onChange={(patch) => updateFindingObservation(observation.id, patch)} onSave={() => { const complete = Boolean(observation.detectedCondition.trim() && observation.correctiveAction.trim() && observation.evidence && observation.severityId); if (!complete) return; updateFindingObservation(observation.id, { saved: true }); }} onRemove={() => removeFindingObservation(observation.id)} />)}
          {hasSavedObservation && !hasActiveObservation ? <button type="button" onClick={addObservation} className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[10px] border-[2px] border-dashed border-[#D1D1D1] bg-[#F6FAFF] text-[13px] font-semibold text-[#24588B]"><PlusIcon />Agregar observación</button> : null}
        </div>
        {hasSavedObservation ? <div className="mt-[12px] w-full rounded-[10px] border-[1.5px] border-[#E3E3E3] bg-white p-[13.5px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]"><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Responsables</p><div className="mt-[12px] grid gap-[10px]"><div className="grid gap-[6px]"><FieldLabel>Empresa encargada de los hallazgos</FieldLabel><button type="button" onClick={() => setPicker('company')} className="flex h-[48px] w-full items-end justify-between rounded-[10px] border border-[#D1D1D1] bg-[#F6FAFF] px-[14px] py-[15px]"><span className="truncate text-[14px] font-medium leading-none text-[#131313]">{draft.findingCompanyName ?? 'Seleccione empresa'}</span><CaretDownIcon /></button></div><div className="grid gap-[6px]"><FieldLabel>Personal encargado de los hallazgos</FieldLabel><button type="button" onClick={() => setPicker('users')} disabled={!draft.findingCompanyId} className="flex h-[48px] w-full items-end justify-between rounded-[10px] border border-[#D1D1D1] bg-[#F6FAFF] px-[14px] py-[15px] disabled:opacity-70"><span className="truncate text-[14px] font-medium leading-none text-[#131313]">{draft.findingResponsibleIds.length > 0 ? `${draft.findingResponsibleIds.length} personas seleccionadas` : 'Seleccione al personal'}</span><CaretDownIcon /></button></div></div></div> : null}
      </div>
      <div className="shrink-0 border-t border-[#E3E3E3] bg-white pb-[8px] pt-[10px]"><div className="flex w-full gap-[10px] px-[14px]"><button type="button" className={`!flex !h-[50px] !w-auto !min-w-0 !shrink-0 !items-center !justify-center !gap-[8px] !rounded-[14px] !border-[2px] !bg-white !px-[20px] !text-[14px] !font-bold ${hasSavedObservation ? '!border-[#D1D1D1] !text-[#ACACAC]' : '!border-[#C8A064] !text-[#C8A064]'}`} onClick={onBack}><ArrowLeftIcon />Atrás</button><button type="button" className={`!flex !h-[50px] !w-auto !min-w-0 !flex-1 !items-center !justify-center !gap-[8px] !rounded-[14px] !text-[14px] !font-bold ${canContinue ? '!bg-[#C8A064] !text-white !shadow-[0_2px_4px_rgba(200,160,100,0.25)]' : '!bg-[#D1D1D1] !text-[#ACACAC] !shadow-none'}`} onClick={onNext} disabled={!canContinue}>Continuar<ArrowRightIcon /></button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>
      <SelectSheet visible={picker === 'finding-type'} title="Tipo de hallazgo" options={findingTypeOptions} selectedId={draft.findingTypeId} loading={findingTypesQuery.isLoading} emptyText="No hay tipos disponibles" onClose={() => setPicker(null)} onSelect={onSelectFindingType} />
      <CompanySearchSheet visible={picker === 'company'} options={companyOptions} selectedId={draft.findingCompanyId} loading={companiesQuery.isLoading} onClose={() => setPicker(null)} onSelect={onSelectCompany} />
      <PersonnelSelectionSheet visible={picker === 'users'} options={userOptions} selectedIds={draft.findingResponsibleIds} loading={usersByCompanyQuery.isLoading} onClose={() => setPicker(null)} onSave={setFindingResponsibles} />
      <SelectSheet visible={picker === 'severity'} title="Seleccionar criticidad" options={severityOptions} selectedId={draft.findingObservations.find((item) => item.id === observationIdForSeverity)?.severityId ?? null} loading={severitiesQuery.isLoading} emptyText="No hay criticidades disponibles" onClose={() => { setPicker(null); setObservationIdForSeverity(null); }} onSelect={onSelectSeverity} />
    </>
  );
}
