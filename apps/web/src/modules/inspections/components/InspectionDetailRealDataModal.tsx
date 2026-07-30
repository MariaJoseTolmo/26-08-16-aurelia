import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingGroupKey,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
  InspectionDetailResponsibleResponse,
  UserResponse,
} from '@aurelia/contracts';
import { env } from '../../../shared/config/env';
import { useInspectionFindingActions } from '../../../shared/hooks/useInspectionFindingActions';
import { getCompanyUsers } from '../../../shared/services/inspections.service';
import { FindingExecutionModeView } from './FindingExecutionModeView';
import { FindingRejectDialog, ObservationRejectedToast } from './FindingRejectDialog';
import { FindingSlaReassignSheet } from './FindingSlaReassignSheet';
import { InspectionChecklistResultPanel } from './InspectionChecklistResultPanel';
import {
  InspectionDetailApproveIcon,
  InspectionDetailAssignIcon,
  InspectionDetailCameraIcon,
  InspectionDetailCaretDownIcon,
  InspectionDetailCloseIcon,
  InspectionDetailFollowupIcon,
  InspectionDetailImageIcon,
  InspectionDetailListIcon,
  InspectionDetailLocationIcon,
  InspectionDetailPdfIcon,
  InspectionDetailPersonIcon,
  InspectionDetailRejectIcon,
  InspectionDetailStatusChipIcon,
  InspectionDetailStatusRowIcon,
  type InspectionDetailIconStatus,
} from './InspectionDetailIcons';
import type { InspectionDetailModalKind, InspectionDetailModalRecord } from './InspectionDetailModal';

type StatusKey = InspectionDetailIconStatus;
type DetailTab = 'observations' | 'result' | 'followups' | 'general';

type FollowupStep = {
  id: string;
  title: string;
  date: string;
  summary?: string;
  bullets?: string[];
  completed: boolean;
  occurredAt?: string | null;
};

type StatusConfig = {
  key: StatusKey;
  label: string;
  itemLabel: string;
  textClass: string;
  chipClass: string;
};

type ExecutionTarget = { item: InspectionDetailFindingItemResponse; index: number };

const apiOrigin = env.apiUrl.replace(/\/api\/?$/, '');
const statuses: StatusConfig[] = [
  { key: 'executed', label: 'Ejecutadas', itemLabel: 'Ejecutado', textClass: 'text-[#570b1d]', chipClass: 'bg-[#ffd0db] text-[#570b1d]' },
  { key: 'open', label: 'Abiertas', itemLabel: 'Abierto', textClass: 'text-[#463100]', chipClass: 'bg-[#ffeab8] text-[#463100]' },
  { key: 'closed', label: 'Cerradas', itemLabel: 'Cerrado', textClass: 'text-[#2a5c16]', chipClass: 'bg-[#e0ffd3] text-[#2a5c16]' },
  { key: 'rejected', label: 'Rechazadas', itemLabel: 'Rechazado', textClass: 'text-[#646464]', chipClass: 'bg-[#f7f7f7] text-[#646464]' },
];

function tabsFor(kind: InspectionDetailModalKind) {
  if (kind === 'checklist') return [
    { id: 'observations' as const, label: 'Ítems No' },
    { id: 'result' as const, label: 'Resultado completo' },
    { id: 'followups' as const, label: 'Seguimientos' },
    { id: 'general' as const, label: 'Datos generales' },
  ];
  return [
    { id: 'observations' as const, label: 'Observaciones' },
    { id: 'followups' as const, label: 'Seguimientos' },
    { id: 'general' as const, label: 'Datos generales' },
  ];
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'dd-mm-aaaa · 00:00';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'dd-mm-aaaa · 00:00';
  return `${formatDate(value)} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function timestamp(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? Number.MAX_SAFE_INTEGER : result;
}

function businessDaysUntil(value: string | null | undefined) {
  if (!value) return 0;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  let days = 0;
  while (cursor.getTime() < due.getTime()) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days += 1;
  }
  return days;
}

function businessDaysLabel(value: string | null | undefined, fallback = 'X días hábiles') {
  if (!value) return fallback;
  const days = businessDaysUntil(value);
  return `${days} ${days === 1 ? 'día hábil' : 'días hábiles'}`;
}

function allFindings(detail: InspectionDetailResponse) {
  return statuses.flatMap((status) => detail.findings[status.key]);
}

function severityClass(label: string) {
  const value = label.toLowerCase();
  if (value.includes('crít') || value.includes('critic')) return 'bg-[#ffd0db] text-[#570b1d]';
  if (value.includes('alto')) return 'bg-[#ffe1cd] text-[#532a0e]';
  if (value.includes('moder')) return 'bg-[#fbe1d0] text-[#69462e]';
  return 'bg-[#e0ffd3] text-[#2a5c16]';
}

function evidenceUrl(evidence: InspectionDetailEvidenceResponse | undefined) {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  return evidence.url.startsWith('/api/') ? `${apiOrigin}${evidence.url}` : evidence.url;
}

function metadata(record: InspectionDetailModalRecord) {
  return <div className="text-[11px] font-bold leading-none text-[#646464]"><p>{record.metadataLine1}</p>{record.metadataLine2 ? <p className="mt-[3px]">{record.metadataLine2}</p> : null}</div>;
}

function StatusChip({ status, count }: { status: StatusKey; count: number }) {
  const config = statuses.find((item) => item.key === status) ?? statuses[0];
  return <span className={`inline-flex h-[16px] items-center gap-[3px] rounded-[5px] px-[7px] py-[2px] text-[10px] font-semibold ${config.chipClass}`}><InspectionDetailStatusChipIcon status={status} />{count} {config.label}</span>;
}

function Progress({ detail }: { detail: InspectionDetailResponse }) {
  return <div className="shrink-0 bg-[#143049] px-[14px] py-[10px] text-white"><div className="flex items-center justify-between text-[10px]"><span className="text-white/50">Progreso de observaciones</span><strong>{detail.header.progressPercent}%</strong></div><div className="mt-[5px] h-[5px] overflow-hidden rounded-[3px] bg-white/15"><div className="h-full rounded-[3px] bg-[#e0ffd3]" style={{ width: `${Math.max(0, Math.min(100, detail.header.progressPercent))}%` }} /></div><div className="mt-[6px] flex flex-wrap gap-[5px]">{statuses.map((status) => <StatusChip key={status.key} status={status.key} count={detail.header.counts[status.key]} />)}</div></div>;
}

function Tabs({ kind, active, onChange }: { kind: InspectionDetailModalKind; active: DetailTab; onChange: (value: DetailTab) => void }) {
  const tabs = tabsFor(kind);
  return <div className="grid shrink-0 border-b-2 border-[#e3e3e3] bg-[#f7f7f7]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`flex h-[39px] items-center justify-center border-b-2 px-[5px] pb-[2px] text-center text-[12px] font-semibold ${active === tab.id ? 'border-[#c8a064] text-[#8e6e3e]' : 'border-transparent text-[#646464]'}`}>{tab.label}</button>)}</div>;
}

function Evidence({ title, evidences, closed }: { title: string; evidences: InspectionDetailEvidenceResponse[]; closed?: boolean }) {
  const item = evidences[0];
  const url = evidenceUrl(item);
  return <div className="flex h-[91px] min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-[#e3e3e3] bg-white"><div className="flex h-[20px] items-center bg-[#001e39] px-[8px]"><span className="text-[9px] font-bold uppercase text-white/70">{title}</span></div><div className={`flex flex-1 items-center justify-center overflow-hidden ${closed ? 'bg-[#dafccb]' : 'bg-gradient-to-br from-[#e8f4fd] to-[#c8e6f0]'}`}>{url ? <img src={url} alt={item?.title ?? title} className="h-full w-full object-cover" /> : <span className="text-[11px] text-[#acacac]">{closed ? 'Sin evidencia' : 'Pendiente EECC'}</span>}</div></div>;
}

function FindingCard({
  inspectionId,
  item,
  index,
  actions,
  onExecute,
  onReject,
  onSlaSuccess,
}: {
  inspectionId: string;
  item: InspectionDetailFindingItemResponse;
  index: number;
  actions: ReturnType<typeof useInspectionFindingActions>;
  onExecute: () => void;
  onReject: () => void;
  onSlaSuccess: () => void;
}) {
  const [slaOpen, setSlaOpen] = useState(false);
  const config = statuses.find((entry) => entry.key === item.statusGroup) ?? statuses[1];
  const status = item.statusGroup;

  async function reassign(days: number, reason: string) {
    await actions.reassignFindingSla(inspectionId, item.findingId, days, reason);
    setSlaOpen(false);
    onSlaSuccess();
  }

  return <article className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between gap-[8px]"><div className="flex items-center gap-[8px]"><span className="rounded-[6px] bg-[#e6f3ff] px-[8px] py-[4px] text-[11px] font-bold text-[#24588b]">Obs. {index + 1}</span><span className={`rounded-[6px] px-[8px] py-[4px] text-[11px] font-bold ${severityClass(item.severityLabel)}`}>{item.severityLabel}</span></div><span className={`inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold ${config.chipClass}`}><InspectionDetailStatusChipIcon status={status} />{config.itemLabel}</span></div><div className="mt-[12px] space-y-[4px]"><div className="rounded-[8px] border border-[#e3e3e3] bg-white px-[10px] py-[8px]"><p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#646464]">Condición detectada</p><p className="mt-[3px] text-[12px] leading-[17px] text-[#131313]">{item.condition || '—'}</p></div><div className="rounded-[8px] bg-white px-[10px] py-[8px]"><p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#646464]">Medida correctiva propuesta</p><p className="mt-[3px] text-[12px] leading-[17px] text-[#131313]">{item.proposedCorrectiveAction || '—'}</p></div>{status !== 'open' ? <div className="rounded-[8px] bg-white px-[10px] py-[8px]"><p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#646464]">Descripción de la acción tomada</p><p className="mt-[3px] text-[12px] leading-[17px] text-[#131313]">{item.executedActionDescription || '—'}</p></div> : null}</div><div className="mt-[8px] flex gap-[4px]"><Evidence title="Antes" evidences={item.beforeEvidence} /><Evidence title="Después" evidences={item.afterEvidence} closed={status === 'closed' || status === 'executed' || status === 'rejected'} /></div>{status === 'open' ? <div className="mt-[8px] flex min-h-[64px] items-center justify-between rounded-[10px] border-[1.5px] border-[#d1d1d1] bg-[#f7f7f7] px-[15px]"><div><p className="text-[9px] font-bold uppercase tracking-[.6px] text-[#333]">SLA calculado</p><p className="mt-[2px] text-[20px] font-bold leading-none text-[#532a0e]">{businessDaysLabel(item.dueAt)}</p></div>{actions.canReassign ? <button type="button" onClick={() => setSlaOpen(true)} disabled={actions.isPending} className="h-[40px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[15px] text-[13px] font-semibold text-[#333] disabled:opacity-50">Reasignar SLA</button> : null}</div> : null}{status === 'open' && actions.canExecute ? <button type="button" onClick={onExecute} disabled={actions.isPending} className="mt-[8px] h-[52px] w-full rounded-[14px] bg-[#c8a064] text-[15px] font-bold text-white disabled:opacity-50">Ejecutar observación</button> : null}{status === 'executed' && actions.canReview ? <div className="mt-[8px] flex gap-[8px]"><button type="button" onClick={onReject} disabled={actions.isPending} className="flex h-[40px] items-center justify-center gap-[5px] rounded-[9px] border-2 border-[#c4365a] px-[16px] text-[12px] font-bold text-[#570b1d]"><InspectionDetailRejectIcon />Rechazar</button><button type="button" onClick={() => actions.approveFinding(inspectionId, item.findingId)} disabled={actions.isPending} className="flex h-[40px] flex-1 items-center justify-center gap-[5px] rounded-[9px] bg-[#3a9b3a] text-[12px] font-bold text-white"><InspectionDetailApproveIcon />Aprobar cierre</button></div> : null}<FindingSlaReassignSheet visible={slaOpen} calculatedLabel={businessDaysLabel(item.dueAt)} pending={actions.isPending} onClose={() => setSlaOpen(false)} onApply={reassign} /></article>;
}

function Observations({ detail, actions, onExecute, onReject, onSlaSuccess }: { detail: InspectionDetailResponse; actions: ReturnType<typeof useInspectionFindingActions>; onExecute: (item: InspectionDetailFindingItemResponse, index: number) => void; onReject: (item: InspectionDetailFindingItemResponse) => void; onSlaSuccess: () => void }) {
  const [expanded, setExpanded] = useState<StatusKey | null>('open');
  let globalIndex = 0;
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white">{statuses.map((status) => { const items = detail.findings[status.key] ?? []; const indices = items.map(() => globalIndex++); const open = expanded === status.key; return <section key={status.key}><button type="button" onClick={() => setExpanded((current) => current === status.key ? null : status.key)} className="flex h-[56px] w-full items-center justify-between border-b border-[#e3e3e3] px-[14px]"><div className="flex items-center gap-[10px]"><InspectionDetailStatusRowIcon status={status.key} /><span className={`text-[11px] font-bold uppercase tracking-[.66px] ${status.textClass}`}>{status.label}</span><span className={`rounded-[8px] px-[7px] text-[10px] font-bold ${status.chipClass}`}>{items.length}</span></div><InspectionDetailCaretDownIcon className={open ? 'size-[16px] rotate-180' : 'size-[16px]'} /></button>{open ? <div className="space-y-[24px] px-[14px] py-[14px]">{items.length ? items.map((item, position) => <FindingCard key={item.findingId} inspectionId={detail.header.inspectionId} item={item} index={indices[position]} actions={actions} onExecute={() => onExecute(item, indices[position])} onReject={() => onReject(item)} onSlaSuccess={onSlaSuccess} />) : <p className="py-[20px] text-center text-[12px] text-[#646464]">No hay observaciones {status.label.toLowerCase()}.</p>}</div> : null}</section>; })}</div>;
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const total = findings.length;
  const percent = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (occurredAt: string | null) => {
    const closed = occurredAt ? findings.filter((item) => item.closedAt && timestamp(item.closedAt) <= timestamp(occurredAt)).length : detail.header.counts.closed;
    const normalized = Math.max(0, Math.min(total, closed));
    return [`Observaciones cerradas: ${normalized} obs / ${percent(normalized)}%`, `Observaciones pendientes: ${Math.max(0, total - normalized)} obs / ${percent(Math.max(0, total - normalized))}%`];
  };
  const grouped = new Map<number, typeof detail.followups>();
  detail.followups.forEach((item) => grouped.set(item.sequenceNumber, [...(grouped.get(item.sequenceNumber) ?? []), item]));
  let recorded = Array.from(grouped.entries()).sort(([a], [b]) => a - b).map(([sequenceNumber, records]) => {
    const dates = records.map((record) => record.performedAt).filter((value): value is string => Boolean(value)).sort((a, b) => timestamp(a) - timestamp(b));
    const occurredAt = dates.at(-1) ?? null;
    const completed = records.some((record) => record.completed);
    return { id: `followup-${sequenceNumber}`, title: `Seguimiento ${sequenceNumber}`, date: completed ? formatDate(occurredAt) : '—', bullets: completed ? bulletsAt(occurredAt) : undefined, completed, occurredAt } satisfies FollowupStep;
  });
  if (!recorded.length) {
    const dates = findings.flatMap((item) => [item.executedAt, item.rejectedAt, item.closedAt]).filter((value): value is string => Boolean(value));
    recorded = [...new Set(dates.map((value) => new Date(value).toISOString().slice(0, 10)))].sort().slice(0, 3).map((date, index) => ({ id: `derived-${index + 1}`, title: `Seguimiento ${index + 1}`, date: formatDate(date), bullets: bulletsAt(date), completed: true, occurredAt: date }));
  }
  const bySequence = new Map(recorded.map((step, index) => [index + 1, step]));
  const followups = Array.from({ length: Math.max(3, recorded.length) }, (_, index) => bySequence.get(index + 1) ?? ({ id: `pending-${index + 1}`, title: `Seguimiento ${index + 1}`, date: '—', completed: false, occurredAt: null } satisfies FollowupStep));
  const completedFollowups = followups.filter((step) => step.completed);
  const pendingFollowups = followups.filter((step) => !step.completed);
  const slaSteps = (detail.slaReassignments ?? []).map((event) => ({
    id: `sla-${event.id}`,
    title: `Observación “${event.findingNumber}” SLA reasignado`,
    date: formatDate(event.reassignedAt),
    bullets: [
      `SLA anterior: ${event.previousSlaBusinessDays} ${event.previousSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`,
      `Nuevo SLA: ${event.newSlaBusinessDays} ${event.newSlaBusinessDays === 1 ? 'día hábil' : 'días hábiles'}`,
      `Motivo: ${event.reason}`,
    ],
    completed: true,
    occurredAt: event.reassignedAt,
  } satisfies FollowupStep));
  const activities = [...completedFollowups, ...slaSteps].sort((left, right) => timestamp(left.occurredAt) - timestamp(right.occurredAt));
  return [{ id: 'initial', title: 'Inspección inicial', date: formatDate(detail.general.scheduledAt), summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`, completed: true, occurredAt: detail.general.scheduledAt }, ...activities, ...pendingFollowups];
}

function TimelineMarker({ completed }: { completed: boolean }) {
  return completed ? <span className="flex size-[24px] items-center justify-center rounded-full bg-[#6cc24a] text-[12px] font-bold text-white">✓</span> : <span className="flex size-[24px] items-center justify-center rounded-full bg-[#e3e3e3]"><span className="size-[9px] rounded-full border border-[#acacac]" /></span>;
}

function Followups({ detail }: { detail: InspectionDetailResponse }) {
  const steps = buildFollowupSteps(detail);
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[20px]"><div className="flex items-center gap-[6px]"><InspectionDetailFollowupIcon /><p className="text-[11px] font-bold uppercase tracking-[.55px] text-[#646464]">Historial de seguimientos</p></div><div className="pt-[10px]">{steps.map((step, index) => <div key={step.id} className="flex gap-[12px]"><div className="flex w-[24px] flex-col items-center"><TimelineMarker completed={step.completed} />{index < steps.length - 1 ? <div className="min-h-[16px] w-[2px] flex-1 bg-[#e3e3e3]" /> : null}</div><div className={`min-w-0 flex-1 pt-[2px] ${index < steps.length - 1 ? 'pb-[16px]' : ''}`}><p className="text-[12px] font-bold text-[#131313]">{step.title}</p><p className="pt-[4px] text-[11px] text-[#646464]">{step.date}</p>{step.summary ? <p className="pt-[5px] text-[11px] text-[#646464]">{step.summary}</p> : null}{step.bullets ? <ul className="list-disc pl-[20px] pt-[4px] text-[11px] leading-[15px] text-[#646464]">{step.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</div></div>)}</div></div>;
}

function GeneralSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]"><div className="flex h-[29px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]"><span>{icon}</span><p className="text-[10px] font-bold uppercase tracking-[.5px] text-[#646464]">{title}</p></div>{children}</section>;
}

function InfoRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return <div>{rows.map((row, index) => <div key={row.label} className={`flex items-center justify-between px-[12px] py-[9px] ${index < rows.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><span className="text-[12px] font-medium text-[#646464]">{row.label}</span><strong className="max-w-[60%] text-right text-[12px] text-[#131313]">{row.value}</strong></div>)}</div>;
}

function General({ detail, canReassign, onOpenReassign }: { detail: InspectionDetailResponse; canReassign: boolean; onOpenReassign: () => void }) {
  const general = detail.general;
  const observations = allFindings(detail);
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[14px]"><div className="space-y-[12px]"><GeneralSection icon={<InspectionDetailPersonIcon />} title="Quién realizó la inspección"><InfoRows rows={[{ label: 'Nombre', value: general.inspectorName ?? '—' }, { label: 'Empresa', value: general.inspectorCompanyName ?? general.companyName ?? '—' }]} /></GeneralSection><GeneralSection icon={<InspectionDetailLocationIcon />} title="Donde y cuándo"><InfoRows rows={[{ label: 'Área · Sector', value: [general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—' }, { label: 'Fecha', value: formatDate(general.scheduledAt) }, { label: 'Tipo', value: detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo' }, { label: 'Ubicación UTM', value: general.latitude && general.longitude ? `${general.latitude} · ${general.longitude}` : general.locationLabel ?? '—' }]} /></GeneralSection>{general.generalEvidence.length ? <GeneralSection icon={<InspectionDetailCameraIcon />} title="Fotografía general de la inspección"><div className="px-[12px] py-[9px]"><Evidence title="Foto general" evidences={general.generalEvidence} /></div></GeneralSection> : null}<GeneralSection icon={<InspectionDetailListIcon />} title={`Observaciones (${observations.length})`}><div>{observations.map((item, index) => <div key={item.findingId} className={`px-[12px] py-[10px] ${index < observations.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><div className="flex gap-[8px]"><span className="rounded bg-[#e6f3ff] px-[7px] py-[3px] text-[10px] font-bold text-[#24588b]">Obs. {index + 1}</span><span className={`rounded px-[7px] py-[3px] text-[10px] font-bold ${severityClass(item.severityLabel)}`}>{item.severityLabel}</span></div><p className="pt-[8px] text-[12px] text-[#131313]">{item.condition ?? '—'}</p><div className="mt-[10px] flex justify-between border-t border-[#e3e3e3] pt-[10px]"><span className="text-[12px] text-[#646464]">SLA calculado</span><strong className="text-[12px]">{businessDaysLabel(item.dueAt, '—')}</strong></div></div>)}</div></GeneralSection><GeneralSection icon={<InspectionDetailPersonIcon />} title="Responsables"><InfoRows rows={[{ label: 'EECC', value: observations.find((item) => item.responsibleCompanyName)?.responsibleCompanyName ?? general.companyName ?? '—' }]} /><div>{general.responsibles.map((responsible, index) => <div key={responsible.userId} className={`px-[12px] py-[10px] ${index < general.responsibles.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><strong className="text-[12px]">{responsible.fullName}</strong><p className="pt-[3px] text-[11px] text-[#646464]">{responsible.position ?? 'Sin cargo'}</p></div>)}</div>{canReassign ? <div className="border-t border-[#e3e3e3] px-[12px] py-[9px]"><button type="button" onClick={onOpenReassign} className="flex h-[42px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-dashed border-[#d1d1d1] bg-[#f7f7f7] text-[12px] font-semibold text-[#24588b]"><InspectionDetailAssignIcon />Reasignar responsables</button></div> : null}</GeneralSection></div></div>;
}

function ReassignPrompt({ open, options, selected, onToggle, onCancel, onConfirm }: { open: boolean; options: InspectionDetailResponsibleResponse[]; selected: string[]; onToggle: (id: string) => void; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-[14px]"><div className="w-[332px] max-w-full rounded-[16px] bg-white px-[14px] pb-[24px] pt-[16px]"><p className="text-[14px] font-bold">Reasignar hallazgo</p><div className="mt-[18px] max-h-[280px] overflow-y-auto">{options.map((option) => <button key={option.userId} type="button" onClick={() => onToggle(option.userId)} className="flex w-full items-center justify-between border-b border-[#e3e3e3] py-[12px] text-left"><div><strong className="text-[13px]">{option.fullName}</strong><p className="pt-[3px] text-[11px] text-[#646464]">{option.position ?? 'Sin cargo'}</p></div><span className={`flex size-[22px] items-center justify-center rounded-full border-2 ${selected.includes(option.userId) ? 'border-[#00b398] bg-[#00b398] text-white' : 'border-[#d1d1d1]'}`}>{selected.includes(option.userId) ? '✓' : ''}</span></button>)}</div><div className="mt-[24px] flex gap-[8px]"><button type="button" onClick={onCancel} className="h-[44px] flex-1 rounded-[14px] border-2 border-[#c8a064] font-bold text-[#c8a064]">Cancelar</button><button type="button" onClick={onConfirm} className="h-[44px] flex-1 rounded-[14px] bg-[#c8a064] font-bold text-white">Reasignar</button></div></div></div>;
}

function SlaToast({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return <button type="button" onClick={onClose} className="absolute bottom-[68px] left-[14px] right-[14px] z-40 flex min-h-[58px] items-center gap-[10px] rounded-[8px] bg-[#4ca52f] px-[14px] py-[12px] text-left text-[13px] font-bold leading-[18px] text-white shadow-lg"><span className="flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-white">✓</span>SLA modificado. El motivo se ha registrado en la tab “Seguimiento”.</button>;
}

function DownloadPdf({ inspectionId }: { inspectionId: string }) {
  return <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" onClick={() => window.open(`${apiOrigin}/api/inspections/${inspectionId}/export/pdf`, '_blank')} className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] text-[13px] font-semibold text-[#333]"><InspectionDetailPdfIcon />Descargar PDF</button></div>;
}

export function InspectionDetailRealDataModal({ open, record, detail, onClose }: { open: boolean; record: InspectionDetailModalRecord; detail: InspectionDetailResponse; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTab>('observations');
  const [executionTarget, setExecutionTarget] = useState<ExecutionTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InspectionDetailFindingItemResponse | null>(null);
  const [rejectedToast, setRejectedToast] = useState(false);
  const [slaToast, setSlaToast] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const actions = useInspectionFindingActions();
  const currentResponsibleIds = detail.general.responsibles.map((item) => item.userId);
  const [selectedResponsibleIds, setSelectedResponsibleIds] = useState(currentResponsibleIds);
  const findingIds = useMemo(() => allFindings(detail).map((item) => item.findingId), [detail]);
  const companyId = allFindings(detail).find((item) => item.responsibleCompanyId)?.responsibleCompanyId ?? detail.general.responsibles.find((item) => item.companyId)?.companyId ?? null;
  const usersQuery = useQuery({ queryKey: ['inspections', 'responsible-users', companyId], queryFn: () => getCompanyUsers(companyId ?? ''), enabled: open && reassignOpen && Boolean(companyId), staleTime: 60_000 });
  const responsibleOptions = useMemo(() => (usersQuery.data ?? []).map((user: UserResponse) => ({ userId: user.id, fullName: user.fullName, position: user.position, companyId: user.companyId, companyName: user.companies?.find((company) => company.id === user.companyId)?.name ?? null, currentUser: currentResponsibleIds.includes(user.id) })), [usersQuery.data, currentResponsibleIds.join('|')]);

  useEffect(() => { setSelectedResponsibleIds(currentResponsibleIds); }, [currentResponsibleIds.join('|')]);
  useEffect(() => { if (!rejectedToast) return; const timer = window.setTimeout(() => setRejectedToast(false), 4500); return () => window.clearTimeout(timer); }, [rejectedToast]);
  useEffect(() => { if (!slaToast) return; const timer = window.setTimeout(() => setSlaToast(false), 5000); return () => window.clearTimeout(timer); }, [slaToast]);
  if (!open) return null;

  async function reject(reason: string) {
    if (!rejectTarget) return;
    await actions.rejectFindingAsync(detail.header.inspectionId, rejectTarget.findingId, reason);
    setRejectTarget(null);
    setRejectedToast(true);
  }

  async function confirmResponsibles() {
    await actions.reassignResponsibleUsers(detail.header.inspectionId, findingIds, selectedResponsibleIds);
    setReassignOpen(false);
  }

  return <div className="fixed inset-0 z-[1000] bg-black/70"><div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]"><section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,.35)]" role="dialog" aria-modal="true"><div className="shrink-0 rounded-t-[16px] bg-white px-[14px] py-[12px]"><div className="flex items-center gap-[12px]"><div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-[#001e39]">{record.id}</p><h2 className="mt-[5px] text-[16px] font-bold leading-[22px] text-[#2a2a2a]">{record.title}</h2><div className="mt-[4px]">{metadata(record)}</div></div><button type="button" onClick={onClose} className="flex size-[32px] items-center justify-center" aria-label="Cerrar"><InspectionDetailCloseIcon /></button></div></div><Progress detail={detail} /><Tabs kind={record.kind} active={activeTab} onChange={setActiveTab} />{activeTab === 'observations' ? <Observations detail={detail} actions={actions} onExecute={(item, index) => actions.canExecute && setExecutionTarget({ item, index })} onReject={(item) => actions.canReview && setRejectTarget(item)} onSlaSuccess={() => setSlaToast(true)} /> : null}{activeTab === 'followups' ? <Followups detail={detail} /> : null}{activeTab === 'general' ? <General detail={detail} canReassign={actions.canReassign} onOpenReassign={() => setReassignOpen(true)} /> : null}{activeTab === 'result' && detail.header.kind === 'checklist' ? <InspectionChecklistResultPanel result={detail.checklistResult} /> : null}<DownloadPdf inspectionId={detail.header.inspectionId} /><ReassignPrompt open={reassignOpen && actions.canReassign} options={responsibleOptions.length ? responsibleOptions : detail.general.responsibles} selected={selectedResponsibleIds} onToggle={(id) => setSelectedResponsibleIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onCancel={() => setReassignOpen(false)} onConfirm={() => { void confirmResponsibles(); }} /><FindingRejectDialog open={Boolean(rejectTarget) && actions.canReview} isSubmitting={actions.isPending} onClose={() => setRejectTarget(null)} onConfirm={reject} /><ObservationRejectedToast visible={rejectedToast} onClose={() => setRejectedToast(false)} /><SlaToast visible={slaToast} onClose={() => setSlaToast(false)} />{executionTarget && actions.canExecute ? <FindingExecutionModeView subtitle={detail.general.sectorName ?? detail.general.areaName ?? detail.general.locationLabel ?? detail.general.companyName ?? '—'} inspectionLabel={`${record.id} · ${record.title}`} item={executionTarget.item} index={executionTarget.index} isSubmitting={actions.isPending} onBack={() => setExecutionTarget(null)} onCancel={() => setExecutionTarget(null)} onStartAssistant={() => { const description = window.prompt('Describe la acción ejecutada', executionTarget.item.proposedCorrectiveAction ?? '')?.trim(); if (description !== undefined) { actions.executeFinding(detail.header.inspectionId, executionTarget.item.findingId, description || executionTarget.item.proposedCorrectiveAction); setExecutionTarget(null); } }} onStartManual={async (description, file) => { await actions.executeFindingWithAfterEvidence({ inspectionId: detail.header.inspectionId, findingId: executionTarget.item.findingId, executedActionDescription: description, file, latitude: detail.general.latitude, longitude: detail.general.longitude }); setExecutionTarget(null); }} /> : null}</section></div></div>;
}
