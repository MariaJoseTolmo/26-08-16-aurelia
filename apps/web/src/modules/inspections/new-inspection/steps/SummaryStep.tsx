import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InspectionAnswerValue, InspectionType } from '@aurelia/contracts';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { getCompanyUsers } from '../../../../shared/services/inspections.service';
import { useNewInspectionDraftStore, type NewInspectionChecklistItemDetail } from '../state/newInspectionDraft.store';
import {
  SummaryArrowLeftIcon,
  SummaryBackIcon,
  SummaryCheckSmallIcon,
  SummaryInfoIcon,
  SummaryInspectorIcon,
  SummaryObservationsIcon,
  SummaryOfflineIcon,
  SummaryResultIcon,
  SummarySaveIcon,
  SummaryWhereIcon,
  SummaryXSmallIcon,
} from '../icons/SummaryIcons';

interface SummaryStepProps {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  errorMessage: string | null;
}

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

function trimLocationLabel(value: string): string {
  return value.replace(/ \+- .*/, '').trim();
}

function severityTone(label?: string | null) {
  const normalized = (label ?? '').toLowerCase();
  if (normalized.includes('grave') || normalized.includes('alta') || normalized.includes('crít')) return 'bg-[#FFD0DB] text-[#570B1D]';
  if (normalized.includes('menor') || normalized.includes('baja')) return 'bg-[#E0FFD3] text-[#2A5C16]';
  return 'bg-[#FFE1CD] text-[#532A0E]';
}

function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'NA';
}

function ManualStepper({ checklist }: { checklist: boolean }) {
  const steps = [
    { label: 'Datos', complete: true, active: false },
    { label: 'Tipo', complete: true, active: false },
    { label: checklist ? 'Ítems' : 'Obs.', complete: true, active: false },
    { label: 'Resumen', complete: false, active: true },
  ];

  return (
    <div className="shrink-0 border-b border-[#E3E3E3] bg-white px-[14px] pb-[9px] pt-[10px]">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.label} className="relative h-[35px] w-[83px] shrink-0">
            {index < steps.length - 1 ? <div className={`absolute left-[33px] top-[11px] h-[2px] ${index === 2 ? 'w-[81px]' : 'w-[73px]'} bg-[#C8A064]`} /> : null}
            <div className={`absolute left-[22.2px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold ${step.complete ? 'border-[1.5px] border-[#C8A064] bg-[#C8A064] text-white' : 'border-[2px] border-[#C8A064] bg-white text-[#C8A064]'}`}>{step.complete ? '✓' : index + 1}</div>
            <p className="absolute top-[25px] w-full text-center text-[8px] font-semibold leading-[9.6px] text-[#8E6E3E]">{step.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-[6px] h-[2px] w-full overflow-hidden rounded-[2px] bg-[#E3E3E3]"><div className="h-[2px] w-full rounded-[2px] bg-gradient-to-r from-[#8E6E3E] to-[#C8A064]" /></div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex h-[29px] items-center gap-[6px] border-b border-[#E3E3E3] bg-[#F7F7F7] px-[12px]"><span className="flex h-[10px] w-[12.5px] shrink-0 items-center justify-center">{icon}</span><p className="text-[10px] font-bold uppercase leading-none tracking-[0.5px] text-[#646464]">{title}</p></div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-h-[33px] items-center justify-between gap-[10px] border-b border-[#E3E3E3] px-[12px] py-[9px] last:border-b-0">
      <p className="text-[12px] font-medium leading-none text-[#646464]">{label}</p>
      <p className={`max-w-[62%] truncate text-right text-[12px] font-bold leading-none text-[#131313] ${mono ? 'font-mono text-[11px]' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function ResultRow({ label, value, tone }: { label: string; value: string; tone: 'yes' | 'no' | 'na' }) {
  const toneClass = tone === 'yes' ? 'text-[#2A5C16]' : tone === 'no' ? 'text-[#570B1D]' : 'text-[#646464]';
  return (
    <div className="flex min-h-[36px] items-center justify-between gap-[10px] border-b border-[#E3E3E3] px-[12px] py-[9px] last:border-b-0">
      <p className="text-[12px] font-medium leading-none text-[#646464]">{label}</p>
      <div className={`flex items-center gap-[5px] text-right text-[12px] font-bold leading-none ${toneClass}`}>{tone === 'yes' ? <SummaryCheckSmallIcon /> : null}{tone === 'no' ? <SummaryXSmallIcon /> : null}<span>{value}</span></div>
    </div>
  );
}

function ChecklistObservationSummary({ index, detail }: { index: number; detail: NewInspectionChecklistItemDetail }) {
  const severityLabel = detail.severityLabel ?? 'Sin criticidad';
  const slaLabel = detail.slaLabel ?? detail.severityClosureTimeLabel ?? 'xx días hábiles';
  return (
    <div className="border-b border-[#E3E3E3] px-[12px] pb-[10px] pt-[9px] last:border-b-0">
      <div className="flex items-center gap-[8px]"><span className="rounded-[6px] bg-[#E6F3FF] px-[8px] py-[3px] text-[11px] font-bold leading-none text-[#24588B]">Ítem. Nº{index + 1}</span><span className={`rounded-[8px] px-[7px] py-[4px] text-[10px] font-bold leading-none ${severityTone(severityLabel)}`}>{severityLabel}</span></div>
      <p className="mt-[8px] text-[12px] leading-[16.8px] text-[#131313]">{detail.detectedCondition || 'Sin descripción'}</p>
      <div className="mt-[8px] flex items-center justify-between border-t border-[#E3E3E3] pt-[10px]"><span className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</span><span className="text-right text-[12px] font-bold leading-none text-[#131313]">{slaLabel}</span></div>
    </div>
  );
}

function FindingObservationSummary({ index, severity, text, sla }: { index: number; severity: string; text: string; sla: string }) {
  return (
    <div className="border-b border-[#E3E3E3] px-[12px] pb-[10px] pt-[9px] last:border-b-0">
      <div className="flex items-center gap-[8px]"><span className="rounded-[6px] bg-[#E6F3FF] px-[8px] py-[3px] text-[11px] font-bold leading-none text-[#24588B]">Obs. {index + 1}</span><span className={`rounded-[8px] px-[7px] py-[4px] text-[10px] font-bold leading-none ${severityTone(severity)}`}>{severity || 'Sin criticidad'}</span></div>
      <p className="mt-[8px] text-[12px] leading-[16.8px] text-[#131313]">{text || 'Sin descripción'}</p>
      <div className="mt-[8px] flex items-center justify-between border-t border-[#E3E3E3] pt-[10px]"><span className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</span><span className="text-right text-[12px] font-bold leading-none text-[#131313]">{sla || 'xx días hábiles'}</span></div>
    </div>
  );
}

function ResponsibleRow({ name, position, self, tone }: { name: string; position: string; self: boolean; tone: 'gold' | 'navy' }) {
  return (
    <div className="flex items-center gap-[10px] border-b border-[#E3E3E3] px-[12px] py-[10px] last:border-b-0">
      <span className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${tone === 'gold' ? 'bg-[#C8A064] text-[#001E39]' : 'bg-[#24588B] text-white'}`}>{initials(name)}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold leading-none text-[#131313]">{name}</p><p className="mt-[4px] truncate text-[11px] leading-none text-[#646464]">{position || 'Responsable'}</p></div>
      {self ? <span className="rounded-[5px] bg-[#C5FFF6] px-[7px] py-[2px] text-[10px] font-bold leading-none text-[#00B398]">Tú</span> : null}
    </div>
  );
}

export function SummaryStep({ onBack, onSave, saving, errorMessage }: SummaryStepProps) {
  const user = useSessionStore((state) => state.user);
  const online = useOnlineStatus();
  const draft = useNewInspectionDraftStore();
  const usersByCompanyQuery = useQuery({
    queryKey: ['inspections', 'new-inspection', 'company-users', draft.findingCompanyId],
    queryFn: () => getCompanyUsers(draft.findingCompanyId ?? ''),
    enabled: Boolean(draft.findingCompanyId),
  });

  const usersById = useMemo(() => new Map((usersByCompanyQuery.data ?? []).map((responsible) => [responsible.id, responsible])), [usersByCompanyQuery.data]);
  const checklistEntries = Object.entries(draft.answersByItemId);
  const yesCount = checklistEntries.filter(([, value]) => value === InspectionAnswerValue.COMPLIANT).length;
  const noEntries = checklistEntries.filter(([, value]) => value === InspectionAnswerValue.NOT_COMPLIANT);
  const noCount = noEntries.length;
  const naCount = checklistEntries.filter(([, value]) => value === InspectionAnswerValue.NOT_APPLICABLE).length;
  const checklistObservations = noEntries.map(([itemId]) => draft.detailsByItemId[itemId] ?? {}).filter((detail) => Boolean(detail.detectedCondition || detail.correctiveAction || detail.evidence));
  const findingObservations = draft.findingObservations.filter((item) => item.saved);
  const isFindingFlow = draft.inspectionType === InspectionType.ENVIRONMENTAL;
  const showOfflineBanner = !online || !user;
  const observationsCount = isFindingFlow ? findingObservations.length : checklistObservations.length;
  const areaSectorValue = `${draft.areaName ?? '-'} · ${draft.sectorName ?? '-'}`;
  const templateLabel = draft.templateName?.replace(/^Almacenamiento de\s+/i, '').replace(/\s*-\s*/g, ' – ') ?? '-';

  return (
    <>
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-full items-center gap-[4px] px-[4px]"><button type="button" className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full" onClick={onBack} aria-label="Atrás"><SummaryBackIcon /></button><div className="min-w-0 flex-1 px-[4px]"><p className="truncate text-[14px] font-semibold leading-[17px] text-white">Observaciones</p><p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">Paso 3 de 5</p></div><div className="pr-[4px]"><div className="flex h-[20px] w-[56px] items-center justify-center rounded-[16px] bg-[#C8A064]"><span className="text-[10px] font-bold leading-none text-[#001E39]">GF HSE</span></div></div></div></div>
      {showOfflineBanner ? <div className="flex h-[23px] shrink-0 items-center gap-[7px] border-b border-[#C8A064] bg-[#2A1A04] px-[16px] pb-[6px] pt-[5px]"><SummaryOfflineIcon /><span className="text-[11px] font-semibold leading-none text-[#C8A064]">Sin red · guardando localmente</span></div> : null}
      <ManualStepper checklist={!isFindingFlow} />
      <div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-[14px] pb-[16px] pt-[14px]">
        <div><p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Resumen</p><p className="mt-[4px] text-[12px] leading-[16.8px] text-[#646464]">Revisa antes de guardar · se sincronizará al recuperar red</p></div>
        <div className="mt-[12px] grid gap-[12px]">
          <SectionCard title="Quién realizó la inspección" icon={<SummaryInspectorIcon />}><SummaryRow label="Nombre" value={draft.inspectorName} /><SummaryRow label="Empresa" value={draft.inspectorCompanyName} /></SectionCard>
          <SectionCard title="Donde y cuándo" icon={<SummaryWhereIcon />}><SummaryRow label="Área · Sector" value={areaSectorValue} /><SummaryRow label="Fecha" value={draft.inspectionDate} /><SummaryRow label="Tipo" value={draft.inspectionTypeLabel || (isFindingFlow ? 'Hallazgo' : 'Checklist normativo')} />{!isFindingFlow ? <><SummaryRow label="Plantilla" value={templateLabel} /><SummaryRow label="Código" value={draft.templateCode ?? '-'} /></> : null}<SummaryRow label="Ubicación UTM" value={trimLocationLabel(draft.locationLabel)} mono /></SectionCard>
          {!isFindingFlow ? <SectionCard title={`Resultado · ${checklistEntries.length} ítems`} icon={<SummaryResultIcon />}><ResultRow label="SÍ" value={`${yesCount} ítems conformes`} tone="yes" /><ResultRow label="NO" value={`${noCount} · obs. registradas`} tone="no" /><ResultRow label="N/A" value={`${naCount} ítems`} tone="na" /></SectionCard> : null}
          {isFindingFlow ? <SectionCard title={`Observaciones (${observationsCount})`} icon={<SummaryObservationsIcon />}>{findingObservations.map((item, index) => <FindingObservationSummary key={item.id} index={index} severity={item.severityLabel ?? ''} text={item.detectedCondition} sla={item.severityClosureTimeLabel ?? ''} />)}</SectionCard> : <SectionCard title={`Observaciones (${observationsCount})`} icon={<SummaryObservationsIcon />}>{checklistObservations.length > 0 ? checklistObservations.map((detail, index) => <ChecklistObservationSummary key={index} index={index} detail={detail} />) : <p className="px-[12px] py-[10px] text-[12px] text-[#646464]">Sin observaciones registradas</p>}</SectionCard>}
          {draft.findingCompanyName ? <SectionCard title="Responsables" icon={<SummaryInspectorIcon />}><SummaryRow label="EECC" value={draft.findingCompanyName} />{draft.findingResponsibleIds.map((id, index) => { const responsible = usersById.get(id); const name = responsible?.fullName ?? 'Responsable'; const self = Boolean(responsible && user?.id === responsible.id); return <ResponsibleRow key={id} name={name} position={responsible?.position ?? (index === 0 ? 'Coordinador' : 'Inspector')} self={self} tone={index === 0 ? 'gold' : 'navy'} />; })}</SectionCard> : null}
          <div className="flex min-h-[82px] w-full items-start gap-[12px] rounded-[12px] bg-[#4A90C4] py-[12px] pl-[14px] pr-[12px] text-white"><SummaryInfoIcon className="shrink-0" /><div className="min-w-0 flex-1"><p className="text-[13px] font-bold leading-[16.9px]">Guardado offline</p><p className="mt-[2px] text-[11px] leading-[15.4px] text-[rgba(255,255,255,0.88)]">Este proceso cuenta con guardado localmente. En caso que no cuente con señal, el formulario será enviado una vez esta sea recuperada.</p></div></div>
        </div>
      </div>
      <div className="shrink-0 border-t border-[#E3E3E3] bg-white pb-[8px] pt-[10px]"><div className="flex w-full gap-[10px] px-[14px]"><button type="button" className="!flex !h-[50px] !w-auto !min-w-0 !shrink-0 !items-center !justify-center !gap-[8px] !rounded-[14px] !border-[2px] !border-[#C8A064] !bg-white !px-[20px] !text-[14px] !font-bold !text-[#C8A064]" onClick={onBack}><SummaryArrowLeftIcon />Atrás</button><button type="button" className={`!flex !h-[50px] !w-auto !min-w-0 !flex-1 !items-center !justify-center !gap-[8px] !rounded-[14px] !text-[14px] !font-bold ${saving ? '!bg-[#85C586]' : '!bg-[#3A9B3A]'} !text-white !shadow-[0_2px_4px_rgba(58,155,58,0.25)]`} onClick={onSave} disabled={saving}><SummarySaveIcon />{saving ? 'Guardando...' : 'Guardar inspección'}</button></div>{errorMessage ? <p className="mx-[14px] mt-[8px] text-[11px] text-[#BD3B5B]">{errorMessage}</p> : null}<div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>
    </>
  );
}
