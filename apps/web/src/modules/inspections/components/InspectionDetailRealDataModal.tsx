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
import { InspectionChecklistResultPanel } from './InspectionChecklistResultPanel';
import { FindingRejectDialog, ObservationRejectedToast } from './FindingRejectDialog';
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
import { SlaReassignSheet } from './SlaReassignSheet';

type StatusKey = InspectionDetailIconStatus;
type DetailTab = 'observations' | 'result' | 'followups' | 'general';

type StatusConfig = {
  key: StatusKey;
  label: string;
  chipLabel: string;
  itemLabel: string;
  textClass: string;
  chipClass: string;
};

type TabConfig = {
  id: DetailTab;
  label: string;
};

type FollowupStep = {
  id: string;
  title: string;
  date: string;
  summary?: string;
  completed: boolean;
  occurredAt?: string | null;
};

type GeneralInfoRow = {
  label: string;
  value: string;
  mono?: boolean;
};

type ExecutionTarget = {
  item: InspectionDetailFindingItemResponse;
  index: number;
};

type DetailRowsProps = {
  inspectionId: string;
  counts: Record<InspectionDetailFindingGroupKey, number>;
  findings: Record<InspectionDetailFindingGroupKey, InspectionDetailFindingItemResponse[]>;
  actions: ReturnType<typeof useInspectionFindingActions>;
  onRequestExecutionMode: (item: InspectionDetailFindingItemResponse, index: number) => void;
  onRequestReject: (item: InspectionDetailFindingItemResponse) => void;
};

type FindingObservationCardProps = {
  inspectionId: string;
  item: InspectionDetailFindingItemResponse;
  actions: ReturnType<typeof useInspectionFindingActions>;
  index: number;
  onRequestExecutionMode: (item: InspectionDetailFindingItemResponse, index: number) => void;
  onRequestReject: (item: InspectionDetailFindingItemResponse) => void;
};

const API_URL = env.apiUrl;
const apiOrigin = API_URL.replace(/\/api\/?$/, '');

const statusConfigByKey: Record<StatusKey, StatusConfig> = {
  executed: { key: 'executed', label: 'Ejecutadas', chipLabel: 'Ejecutada', itemLabel: 'Ejecutado', textClass: 'text-[#570b1d]', chipClass: 'bg-[#ffd0db] text-[#570b1d]' },
  open: { key: 'open', label: 'Abiertas', chipLabel: 'Abiertas', itemLabel: 'Abierto', textClass: 'text-[#463100]', chipClass: 'bg-[#ffeab8] text-[#463100]' },
  closed: { key: 'closed', label: 'Cerradas', chipLabel: 'Cerrada', itemLabel: 'Cerrado', textClass: 'text-[#2a5c16]', chipClass: 'bg-[#e0ffd3] text-[#2a5c16]' },
  rejected: { key: 'rejected', label: 'Rechazadas', chipLabel: 'Rechazada', itemLabel: 'Rechazado', textClass: 'text-[#646464]', chipClass: 'bg-[#f7f7f7] text-[#646464]' },
};

const emptyStatusMessage: Record<StatusKey, string> = {
  executed: 'No hay observaciones ejecutadas.',
  open: 'No hay observaciones abiertas.',
  closed: 'No hay observaciones cerradas.',
  rejected: 'No hay observaciones rechazadas.',
};

const statusConfigs = Object.values(statusConfigByKey);
const avatarColors = ['bg-[#c8a064] text-[#001e39]', 'bg-[#24588b] text-white', 'bg-[#00b398] text-white', 'bg-[#532a0e] text-white'];

function getTabs(kind: InspectionDetailModalKind): TabConfig[] {
  if (kind === 'checklist') return [{ id: 'observations', label: 'Ítems No' }, { id: 'result', label: 'Resultado completo' }, { id: 'followups', label: 'Seguimientos' }, { id: 'general', label: 'Datos generales' }];
  return [{ id: 'observations', label: 'Observaciones' }, { id: 'followups', label: 'Seguimientos' }, { id: 'general', label: 'Datos generales' }];
}

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

function daysLabel(value: string | null | undefined, fallback = 'XX días') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return `${days} días`;
}

function dueDateFromDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.MAX_SAFE_INTEGER;
  return date.getTime();
}

function severityClassName(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('crítico') || normalized.includes('critico')) return 'bg-[#ffd0db] text-[#570b1d]';
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

function evidenceLabel(evidence: InspectionDetailEvidenceResponse, index: number) {
  return evidence.title ?? evidence.description ?? `Evidencia ${index + 1}`;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function allFindings(detail: InspectionDetailResponse) {
  return statusConfigs.flatMap((config) => detail.findings[config.key]);
}

function primaryResponsibleCompany(detail: InspectionDetailResponse) {
  return allFindings(detail).find((item) => item.responsibleCompanyName)?.responsibleCompanyName ?? detail.general.companyName ?? '—';
}

function primaryResponsibleCompanyId(detail: InspectionDetailResponse) {
  return allFindings(detail).find((item) => item.responsibleCompanyId)?.responsibleCompanyId ?? detail.general.responsibles.find((responsible) => responsible.companyId)?.companyId ?? null;
}

function executionLocationLabel(detail: InspectionDetailResponse) {
  return detail.general.sectorName ?? detail.general.areaName ?? detail.general.locationLabel ?? detail.general.companyName ?? '—';
}

function mapResponsibleCandidate(user: UserResponse, currentResponsibles: InspectionDetailResponsibleResponse[]): InspectionDetailResponsibleResponse {
  const current = currentResponsibles.find((responsible) => responsible.userId === user.id);
  const companyName = user.companies?.find((company) => company.id === user.companyId)?.name ?? current?.companyName ?? null;
  return {
    userId: user.id,
    fullName: user.fullName,
    position: user.position,
    companyId: user.companyId,
    companyName,
    currentUser: current?.currentUser ?? false,
  };
}

function StatusChip({ status, count }: { status: StatusKey; count: number }) {
  const config = statusConfigByKey[status];
  return <span className={`inline-flex h-[16px] items-center gap-[3px] rounded-[5px] px-[7px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-none ${config.chipClass}`}><InspectionDetailStatusChipIcon status={status} />{count} {config.chipLabel}</span>;
}

function ProgressSummary({ counts, progressPercent }: { counts: Record<InspectionDetailFindingGroupKey, number>; progressPercent: number }) {
  return <div className="flex shrink-0 flex-col items-start bg-[#143049] px-[14px] py-[10px] text-white"><div className="flex h-[12px] w-full items-start justify-between"><p className="font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-none text-[rgba(255,255,255,0.5)]">Progreso de observaciones</p><p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-none text-white">{progressPercent}%</p></div><div className="w-full pt-[5px]"><div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[rgba(255,255,255,0.15)]"><div className="h-[5px] rounded-[3px] bg-[#e0ffd3]" style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} /></div></div><div className="flex w-full flex-wrap gap-[5px] pt-[6px]">{statusConfigs.map((item) => <StatusChip key={item.key} status={item.key} count={counts[item.key]} />)}</div></div>;
}

function Tabs({ kind, activeTab, onChange }: { kind: InspectionDetailModalKind; activeTab: DetailTab; onChange: (tab: DetailTab) => void }) {
  const tabs = getTabs(kind);
  return <div className="grid shrink-0 border-b-2 border-[#e3e3e3] bg-[#f7f7f7]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`flex h-[37px] items-center justify-center border-b-2 px-[6px] pb-[2px] text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-[14px] ${tab.id === activeTab ? 'border-[#c8a064] text-[#8e6e3e]' : 'border-transparent text-[#646464]'}`}>{tab.label}</button>)}</div>;
}

function metadataFor(record: InspectionDetailModalRecord) {
  if (record.metadataLine2) return <div className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]"><p>{record.metadataLine1}</p><p className="mt-[3px]">{record.metadataLine2}</p></div>;
  return <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]">{record.metadataLine1}</p>;
}

function StatusRow({ config, count, expanded, onToggle }: { config: StatusConfig; count: number; expanded: boolean; onToggle: () => void }) {
  return <button type="button" className="flex h-[56px] w-full shrink-0 items-center justify-between border-b border-[#e3e3e3] bg-white px-[14px] py-[16px]" onClick={onToggle} aria-expanded={expanded}><div className="flex items-center gap-[10px]"><InspectionDetailStatusRowIcon status={config.key} /><p className={`font-['Inter:Bold',sans-serif] text-[11px] font-bold uppercase leading-[13px] tracking-[0.66px] ${config.textClass}`}>{config.label}</p><span className={`flex h-[14px] min-w-[19px] items-center justify-center rounded-[8px] px-[7px] font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[12px] tracking-[0.6px] ${config.chipClass}`}>{count}</span></div><InspectionDetailCaretDownIcon className={expanded ? 'size-[16px] rotate-180' : 'size-[16px]'} /></button>;
}

function EmptyStatusPanel({ status }: { status: StatusKey }) {
  return <div className="flex min-h-[92px] items-center justify-center border-b border-[#e3e3e3] bg-white px-[24px] py-[24px]"><p className="text-center text-[12px] font-semibold leading-[18px] text-[#646464]">{emptyStatusMessage[status]}</p></div>;
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

function FindingObservationCard({ inspectionId, item, actions, index, onRequestExecutionMode, onRequestReject }: FindingObservationCardProps) {
  const [slaSheetOpen, setSlaSheetOpen] = useState(false);
  const config = statusConfigByKey[item.statusGroup];
  const status = item.statusGroup;
  const actionDisabled = actions.isPending;
  function approve() {
    if (!window.confirm('¿Aprobar cierre de esta observación?')) return;
    actions.approveFinding(inspectionId, item.findingId);
  }
  function reschedule(label: string) {
    const days = Number(label.match(/(\d+)/)?.[1]);
    if (!Number.isFinite(days) || days < 0) return;
    actions.rescheduleFinding(inspectionId, item.findingId, dueDateFromDays(days));
    setSlaSheetOpen(false);
  }
  return <div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between"><div className="flex min-w-0 items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(item.severityLabel)}>{item.severityLabel}</FindingPill></div><span className={`inline-flex h-[19px] items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold leading-none ${config.chipClass}`}><InspectionDetailStatusChipIcon status={status} />{config.itemLabel}</span></div><div className="flex flex-col gap-[4px] pt-[12px]"><FindingTextBlock title="Condición detectada" bordered>{item.condition ?? ''}</FindingTextBlock><FindingTextBlock title="Medida correctiva propuesta">{item.proposedCorrectiveAction ?? ''}</FindingTextBlock>{status !== 'open' ? <FindingTextBlock title="Descripción de la acción tomada">{item.executedActionDescription ?? ''}</FindingTextBlock> : null}{status === 'rejected' ? <FindingTextBlock title="Motivo de rechazo">{item.rejectionReason ?? ''}</FindingTextBlock> : null}<div className="flex gap-[4px] pt-[8px]"><EvidencePreview title="Antes" evidences={item.beforeEvidence} emptyLabel="Pendiente" /><EvidencePreview title="Después" evidences={item.afterEvidence} afterClosed={status === 'closed' || status === 'executed' || status === 'rejected'} /></div>{status === 'open' ? <div className="mt-[4px] flex min-h-[64px] items-center justify-between rounded-[10px] border-[1.5px] border-[#d1d1d1] bg-[#f7f7f7] p-[15.5px]"><div><p className="w-[78px] text-[9px] font-bold uppercase leading-none tracking-[0.63px] text-[#333]">SLA calculado</p><p className="pt-[2px] text-[20px] font-bold leading-[20px] text-[#532a0e]">{daysLabel(item.dueAt, 'X Días')}</p></div>{actions.canReassign ? <button type="button" className="flex h-[40px] items-center justify-center rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[15.5px] py-[1.5px] text-[13px] font-semibold text-[#333] disabled:opacity-50" disabled={actionDisabled} onClick={() => setSlaSheetOpen(true)}>Reasignar SLA</button> : null}</div> : null}{status === 'executed' ? <><div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="executed" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#570b1d]">{daysLabel(item.dueAt)}</p></div></div>{actions.canReview ? <div className="flex items-center gap-[8px] rounded-[8px] bg-white px-[12px] py-[9px]"><button type="button" className="flex h-[40px] items-center justify-center gap-[5px] rounded-[9px] border-2 border-[#c4365a] bg-white px-[16px] py-[2px] text-[12px] font-bold text-[#570b1d] disabled:opacity-50" disabled={actionDisabled} onClick={() => onRequestReject(item)}><InspectionDetailRejectIcon />Rechazar</button><button type="button" className="flex h-[40px] min-w-0 flex-1 items-center justify-center gap-[5px] rounded-[9px] bg-[#3a9b3a] px-[12px] text-[12px] font-bold text-white disabled:opacity-50" disabled={actionDisabled} onClick={approve}><InspectionDetailApproveIcon />Aprobar cierre</button></div> : <div className="rounded-[8px] bg-white px-[12px] py-[10px]"><p className="text-center text-[11px] font-semibold text-[#646464]">En espera de revisión Gold Fields</p></div>}</> : null}{status === 'closed' ? <><div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA cerrado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="open" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#532a0e]">{daysLabel(item.dueAt)}</p></div></div><div className="flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">Fecha de cierre</p><p className="text-right text-[11px] font-bold leading-none text-[#646464]">{formatDate(item.closedAt)}</p></div></> : null}{status === 'rejected' ? <><div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="executed" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#570b1d]">{daysLabel(item.dueAt)}</p></div></div>{actions.canExecute ? <button type="button" className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#c8a064] px-[12px] text-[15px] font-bold text-white shadow-[0px_2px_5px_rgba(200,160,100,0.3)] disabled:opacity-50" disabled={actionDisabled} onClick={() => onRequestExecutionMode(item, index)}>Ejecutar observación rechazada</button> : null}</> : null}{status === 'open' && actions.canExecute ? <button type="button" className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#c8a064] px-[12px] text-[15px] font-bold text-white shadow-[0px_2px_rgba(200,160,100,0.3)] disabled:opacity-50" disabled={actionDisabled} onClick={() => onRequestExecutionMode(item, index)}>Ejecutar observación</button> : null}</div><SlaReassignSheet visible={slaSheetOpen} calculatedLabel={daysLabel(item.dueAt, 'X Días')} severityLabel={item.severityLabel} onClose={() => setSlaSheetOpen(false)} onApply={reschedule} /></div>;
}

function FindingObservationsPanel({ inspectionId, items, actions, onRequestExecutionMode, onRequestReject }: { inspectionId: string; items: InspectionDetailFindingItemResponse[]; actions: ReturnType<typeof useInspectionFindingActions>; onRequestExecutionMode: (item: InspectionDetailFindingItemResponse, index: number) => void; onRequestReject: (item: InspectionDetailFindingItemResponse) => void }) {
  return <div className="flex shrink-0 flex-col gap-[24px] bg-white px-[14px] pb-[24px] pt-[14px]">{items.map((item, index) => <FindingObservationCard key={item.findingId} inspectionId={inspectionId} item={item} actions={actions} index={index} onRequestExecutionMode={onRequestExecutionMode} onRequestReject={onRequestReject} />)}</div>;
}

function DetailRows({ inspectionId, counts, findings, actions, onRequestExecutionMode, onRequestReject }: DetailRowsProps) {
  const [expandedStatus, setExpandedStatus] = useState<StatusKey | null>(null);
  useEffect(() => {
    setExpandedStatus(null);
  }, [inspectionId]);
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white">{statusConfigs.map((config) => { const expanded = expandedStatus === config.key; const items = findings[config.key] ?? []; const panel = expanded ? items.length > 0 ? <FindingObservationsPanel inspectionId={inspectionId} items={items} actions={actions} onRequestExecutionMode={onRequestExecutionMode} onRequestReject={onRequestReject} /> : <EmptyStatusPanel status={config.key} /> : null; return <div key={config.key}><StatusRow config={config} count={counts[config.key]} expanded={expanded} onToggle={() => setExpandedStatus((current) => current === config.key ? null : config.key)} />{panel}</div>; })}</div>;
}

function FollowupTimelineMarker({ completed }: { completed: boolean }) {
  return <div className={`flex size-[24px] shrink-0 items-center justify-center rounded-[12px] text-[10px] font-normal leading-none ${completed ? 'bg-[#6cc24a] text-white' : 'bg-[#e3e3e3] text-[#acacac]'}`}>{completed ? '✓' : '○'}</div>;
}

function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const observedCount = allFindings(detail).length;
  const events: FollowupStep[] = [];
  detail.followups.forEach((step) => {
    events.push({ id: `followup-${step.followupId}`, title: step.title || `Seguimiento ${step.sequenceNumber}`, date: formatDate(step.performedAt), summary: step.description, completed: step.completed, occurredAt: step.performedAt });
  });
  allFindings(detail).forEach((item, index) => {
    const observationLabel = `Obs. ${index + 1}`;
    if (item.executedAt) events.push({ id: `executed-${item.findingId}`, title: `${observationLabel} ejecutada`, date: formatDate(item.executedAt), summary: item.executedActionDescription ?? 'Observación marcada como ejecutada', completed: true, occurredAt: item.executedAt });
    if (item.rejectedAt) events.push({ id: `rejected-${item.findingId}`, title: `${observationLabel} rechazada`, date: formatDate(item.rejectedAt), summary: item.rejectionReason ?? 'Observación rechazada y devuelta a corrección', completed: true, occurredAt: item.rejectedAt });
    if (item.closedAt) events.push({ id: `closed-${item.findingId}`, title: `${observationLabel} cerrada`, date: formatDate(item.closedAt), summary: 'Cierre aprobado por Admin GF HSE', completed: true, occurredAt: item.closedAt });
  });
  const sortedEvents = events.sort((left, right) => toTimestamp(left.occurredAt) - toTimestamp(right.occurredAt));
  return [{ id: 'initial', title: 'Inspección inicial', date: formatDate(detail.general.scheduledAt), summary: `${observedCount} observaciones detectadas`, completed: true, occurredAt: detail.general.scheduledAt }, ...sortedEvents];
}

function FollowupTimelineItem({ step, isLast }: { step: FollowupStep; isLast: boolean }) {
  return <div className={`relative flex w-full gap-[12px] ${isLast ? '' : 'pb-[16px]'}`}><FollowupTimelineMarker completed={step.completed} />{!isLast ? <div className="absolute left-[11px] top-[24px] h-[23px] w-[2px] bg-[#e3e3e3]" /> : null}<div className="min-w-0 flex-1 pt-[2px]"><p className="text-[12px] font-bold leading-none text-[#131313]">{step.title}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{step.date}</p>{step.summary ? <p className="pt-[5px] text-[11px] font-normal leading-[15px] text-[#646464]">{step.summary}</p> : null}</div></div>;
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

function GeneralObservationSummary({ items }: { items: InspectionDetailFindingItemResponse[] }) {
  return <GeneralSection icon={<InspectionDetailListIcon />} title={`Observaciones (${items.length})`}><div>{items.map((item, index) => <div key={item.findingId} className={`flex flex-col gap-[8px] px-[12px] py-[10px] ${index === items.length - 1 ? '' : 'border-b border-[#e3e3e3]'}`}><div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{`Obs. ${index + 1}`}</FindingPill><FindingPill className={severityClassName(item.severityLabel)}>{item.severityLabel}</FindingPill></div><p className="text-[12px] font-normal leading-[16.8px] text-[#131313]">{item.condition ?? '—'}</p><div className="flex items-center justify-between border-t border-[#e3e3e3] pt-[10px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</p><p className="text-right text-[12px] font-bold leading-none text-[#131313]">{daysLabel(item.dueAt, 'xx días hábiles')}</p></div></div>)}</div></GeneralSection>;
}

function initialsAvatar(name: string, index: number, large = false) {
  return <div className={`flex shrink-0 items-center justify-center rounded-full font-bold leading-none ${large ? 'size-[36px] text-[13px]' : 'size-[32px] text-[12px]'} ${avatarColors[index % avatarColors.length]}`}>{initials(name)}</div>;
}

function ResponsibleRow({ responsible, isLast, index }: { responsible: InspectionDetailResponsibleResponse; isLast: boolean; index: number }) {
  return <div className={`flex items-center gap-[10px] px-[12px] py-[10px] ${isLast ? '' : 'border-b border-[#e3e3e3]'}`}>{initialsAvatar(responsible.fullName, index)}<div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold leading-none text-[#131313]">{responsible.fullName}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{responsible.position ?? 'Sin cargo'}</p></div>{responsible.currentUser ? <span className="inline-flex h-[16px] items-center rounded-[5px] bg-[#c5fff6] px-[7px] text-[10px] font-bold leading-none text-[#00b398]">Tú</span> : null}</div>;
}

function GeneralResponsiblesSection({ detail, onReassignClick, canReassign }: { detail: InspectionDetailResponse; onReassignClick: () => void; canReassign: boolean }) {
  const companyName = primaryResponsibleCompany(detail);
  const responsibles = detail.general.responsibles;
  return <GeneralSection icon={<InspectionDetailPersonIcon />} title="Responsables"><GeneralInfoRows rows={[{ label: 'EECC', value: companyName }]} /><div className="border-t border-[#e3e3e3]">{responsibles.map((responsible, index) => <ResponsibleRow key={responsible.userId} responsible={responsible} index={index} isLast={index === responsibles.length - 1} />)}</div>{canReassign ? <div className="border-t border-[#e3e3e3] px-[12px] py-[9px]"><button type="button" onClick={onReassignClick} className="flex h-[42px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-[2px] text-[12px] font-semibold leading-none text-[#24588b]"><InspectionDetailAssignIcon />Reasignar a otro compañero {companyName}</button></div> : null}</GeneralSection>;
}

function GeneralPanel({ detail, onOpenReassign, canReassign }: { detail: InspectionDetailResponse; onOpenReassign: () => void; canReassign: boolean }) {
  const general = detail.general;
  const items = allFindings(detail);
  const locationRows: GeneralInfoRow[] = [
    { label: 'Área · Sector', value: [general.areaName, general.sectorName].filter(Boolean).join(' · ') || '—' },
    { label: 'Fecha', value: formatDate(general.scheduledAt) },
    { label: 'Tipo', value: detail.header.kind === 'checklist' ? 'Checklist normativo' : 'Hallazgo' },
    { label: 'Ubicación UTM', value: general.latitude && general.longitude ? `${general.latitude} · ${general.longitude}` : general.locationLabel ?? '—', mono: true },
  ];
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] pt-[14px] pb-[20px]"><div className="flex flex-col gap-[12px]"><GeneralSection icon={<InspectionDetailPersonIcon />} title="Quién realizó la inspección"><GeneralInfoRows rows={[{ label: 'Nombre', value: general.inspectorName ?? '—' }, { label: 'Empresa', value: general.inspectorCompanyName ?? general.companyName ?? '—' }]} /></GeneralSection><GeneralSection icon={<InspectionDetailLocationIcon />} title="Donde y cuándo"><GeneralInfoRows rows={locationRows} /></GeneralSection><GeneralSection icon={<InspectionDetailCameraIcon />} title="Fotografía general de la inspección"><div className="px-[12px] py-[9px]"><EvidenceGallery evidences={general.generalEvidence} /></div></GeneralSection><GeneralObservationSummary items={items} /><GeneralResponsiblesSection detail={detail} onReassignClick={onOpenReassign} canReassign={canReassign} /></div></div>;
}

function ReassignSelectionControl({ selected }: { selected: boolean }) {
  if (selected) return <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[11px] border-2 border-[#00b398] bg-[#00b398] text-[12px] font-bold leading-none text-white">✓</span>;
  return <span className="size-[22px] shrink-0 rounded-[11px] border-2 border-[#d1d1d1] bg-white" />;
}

function ReassignOptionRow({ option, selected, isLast, onToggle, index }: { option: InspectionDetailResponsibleResponse; selected: boolean; isLast: boolean; onToggle: () => void; index: number }) {
  return <button type="button" className={`flex w-full items-center gap-[10px] px-[16px] py-[12px] text-left ${isLast ? '' : 'border-b border-[#e3e3e3]'}`} onClick={onToggle} aria-pressed={selected}>{initialsAvatar(option.fullName, index, true)}<div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold leading-none text-[#131313]">{option.fullName}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{option.position ?? 'Sin cargo'}</p></div><ReassignSelectionControl selected={selected} /></button>;
}

function ReassignPrompt({ open, candidates, selectedIds, onToggle, onCancel, onConfirm, companyName }: { open: boolean; candidates: InspectionDetailResponsibleResponse[]; selectedIds: string[]; onToggle: (id: string) => void; onCancel: () => void; onConfirm: () => void; companyName: string }) {
  if (!open) return null;
  return <div className="absolute inset-0 z-20 flex items-center justify-center px-[14px]" role="presentation"><div className="w-[332px] max-w-full overflow-hidden rounded-[16px] bg-white px-[14px] pb-[24px] pt-[12px] shadow-[0_4px_14px_rgba(19,19,19,0.24)]" role="dialog" aria-modal="true" aria-labelledby="reassign-title"><p id="reassign-title" className="text-[14px] font-bold leading-none text-[#131313]">Reasignar hallazgo · {companyName}</p><div className="mt-[24px] flex max-h-[280px] flex-col overflow-hidden">{candidates.map((option, index) => <ReassignOptionRow key={option.userId} option={option} selected={selectedIds.includes(option.userId)} isLast={index === candidates.length - 1} onToggle={() => onToggle(option.userId)} index={index} />)}</div><div className="mt-[24px] flex gap-[8px]"><button type="button" className="flex h-[44px] min-w-0 flex-1 items-center justify-center rounded-[14px] border-2 border-[#c8a064] bg-white px-[20px] py-[2px] text-[13px] font-bold leading-none text-[#c8a064]" onClick={onCancel}>Cancelar</button><button type="button" className="flex h-[44px] min-w-0 flex-1 items-center justify-center rounded-[14px] bg-[#c8a064] px-[12px] py-[13px] text-[15px] font-bold leading-none text-white shadow-[0_2px_5px_rgba(200,160,100,0.3)]" onClick={onConfirm}>Reasignar</button></div></div></div>;
}

function EmptyDetailPanel() {
  return <div className="min-h-0 flex-1 bg-white" />;
}

function DetailContent({ activeTab, detail, actions, onOpenReassign, onRequestExecutionMode, onRequestReject }: { activeTab: DetailTab; detail: InspectionDetailResponse; actions: ReturnType<typeof useInspectionFindingActions>; onOpenReassign: () => void; onRequestExecutionMode: (item: InspectionDetailFindingItemResponse, index: number) => void; onRequestReject: (item: InspectionDetailFindingItemResponse) => void }) {
  if (activeTab === 'followups') return <FollowupsPanel detail={detail} />;
  if (activeTab === 'general') return <GeneralPanel detail={detail} onOpenReassign={onOpenReassign} canReassign={actions.canReassign} />;
  if (activeTab === 'result' && detail.header.kind === 'checklist') return <InspectionChecklistResultPanel result={detail.checklistResult} />;
  if (activeTab === 'observations') return <DetailRows inspectionId={detail.header.inspectionId} counts={detail.header.counts} findings={detail.findings} actions={actions} onRequestExecutionMode={onRequestExecutionMode} onRequestReject={onRequestReject} />;
  return <EmptyDetailPanel />;
}

function DownloadPdfButton({ inspectionId }: { inspectionId: string }) {
  return <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[15.5px] py-[1.5px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold leading-none text-[#333]" onClick={() => window.open(`${apiOrigin}/api/inspections/${inspectionId}/export/pdf`, '_blank')}><InspectionDetailPdfIcon />Descargar PDF</button></div>;
}

export function InspectionDetailRealDataModal({ open, record, detail, onClose }: { open: boolean; record: InspectionDetailModalRecord; detail: InspectionDetailResponse; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTab>('observations');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [executionTarget, setExecutionTarget] = useState<ExecutionTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InspectionDetailFindingItemResponse | null>(null);
  const [rejectedToastVisible, setRejectedToastVisible] = useState(false);
  const currentResponsibleIds = detail.general.responsibles.map((responsible) => responsible.userId);
  const currentResponsibleIdsKey = currentResponsibleIds.join('|');
  const [selectedReassignIds, setSelectedReassignIds] = useState<string[]>(currentResponsibleIds);
  const actions = useInspectionFindingActions();
  const companyName = primaryResponsibleCompany(detail);
  const companyId = primaryResponsibleCompanyId(detail);
  const findingIds = useMemo(() => allFindings(detail).map((finding) => finding.findingId), [detail]);
  const responsibleUsersQuery = useQuery({
    queryKey: ['inspections', 'responsible-users', companyId],
    queryFn: () => getCompanyUsers(companyId ?? ''),
    enabled: open && reassignOpen && Boolean(companyId),
    staleTime: 60000,
  });
  const reassignCandidates = useMemo(() => responsibleUsersQuery.data?.map((user) => mapResponsibleCandidate(user, detail.general.responsibles)) ?? detail.general.responsibles, [detail.general.responsibles, responsibleUsersQuery.data]);

  useEffect(() => {
    setSelectedReassignIds(currentResponsibleIds);
  }, [currentResponsibleIdsKey]);

  useEffect(() => {
    if (!rejectedToastVisible) return;
    const timer = window.setTimeout(() => setRejectedToastVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [rejectedToastVisible]);

  if (!open) return null;
  const toggleReassignOption = (id: string) => setSelectedReassignIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const openReassignPrompt = () => {
    if (!actions.canReassign) return;
    setSelectedReassignIds(currentResponsibleIds);
    setReassignOpen(true);
  };
  const closeReassignPrompt = () => setReassignOpen(false);
  const confirmReassignPrompt = async () => {
    await actions.reassignResponsibleUsers(detail.header.inspectionId, findingIds, selectedReassignIds);
    setReassignOpen(false);
  };
  const closeExecutionMode = () => setExecutionTarget(null);
  const openExecutionMode = (item: InspectionDetailFindingItemResponse, index: number) => { if (actions.canExecute) setExecutionTarget({ item, index }); };
  const executeSelectedFinding = () => {
    if (!executionTarget) return;
    const value = window.prompt('Describe la acción ejecutada', executionTarget.item.proposedCorrectiveAction ?? '')?.trim();
    if (value === undefined) return;
    actions.executeFinding(detail.header.inspectionId, executionTarget.item.findingId, value.length > 0 ? value : executionTarget.item.proposedCorrectiveAction ?? null);
    setExecutionTarget(null);
  };
  const executeSelectedFindingWithEvidence = async (description: string, file: File) => {
    if (!executionTarget) return;
    await actions.executeFindingWithAfterEvidence({
      inspectionId: detail.header.inspectionId,
      findingId: executionTarget.item.findingId,
      executedActionDescription: description,
      file,
      latitude: detail.general.latitude,
      longitude: detail.general.longitude,
    });
    setExecutionTarget(null);
  };
  const openRejectPrompt = (item: InspectionDetailFindingItemResponse) => { if (actions.canReview) setRejectTarget(item); };
  const closeRejectPrompt = () => setRejectTarget(null);
  const confirmRejectPrompt = async (reason: string) => {
    if (!rejectTarget) return;
    await actions.rejectFindingAsync(detail.header.inspectionId, rejectTarget.findingId, reason);
    setRejectTarget(null);
    setRejectedToastVisible(true);
  };

  return <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]"><div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]"><section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col justify-between overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true" aria-labelledby="inspection-detail-title"><div className="flex min-h-0 flex-1 flex-col"><div className="shrink-0 rounded-t-[16px] bg-white px-[14px] py-[12px]"><div className="flex items-center gap-[12px]"><div className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] font-bold"><p className="whitespace-nowrap text-[13px] leading-none text-[#001e39]">{record.id}</p><h2 id="inspection-detail-title" className="mt-[5px] text-[16px] font-bold leading-[22px] tracking-[0.32px] text-[#2a2a2a]">{record.title}</h2><div className="mt-[4px]">{metadataFor(record)}</div></div><button type="button" className="flex size-[32px] shrink-0 items-center justify-center" onClick={onClose} aria-label="Cerrar detalle"><InspectionDetailCloseIcon /></button></div></div><ProgressSummary counts={detail.header.counts} progressPercent={detail.header.progressPercent} /><Tabs kind={record.kind} activeTab={activeTab} onChange={setActiveTab} /><DetailContent activeTab={activeTab} detail={detail} actions={actions} onOpenReassign={openReassignPrompt} onRequestExecutionMode={openExecutionMode} onRequestReject={openRejectPrompt} /></div><DownloadPdfButton inspectionId={detail.header.inspectionId} /><ReassignPrompt open={reassignOpen && actions.canReassign} candidates={reassignCandidates} selectedIds={selectedReassignIds} onToggle={toggleReassignOption} onCancel={closeReassignPrompt} onConfirm={confirmReassignPrompt} companyName={companyName} /><FindingRejectDialog open={Boolean(rejectTarget) && actions.canReview} isSubmitting={actions.isPending} onClose={closeRejectPrompt} onConfirm={confirmRejectPrompt} /><ObservationRejectedToast visible={rejectedToastVisible} onClose={() => setRejectedToastVisible(false)} />{executionTarget && actions.canExecute ? <FindingExecutionModeView subtitle={executionLocationLabel(detail)} item={executionTarget.item} index={executionTarget.index} isSubmitting={actions.isPending} onBack={closeExecutionMode} onCancel={closeExecutionMode} onStartAssistant={executeSelectedFinding} onStartManual={executeSelectedFindingWithEvidence} /> : null}</section></div></div>;
}
