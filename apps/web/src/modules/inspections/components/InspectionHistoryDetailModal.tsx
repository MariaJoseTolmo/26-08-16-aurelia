import { useState, type ReactNode } from 'react';
import type { InspectionDetailEvidenceResponse, InspectionDetailFindingItemResponse, InspectionDetailResponse } from '@aurelia/contracts';
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
  completed: boolean;
  occurredAt?: string | null;
};

const API_URL = env.apiUrl;
const apiOrigin = API_URL.replace(/\/api\/?$/, '');
const historyTabs: Array<{ id: HistoryTab; label: string }> = [
  { id: 'observations', label: 'Observaciones' },
  { id: 'followups', label: 'Seguimientos' },
  { id: 'general', label: 'Datos generales' },
];
const avatarColors = ['bg-[#c8a064] text-[#001e39]', 'bg-[#24588b] text-white', 'bg-[#00b398] text-white', 'bg-[#532a0e] text-white'];

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'dd-mm-aaaa · 00:00';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'dd-mm-aaaa · 00:00';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()} · ${hours}:${minutes}`;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.MAX_SAFE_INTEGER;
  return date.getTime();
}

function daysLabel(value: string | null | undefined, fallback = 'XX días') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return `${days} días`;
}

function resolveEvidenceContentUrl(evidence: InspectionDetailEvidenceResponse | undefined) {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function evidenceLabel(evidence: InspectionDetailEvidenceResponse, index: number) {
  return evidence.title ?? evidence.description ?? `Evidencia ${index + 1}`;
}

function allFindings(detail: InspectionDetailResponse) {
  return [detail.findings.executed, detail.findings.open, detail.findings.closed, detail.findings.rejected].flat();
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function severityClassName(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('crítico') || normalized.includes('critico')) return 'bg-[#ffd0db] text-[#570b1d]';
  if (normalized.includes('alto')) return 'bg-[#ffe1cd] text-[#532a0e]';
  if (normalized.includes('moder')) return 'bg-[#fbe1d0] text-[#69462e]';
  return 'bg-[#e0ffd3] text-[#2a5c16]';
}

function metadataFor(record: InspectionDetailModalRecord) {
  if (record.metadataLine2) return <div className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]"><p>{record.metadataLine1}</p><p className="mt-[3px]">{record.metadataLine2}</p></div>;
  return <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]">{record.metadataLine1}</p>;
}

function Tabs({ activeTab, onChange }: { activeTab: HistoryTab; onChange: (tab: HistoryTab) => void }) {
  return <div className="grid shrink-0 border-b-2 border-[#e3e3e3] bg-[#f7f7f7]" style={{ gridTemplateColumns: `repeat(${historyTabs.length}, minmax(0, 1fr))` }}>{historyTabs.map((tab) => <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`flex h-[37px] items-center justify-center border-b-2 px-[6px] pb-[2px] text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-[14px] ${tab.id === activeTab ? 'border-[#c8a064] text-[#8e6e3e]' : 'border-transparent text-[#646464]'}`}>{tab.label}</button>)}</div>;
}

function FindingPill({ children, className }: { children: string; className: string }) {
  return <span className={`inline-flex h-[19px] items-center rounded-[6px] px-[8px] text-[11px] font-bold leading-none ${className}`}>{children}</span>;
}

function FindingTextBlock({ title, children, bordered = false }: { title: string; children: string; bordered?: boolean }) {
  return <div className={`flex w-full flex-col items-start rounded-[8px] bg-white px-[10px] py-[8px] ${bordered ? 'border border-[#e3e3e3]' : ''}`}><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">{title}</p><p className="pt-[3px] text-[12px] font-normal leading-[16.8px] text-[#131313]">{children || '—'}</p></div>;
}

function EvidencePreview({ title, evidences, afterClosed = false, emptyLabel = 'Pendiente EECC' }: { title: string; evidences: InspectionDetailEvidenceResponse[]; afterClosed?: boolean; emptyLabel?: string }) {
  const firstEvidence = evidences[0];
  const firstUrl = resolveEvidenceContentUrl(firstEvidence);
  return <div className="flex h-[91px] min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-[#e3e3e3] bg-white p-px"><div className="flex h-[20px] items-center bg-[#001e39] px-[8px] py-[4px]"><p className="text-[9px] font-bold uppercase leading-none text-[rgba(255,255,255,0.7)]">{title}</p></div><div className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden ${afterClosed ? 'bg-[#dafccb]' : 'bg-gradient-to-br from-[#e8f4fd] to-[#c8e6f0]'}`}>{firstEvidence && firstUrl ? <img className="h-full w-full object-cover" src={firstUrl} alt={evidenceLabel(firstEvidence, 0)} /> : evidences.length > 0 ? <InspectionDetailImageIcon tone={afterClosed ? '#2a5c16' : '#24588b'} /> : <p className="text-[11px] font-normal leading-none text-[#acacac]">{emptyLabel}</p>}</div></div>;
}

function ClosedStatusRow({ count }: { count: number }) {
  return <div className="flex h-[56px] w-full shrink-0 items-center border-b border-[#e3e3e3] bg-white px-[14px] py-[16px]"><div className="flex items-center gap-[10px]"><InspectionDetailStatusRowIcon status="closed" /><p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold uppercase leading-[13px] tracking-[0.66px] text-[#2a5c16]">Cerradas</p><span className="flex h-[14px] min-w-[19px] items-center justify-center rounded-[8px] bg-[#e0ffd3] px-[7px] font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[12px] tracking-[0.6px] text-[#2a5c16]">{count}</span></div></div>;
}

function ClosedObservationCard({ item, index }: { item: InspectionDetailFindingItemResponse; index: number }) {
  return <div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between"><div className="flex min-w-0 items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(item.severityLabel)}>{item.severityLabel}</FindingPill></div><span className="inline-flex h-[19px] items-center gap-[4px] rounded-[6px] bg-[#e0ffd3] px-[8px] py-[4px] text-[10px] font-bold leading-none text-[#2a5c16]"><InspectionDetailStatusChipIcon status="closed" />Cerrado</span></div><div className="flex flex-col gap-[4px] pt-[12px]"><FindingTextBlock title="Condición detectada" bordered>{item.condition ?? ''}</FindingTextBlock><FindingTextBlock title="Medida correctiva propuesta">{item.proposedCorrectiveAction ?? ''}</FindingTextBlock><FindingTextBlock title="Descripción de la acción tomada">{item.executedActionDescription ?? ''}</FindingTextBlock><div className="flex gap-[4px] pt-[8px]"><EvidencePreview title="Antes" evidences={item.beforeEvidence} emptyLabel="Pendiente" /><EvidencePreview title="Después" evidences={item.afterEvidence} afterClosed /></div><div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA cerrado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="open" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#532a0e]">{daysLabel(item.dueAt)}</p></div></div><div className="flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">Fecha de cierre</p><p className="text-right text-[11px] font-bold leading-none text-[#646464]">{formatDate(item.closedAt)}</p></div></div></div>;
}

function ObservationsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const items = detail.findings.closed ?? [];
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white"><ClosedStatusRow count={items.length} />{items.length > 0 ? <div className="flex shrink-0 flex-col gap-[24px] bg-white px-[14px] pb-[24px] pt-[14px]">{items.map((item, index) => <ClosedObservationCard key={item.findingId} item={item} index={index} />)}</div> : <div className="flex min-h-[92px] items-center justify-center border-b border-[#e3e3e3] bg-white px-[24px] py-[24px]"><p className="text-center text-[12px] font-semibold leading-[18px] text-[#646464]">No hay observaciones cerradas.</p></div>}</div>;
}

function FollowupTimelineMarker({ completed }: { completed: boolean }) {
  return <div className={`flex size-[24px] shrink-0 items-center justify-center rounded-[12px] text-[10px] font-normal leading-none ${completed ? 'bg-[#6cc24a] text-white' : 'bg-[#e3e3e3] text-[#acacac]'}`}>{completed ? '✓' : '○'}</div>;
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const total = findings.length;
  const percentage = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (occurredAt: string | null) => {
    const closed = occurredAt
      ? findings.filter((item) => item.closedAt && toTimestamp(item.closedAt) <= toTimestamp(occurredAt)).length
      : detail.header.counts.closed;
    const normalizedClosed = Math.max(0, Math.min(total, closed));
    const pending = Math.max(0, total - normalizedClosed);
    return [
      `Observaciones cerradas: ${normalizedClosed} obs / ${percentage(normalizedClosed)}%`,
      `Observaciones pendientes: ${pending} obs / ${percentage(pending)}%`,
    ];
  };

  const followupsBySequence = new Map<number, typeof detail.followups>();
  detail.followups.forEach((followup) => {
    const current = followupsBySequence.get(followup.sequenceNumber) ?? [];
    current.push(followup);
    followupsBySequence.set(followup.sequenceNumber, current);
  });

  let recordedSteps: FollowupStep[] = Array.from(followupsBySequence.entries())
    .sort(([left], [right]) => left - right)
    .map(([sequenceNumber, records]) => {
      const dates = records
        .map((record) => record.performedAt)
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => toTimestamp(left) - toTimestamp(right));
      const occurredAt = dates.length > 0 ? dates[dates.length - 1] : null;
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

  if (recordedSteps.length === 0) {
    const latestActivityByDate = new Map<string, string>();
    findings.forEach((item) => {
      [item.executedAt, item.rejectedAt, item.closedAt].forEach((value) => {
        if (!value) return;
        const timestamp = toTimestamp(value);
        if (timestamp === Number.MAX_SAFE_INTEGER) return;
        const dateKey = new Date(timestamp).toISOString().slice(0, 10);
        const current = latestActivityByDate.get(dateKey);
        if (!current || toTimestamp(value) > toTimestamp(current)) latestActivityByDate.set(dateKey, value);
      });
    });
    recordedSteps = Array.from(latestActivityByDate.values())
      .sort((left, right) => toTimestamp(left) - toTimestamp(right))
      .slice(0, 3)
      .map((occurredAt, index) => ({
        id: `derived-followup-${index + 1}`,
        sequenceNumber: index + 1,
        title: `Seguimiento ${index + 1}`,
        date: formatDate(occurredAt),
        bullets: bulletsAt(occurredAt),
        completed: true,
        occurredAt,
      }));
  }

  const stepBySequence = new Map(recordedSteps.map((step, index) => [step.sequenceNumber ?? index + 1, step]));
  const highestSequence = Math.max(3, ...Array.from(stepBySequence.keys()));
  const followupSteps = Array.from({ length: highestSequence }, (_, index) => {
    const sequenceNumber = index + 1;
    return stepBySequence.get(sequenceNumber) ?? {
      id: `pending-followup-${sequenceNumber}`,
      sequenceNumber,
      title: `Seguimiento ${sequenceNumber}`,
      date: '—',
      completed: false,
      occurredAt: null,
    };
  });

  return [{
    id: 'initial',
    title: 'Inspección inicial',
    date: formatDate(detail.general.scheduledAt),
    summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`,
    completed: true,
    occurredAt: detail.general.scheduledAt,
  }, ...followupSteps];
}

function FollowupTimelineItem({ step, isLast }: { step: FollowupStep; isLast: boolean }) {
  const longConnector = Boolean(step.summary || step.bullets);
  return <div className={`relative flex w-full gap-[12px] ${isLast ? '' : 'pb-[16px]'}`}><FollowupTimelineMarker completed={step.completed} />{!isLast ? <div className={`absolute left-[11px] top-[24px] w-[2px] bg-[#e3e3e3] ${longConnector ? 'h-[38px]' : 'h-[23px]'}`} /> : null}<div className="min-w-0 flex-1 pt-[2px]"><p className="text-[12px] font-bold leading-none text-[#131313]">{step.title}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{step.date}</p>{step.summary ? <p className="pt-[5px] text-[11px] font-normal leading-[15px] text-[#646464]">{step.summary}</p> : null}{step.bullets ? <ul className="list-disc pt-[2px] text-[11px] font-normal leading-normal text-[#646464]">{step.bullets.map((bullet) => <li key={bullet} className="ms-[16.5px]">{bullet}</li>)}</ul> : null}</div></div>;
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = buildFollowupSteps(detail);
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[20px]"><div className="flex items-center gap-[6px]"><InspectionDetailFollowupIcon /><p className="text-[11px] font-bold uppercase leading-none tracking-[0.55px] text-[#646464]">Historial de seguimientos</p></div><div className="pt-[10px]">{steps.map((step, index) => <FollowupTimelineItem key={step.id} step={step} isLast={index === steps.length - 1} />)}</div></div>;
}

function GeneralSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="w-full overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="flex h-[29px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]"><span className="flex h-[10px] w-[12.5px] items-center justify-center">{icon}</span><p className="text-[10px] font-bold uppercase leading-none tracking-[0.5px] text-[#646464]">{title}</p></div>{children}</section>;
}

function GeneralInfoRows({ rows }: { rows: GeneralInfoRow[] }) {
  return <div>{rows.map((row, index) => <div key={row.label} className={`flex items-center justify-between px-[12px] py-[9px] ${index < rows.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><p className="text-[12px] font-medium leading-none text-[#646464]">{row.label}</p><p className={`text-right text-[12px] font-bold leading-none text-[#131313] ${row.mono ? "font-['Cousine:Bold',monospace] text-[11px]" : ''}`}>{row.value}</p></div>)}</div>;
}

function EvidenceGallery({ evidences }: { evidences: InspectionDetailEvidenceResponse[] }) {
  const evidence = evidences[0];
  const url = resolveEvidenceContentUrl(evidence);
  return <div className="relative h-[80px] overflow-hidden rounded-[8px] bg-[linear-gradient(165deg,#1e3050_0%,#0f1f35_100%)]">{evidence && url ? <img className="h-full w-full object-cover" src={url} alt={evidenceLabel(evidence, 0)} /> : null}<div className="absolute left-[8px] top-[6px] rounded-[4px] bg-[rgba(0,0,0,0.55)] px-[7px] py-[2px]"><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-white">Foto general</p></div><div className="absolute bottom-[6px] right-[8px] rounded-[4px] bg-[rgba(0,0,0,0.5)] px-[6px] py-[2px]"><p className="text-[9px] font-normal leading-none text-[rgba(255,255,255,0.8)]">{formatDateTime(evidence?.capturedAt)}</p></div></div>;
}

function initialsAvatar(name: string, index: number) {
  return <div className={`flex size-[32px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none ${avatarColors[index % avatarColors.length]}`}>{initials(name)}</div>;
}

function ResponsiblesSection({ detail }: { detail: InspectionDetailResponse }) {
  const responsibles = detail.general.responsibles;
  return <GeneralSection icon={<InspectionDetailPersonIcon />} title="Responsables"><GeneralInfoRows rows={[{ label: 'EECC', value: detail.general.companyName ?? '—' }]} /><div className="border-t border-[#e3e3e3]">{responsibles.map((responsible, index) => <div key={responsible.userId} className={`flex items-center gap-[10px] px-[12px] py-[10px] ${index === responsibles.length - 1 ? '' : 'border-b border-[#e3e3e3]'}`}>{initialsAvatar(responsible.fullName, index)}<div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold leading-none text-[#131313]">{responsible.fullName}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{responsible.position ?? 'Sin cargo'}</p></div>{responsible.currentUser ? <span className="inline-flex h-[16px] items-center rounded-[5px] bg-[#c5fff6] px-[7px] text-[10px] font-bold leading-none text-[#00b398]">Tú</span> : null}</div>)}</div></GeneralSection>;
}

function GeneralPanel({ detail }: { detail: InspectionDetailResponse }) {
  const general = detail.general;
  const items = allFindings(detail);
  const locationRows: GeneralInfoRow[] = [
    { label: 'Área · Sector', value: [general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—' },
    { label: 'Fecha', value: formatDate(general.scheduledAt) },
    { label: 'Tipo', value: detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo' },
    { label: 'Ubicación UTM', value: general.latitude && general.longitude ? `${general.latitude} · ${general.longitude}` : general.locationLabel ?? '—', mono: true },
  ];
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] pb-[20px] pt-[14px]"><div className="flex flex-col gap-[12px]"><GeneralSection icon={<InspectionDetailPersonIcon />} title="Quién realizó la inspección"><GeneralInfoRows rows={[{ label: 'Nombre', value: general.inspectorName ?? '—' }, { label: 'Empresa', value: general.inspectorCompanyName ?? general.companyName ?? '—' }]} /></GeneralSection><GeneralSection icon={<InspectionDetailLocationIcon />} title="Donde y cuándo"><GeneralInfoRows rows={locationRows} /></GeneralSection><GeneralSection icon={<InspectionDetailCameraIcon />} title="Fotografía general de la inspección"><div className="px-[12px] py-[9px]"><EvidenceGallery evidences={general.generalEvidence} /></div></GeneralSection><GeneralSection icon={<InspectionDetailListIcon />} title={`Observaciones (${items.length})`}><div>{items.map((item, index) => <div key={item.findingId} className={`flex flex-col gap-[8px] px-[12px] py-[10px] ${index === items.length - 1 ? '' : 'border-b border-[#e3e3e3]'}`}><div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(item.severityLabel)}>{item.severityLabel}</FindingPill></div><p className="text-[12px] font-normal leading-[16.8px] text-[#131313]">{item.condition ?? '—'}</p></div>)}</div></GeneralSection><ResponsiblesSection detail={detail} /></div></div>;
}

function DetailContent({ activeTab, detail }: { activeTab: HistoryTab; detail: InspectionDetailResponse }) {
  if (activeTab === 'followups') return <FollowupsPanel detail={detail} />;
  if (activeTab === 'general') return <GeneralPanel detail={detail} />;
  return <ObservationsPanel detail={detail} />;
}

function DownloadPdfButton({ inspectionId }: { inspectionId: string }) {
  return <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[15.5px] py-[1.5px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold leading-none text-[#333]" onClick={() => window.open(`${apiOrigin}/api/inspections/${inspectionId}/export/pdf`, '_blank')}><InspectionDetailPdfIcon />Descargar PDF</button></div>;
}

export function InspectionHistoryDetailModal({ open, record, detail, onClose }: { open: boolean; record: InspectionDetailModalRecord; detail: InspectionDetailResponse; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('observations');

  if (!open) return null;
  return <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]"><div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]"><section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col justify-between overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true" aria-labelledby="inspection-history-detail-title"><div className="flex min-h-0 flex-1 flex-col"><div className="shrink-0 rounded-t-[16px] bg-white px-[14px] py-[12px]"><div className="flex items-center gap-[12px]"><div className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] font-bold"><p className="whitespace-nowrap text-[13px] leading-none text-[#001e39]">{record.id}</p><h2 id="inspection-history-detail-title" className="mt-[5px] text-[16px] font-bold leading-[22px] tracking-[0.32px] text-[#2a2a2a]">{record.title}</h2><div className="mt-[4px]">{metadataFor(record)}</div></div><button type="button" className="flex size-[32px] shrink-0 items-center justify-center" onClick={onClose} aria-label="Cerrar detalle"><InspectionDetailCloseIcon /></button></div></div><Tabs activeTab={activeTab} onChange={setActiveTab} /><DetailContent activeTab={activeTab} detail={detail} /></div><DownloadPdfButton inspectionId={detail.header.inspectionId} /></section></div></div>;
}
