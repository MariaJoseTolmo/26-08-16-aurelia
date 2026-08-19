import { useState, type ReactNode } from 'react';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
} from '@aurelia/contracts';
import { env } from '../../../shared/config/env';
import {
  InspectionDetailCameraIcon,
  InspectionDetailCloseIcon,
  InspectionDetailFollowupIcon,
  InspectionDetailImageIcon,
  InspectionDetailListIcon,
  InspectionDetailLocationIcon,
  InspectionDetailPdfIcon,
  InspectionDetailPersonIcon,
  InspectionDetailStatusChipIcon,
  InspectionDetailStatusRowIcon,
} from './InspectionDetailIcons';
import type { InspectionDetailModalRecord } from './InspectionDetailModal';

type HistoryTab = 'observations' | 'followups' | 'general';

type GeneralInfoRow = {
  label: string;
  value: string;
  mono?: boolean;
};

type FollowupStep = {
  id: string;
  sequenceNumber?: number;
  title: string;
  date: string;
  summary?: string | null;
  bullets?: string[];
  reason?: string;
  completed: boolean;
  occurredAt?: string | null;
};

const apiOrigin = env.apiUrl.replace(/\/api\/?$/, '');
const historyTabs: Array<{ id: HistoryTab; label: string }> = [
  { id: 'observations', label: 'Observaciones' },
  { id: 'followups', label: 'Seguimientos' },
  { id: 'general', label: 'Datos generales' },
];
const avatarColors = [
  'bg-[#c8a064] text-[#001e39]',
  'bg-[#24588b] text-white',
  'bg-[#00b398] text-white',
  'bg-[#532a0e] text-white',
];

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(value)} · ${hours}:${minutes}`;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? Number.MAX_SAFE_INTEGER : result;
}

function businessDaysUntil(value: string | null | undefined) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  let days = 0;
  while (cursor.getTime() < target.getTime()) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days += 1;
  }
  return days;
}

function daysLabel(value: string | null | undefined, fallback = '—') {
  const days = businessDaysUntil(value);
  if (days === null) return fallback;
  return `${days} ${days === 1 ? 'día hábil' : 'días hábiles'}`;
}

function resolveEvidenceContentUrl(evidence: InspectionDetailEvidenceResponse | undefined) {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  return evidence.url.startsWith('/api/') ? `${apiOrigin}${evidence.url}` : evidence.url;
}

function allFindings(detail: InspectionDetailResponse) {
  return [
    detail.findings.executed,
    detail.findings.open,
    detail.findings.closed,
    detail.findings.rejected,
  ].flat();
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') : 'NA';
}

function severityClassName(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('crítico') || normalized.includes('critico')) return 'bg-[#ffd0db] text-[#570b1d]';
  if (normalized.includes('alto')) return 'bg-[#ffe1cd] text-[#532a0e]';
  if (normalized.includes('moder')) return 'bg-[#fbe1d0] text-[#69462e]';
  return 'bg-[#e0ffd3] text-[#2a5c16]';
}

function metadataFor(record: InspectionDetailModalRecord) {
  return (
    <div className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]">
      <p>{record.metadataLine1}</p>
      {record.metadataLine2 ? <p className="mt-[3px]">{record.metadataLine2}</p> : null}
    </div>
  );
}

function Tabs({ activeTab, onChange }: { activeTab: HistoryTab; onChange: (tab: HistoryTab) => void }) {
  return (
    <div className="grid shrink-0 border-b-2 border-[#e3e3e3] bg-[#f7f7f7]" style={{ gridTemplateColumns: `repeat(${historyTabs.length}, minmax(0, 1fr))` }}>
      {historyTabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`flex h-[37px] items-center justify-center border-b-2 px-[6px] pb-[2px] text-center text-[12px] font-semibold leading-[14px] ${tab.id === activeTab ? 'border-[#c8a064] text-[#8e6e3e]' : 'border-transparent text-[#646464]'}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function FindingPill({ children, className }: { children: string; className: string }) {
  return <span className={`inline-flex h-[19px] items-center rounded-[6px] px-[8px] text-[11px] font-bold leading-none ${className}`}>{children}</span>;
}

function FindingTextBlock({ title, children, bordered = false }: { title: string; children: string; bordered?: boolean }) {
  return (
    <div className={`flex w-full flex-col items-start rounded-[8px] bg-white px-[10px] py-[8px] ${bordered ? 'border border-[#e3e3e3]' : ''}`}>
      <p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">{title}</p>
      <p className="pt-[3px] text-[12px] leading-[16.8px] text-[#131313]">{children || '—'}</p>
    </div>
  );
}

function EvidencePreview({ title, evidences, afterClosed = false }: { title: string; evidences: InspectionDetailEvidenceResponse[]; afterClosed?: boolean }) {
  const evidence = evidences[0];
  const url = resolveEvidenceContentUrl(evidence);
  return (
    <div className="flex h-[91px] min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-[#e3e3e3] bg-white p-px">
      <div className="flex h-[20px] items-center bg-[#001e39] px-[8px]"><p className="text-[9px] font-bold uppercase text-white/70">{title}</p></div>
      <div className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden ${afterClosed ? 'bg-[#dafccb]' : 'bg-gradient-to-br from-[#e8f4fd] to-[#c8e6f0]'}`}>
        {evidence && url ? <img className="h-full w-full object-cover" src={url} alt={evidence.title ?? title} /> : <InspectionDetailImageIcon tone={afterClosed ? '#2a5c16' : '#24588b'} />}
      </div>
    </div>
  );
}

function ClosedObservationCard({ item, index }: { item: InspectionDetailFindingItemResponse; index: number }) {
  const hasEvidence = item.beforeEvidence.length > 0 || item.afterEvidence.length > 0;
  return (
    <article className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0_1px_1.5px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill>
          <FindingPill className={severityClassName(item.severityLabel)}>{item.severityLabel || '—'}</FindingPill>
        </div>
        <span className="inline-flex h-[19px] items-center gap-[4px] rounded-[6px] bg-[#e0ffd3] px-[8px] text-[10px] font-bold text-[#2a5c16]"><InspectionDetailStatusChipIcon status="closed" />Cerrado</span>
      </div>
      <div className="flex flex-col gap-[4px] pt-[12px]">
        <FindingTextBlock title="Condición detectada" bordered>{item.condition ?? ''}</FindingTextBlock>
        <FindingTextBlock title="Medida correctiva propuesta">{item.proposedCorrectiveAction ?? ''}</FindingTextBlock>
        <FindingTextBlock title="Descripción de la acción tomada">{item.executedActionDescription ?? ''}</FindingTextBlock>
        {hasEvidence ? <div className="flex gap-[4px] pt-[8px]">{item.beforeEvidence.length ? <EvidencePreview title="Antes" evidences={item.beforeEvidence} /> : null}{item.afterEvidence.length ? <EvidencePreview title="Después" evidences={item.afterEvidence} afterClosed /> : null}</div> : null}
        <div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px]"><p className="text-[12px] font-medium text-[#646464]">SLA cerrado</p><p className="text-[11px] font-bold text-[#532a0e]">{daysLabel(item.dueAt)}</p></div>
        <div className="flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px]"><p className="text-[12px] font-medium text-[#646464]">Fecha de cierre</p><p className="text-[11px] font-bold text-[#646464]">{formatDate(item.closedAt)}</p></div>
      </div>
    </article>
  );
}

function ObservationsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const items = detail.findings.closed ?? [];
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="flex h-[56px] items-center border-b border-[#e3e3e3] px-[14px]"><div className="flex items-center gap-[10px]"><InspectionDetailStatusRowIcon status="closed" /><p className="text-[11px] font-bold uppercase tracking-[.66px] text-[#2a5c16]">Cerradas</p><span className="rounded-[8px] bg-[#e0ffd3] px-[7px] text-[10px] font-bold text-[#2a5c16]">{items.length}</span></div></div>
      {items.length ? <div className="flex flex-col gap-[24px] px-[14px] pb-[24px] pt-[14px]">{items.map((item, index) => <ClosedObservationCard key={item.findingId} item={item} index={index} />)}</div> : <p className="py-[32px] text-center text-[12px] text-[#646464]">No hay observaciones cerradas.</p>}
    </div>
  );
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const total = findings.length;
  const percentage = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (occurredAt: string | null) => {
    const closed = occurredAt
      ? findings.filter((item) => item.closedAt && toTimestamp(item.closedAt) <= toTimestamp(occurredAt)).length
      : detail.header.counts.closed;
    const normalized = Math.max(0, Math.min(total, closed));
    const pending = Math.max(0, total - normalized);
    return [
      `Observaciones cerradas: ${normalized} obs / ${percentage(normalized)}%`,
      `Observaciones pendientes: ${pending} obs / ${percentage(pending)}%`,
    ];
  };

  const grouped = new Map<number, typeof detail.followups>();
  detail.followups.forEach((followup) => grouped.set(followup.sequenceNumber, [...(grouped.get(followup.sequenceNumber) ?? []), followup]));
  let recorded: FollowupStep[] = Array.from(grouped.entries())
    .sort(([left], [right]) => left - right)
    .map(([sequenceNumber, records]) => {
      const dates = records.map((record) => record.performedAt).filter((value): value is string => Boolean(value)).sort((left, right) => toTimestamp(left) - toTimestamp(right));
      const occurredAt = dates.at(-1) ?? null;
      const completed = records.some((record) => record.completed);
      return {
        id: `followup-${sequenceNumber}`,
        sequenceNumber,
        title: `Seguimiento ${sequenceNumber}`,
        date: completed ? formatDate(occurredAt) : '—',
        bullets: completed ? bulletsAt(occurredAt) : undefined,
        completed,
        occurredAt,
      };
    });

  if (!recorded.length) {
    const activityDates = findings.flatMap((item) => [item.executedAt, item.rejectedAt, item.closedAt]).filter((value): value is string => Boolean(value));
    recorded = [...new Set(activityDates.map((value) => new Date(value).toISOString().slice(0, 10)))]
      .sort()
      .slice(0, 3)
      .map((occurredAt, index) => ({
        id: `derived-${index + 1}`,
        sequenceNumber: index + 1,
        title: `Seguimiento ${index + 1}`,
        date: formatDate(occurredAt),
        bullets: bulletsAt(occurredAt),
        completed: true,
        occurredAt,
      }));
  }

  const bySequence = new Map(recorded.map((step, index) => [step.sequenceNumber ?? index + 1, step]));
  const highestSequence = Math.max(3, ...Array.from(bySequence.keys()));
  const followupSteps = Array.from({ length: highestSequence }, (_, index) => {
    const sequenceNumber = index + 1;
    return bySequence.get(sequenceNumber) ?? {
      id: `pending-${sequenceNumber}`,
      sequenceNumber,
      title: `Seguimiento ${sequenceNumber}`,
      date: '—',
      completed: false,
      occurredAt: null,
    };
  });
  const completed = followupSteps.filter((step) => step.completed);
  const pending = followupSteps.filter((step) => !step.completed);
  const slaSteps: FollowupStep[] = (detail.slaReassignments ?? []).map((event) => ({
    id: `sla-${event.id}`,
    title: `Observación “${event.findingNumber}” SLA reasignado`,
    date: formatDate(event.reassignedAt),
    bullets: [
      `SLA anterior: ${event.previousSlaBusinessDays} ${event.previousSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`,
      `Nuevo SLA: ${event.newSlaBusinessDays} ${event.newSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`,
    ],
    reason: event.reason,
    completed: true,
    occurredAt: event.reassignedAt,
  }));
  const activities = [...completed, ...slaSteps].sort((left, right) => toTimestamp(left.occurredAt) - toTimestamp(right.occurredAt));
  return [{
    id: 'initial',
    title: 'Inspección inicial',
    date: formatDate(detail.general.scheduledAt),
    summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`,
    completed: true,
    occurredAt: detail.general.scheduledAt,
  }, ...activities, ...pending];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = buildFollowupSteps(detail);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[20px]">
      <div className="flex items-center gap-[6px]"><InspectionDetailFollowupIcon /><p className="text-[11px] font-bold uppercase tracking-[.55px] text-[#646464]">Historial de seguimientos</p></div>
      <div className="pt-[10px]">{steps.map((step, index) => (
        <div key={step.id} className="flex gap-[12px]">
          <div className="flex w-[24px] flex-col items-center"><span className={`flex size-[24px] items-center justify-center rounded-full text-[10px] ${step.completed ? 'bg-[#6cc24a] text-white' : 'bg-[#e3e3e3] text-[#acacac]'}`}>{step.completed ? '✓' : '○'}</span>{index < steps.length - 1 ? <div className="min-h-[16px] w-[2px] flex-1 bg-[#e3e3e3]" /> : null}</div>
          <div className={`min-w-0 flex-1 pt-[2px] ${index < steps.length - 1 ? 'pb-[16px]' : ''}`}><p className="text-[12px] font-bold text-[#131313]">{step.title}</p><p className="pt-[4px] text-[11px] text-[#646464]">{step.date}</p>{step.summary ? <p className="pt-[5px] text-[11px] text-[#646464]">{step.summary}</p> : null}{step.bullets ? <ul className="list-disc pl-[20px] pt-[3px] text-[11px] leading-[15px] text-[#646464]">{step.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}{step.reason ? <div className="pt-[2px] text-[11px] leading-[15px] text-[#646464]"><p className="font-['Inter:Bold',sans-serif] font-bold">Motivo:</p><p className="font-['Inter:Regular',sans-serif] font-normal">{step.reason}</p></div> : null}</div>
        </div>
      ))}</div>
    </div>
  );
}

function GeneralSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]"><div className="flex h-[29px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]"><span>{icon}</span><p className="text-[10px] font-bold uppercase tracking-[.5px] text-[#646464]">{title}</p></div>{children}</section>;
}

function GeneralInfoRows({ rows }: { rows: GeneralInfoRow[] }) {
  return <div>{rows.map((row, index) => <div key={row.label} className={`flex items-center justify-between px-[12px] py-[9px] ${index < rows.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><p className="text-[12px] font-medium text-[#646464]">{row.label}</p><p className={`max-w-[62%] text-right text-[12px] font-bold text-[#131313] ${row.mono ? "font-['Cousine:Bold',monospace] text-[11px]" : ''}`}>{row.value}</p></div>)}</div>;
}

function EvidenceGallery({ evidences }: { evidences: InspectionDetailEvidenceResponse[] }) {
  const evidence = evidences[0];
  const url = resolveEvidenceContentUrl(evidence);
  return <div className="relative h-[80px] overflow-hidden rounded-[8px] bg-[#143049]">{evidence && url ? <img className="h-full w-full object-cover" src={url} alt={evidence.title ?? 'Foto general'} /> : null}<div className="absolute left-[8px] top-[6px] rounded bg-black/55 px-[7px] py-[2px] text-[9px] font-bold uppercase text-white">Foto general</div><div className="absolute bottom-[6px] right-[8px] rounded bg-black/50 px-[6px] py-[2px] text-[9px] text-white/80">{formatDateTime(evidence?.capturedAt)}</div></div>;
}

function GeneralPanel({ detail }: { detail: InspectionDetailResponse }) {
  const general = detail.general;
  const items = allFindings(detail);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] pb-[20px] pt-[14px]">
      <div className="flex flex-col gap-[12px]">
        <GeneralSection icon={<InspectionDetailPersonIcon />} title="Quién realizó la inspección"><GeneralInfoRows rows={[{ label: 'Nombre', value: general.inspectorName ?? '—' }, { label: 'Empresa', value: general.inspectorCompanyName ?? general.companyName ?? '—' }]} /></GeneralSection>
        <GeneralSection icon={<InspectionDetailLocationIcon />} title="Donde y cuándo"><GeneralInfoRows rows={[{ label: 'Área · Sector', value: [general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—' }, { label: 'Fecha', value: formatDate(general.scheduledAt) }, { label: 'Tipo', value: detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo' }, { label: 'Ubicación UTM', value: general.latitude && general.longitude ? `${general.latitude} · ${general.longitude}` : general.locationLabel ?? '—', mono: true }]} /></GeneralSection>
        {general.generalEvidence.length ? <GeneralSection icon={<InspectionDetailCameraIcon />} title="Fotografía general de la inspección"><div className="px-[12px] py-[9px]"><EvidenceGallery evidences={general.generalEvidence} /></div></GeneralSection> : null}
        <GeneralSection icon={<InspectionDetailListIcon />} title={`Observaciones (${items.length})`}><div>{items.map((item, index) => <div key={item.findingId} className={`px-[12px] py-[10px] ${index < items.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><div className="flex gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(item.severityLabel)}>{item.severityLabel || '—'}</FindingPill></div><p className="pt-[8px] text-[12px] leading-[16.8px] text-[#131313]">{item.condition ?? '—'}</p></div>)}</div></GeneralSection>
        <GeneralSection icon={<InspectionDetailPersonIcon />} title="Responsables"><GeneralInfoRows rows={[{ label: 'EECC', value: general.companyName ?? '—' }]} /><div className="border-t border-[#e3e3e3]">{general.responsibles.map((responsible, index) => <div key={responsible.userId} className={`flex items-center gap-[10px] px-[12px] py-[10px] ${index < general.responsibles.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><div className={`flex size-[32px] items-center justify-center rounded-full text-[12px] font-bold ${avatarColors[index % avatarColors.length]}`}>{initials(responsible.fullName)}</div><div><p className="text-[12px] font-bold">{responsible.fullName}</p><p className="pt-[4px] text-[11px] text-[#646464]">{responsible.position ?? 'Sin cargo'}</p></div></div>)}</div></GeneralSection>
      </div>
    </div>
  );
}

function DetailContent({ activeTab, detail }: { activeTab: HistoryTab; detail: InspectionDetailResponse }) {
  if (activeTab === 'followups') return <FollowupsPanel detail={detail} />;
  if (activeTab === 'general') return <GeneralPanel detail={detail} />;
  return <ObservationsPanel detail={detail} />;
}

function DownloadPdfButton({ inspectionId }: { inspectionId: string }) {
  return <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white text-[13px] font-semibold text-[#333]" onClick={() => window.open(`${apiOrigin}/api/inspections/${inspectionId}/export/pdf`, '_blank')}><InspectionDetailPdfIcon />Descargar PDF</button></div>;
}

export function InspectionHistoryDetailModal({ open, record, detail, onClose }: { open: boolean; record: InspectionDetailModalRecord; detail: InspectionDetailResponse; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('observations');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/70">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,.35)]" role="dialog" aria-modal="true">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start gap-[12px] px-[14px] py-[12px]"><div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-[#001e39]">{record.id}</p><h2 className="mt-[5px] text-[16px] font-bold leading-[22px] text-[#2a2a2a]">{record.title}</h2><div className="mt-[4px]">{metadataFor(record)}</div></div><button type="button" className="flex size-[32px] items-center justify-center" onClick={onClose} aria-label="Cerrar detalle"><InspectionDetailCloseIcon /></button></div>
            <Tabs activeTab={activeTab} onChange={setActiveTab} />
            <DetailContent activeTab={activeTab} detail={detail} />
          </div>
          <DownloadPdfButton inspectionId={detail.header.inspectionId} />
        </section>
      </div>
    </div>
  );
}
