import { useState, type ReactNode } from 'react';
import type {
  InspectionDetailLegacyMilestoneResponse,
  InspectionDetailLegacySummaryResponse,
  InspectionDetailResponse,
} from '@aurelia/contracts';
import { env } from '../../../shared/config/env';
import type { InspectionDetailModalRecord } from './InspectionDetailModal';
import {
  InspectionDetailCloseIcon,
  InspectionDetailFollowupIcon,
  InspectionDetailListIcon,
  InspectionDetailLocationIcon,
  InspectionDetailPdfIcon,
  InspectionDetailPersonIcon,
} from './InspectionDetailIcons';

type LegacyTab = 'observations' | 'followups' | 'general';

type Props = {
  open: boolean;
  record: InspectionDetailModalRecord;
  detail: InspectionDetailResponse;
  onClose: () => void;
};

const apiOrigin = env.apiUrl.replace(/\/api\/?$/, '');
const tabs: Array<{ id: LegacyTab; label: string }> = [
  { id: 'observations', label: 'Observaciones' },
  { id: 'followups', label: 'Seguimientos' },
  { id: 'general', label: 'Datos generales' },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function closurePercentage(legacy: InspectionDetailLegacySummaryResponse): number {
  if (legacy.totalObservations <= 0) return 0;
  return clampPercentage((legacy.closedObservations / legacy.totalObservations) * 100);
}

function milestoneClosedPercentage(
  legacy: InspectionDetailLegacySummaryResponse,
  milestone: InspectionDetailLegacyMilestoneResponse,
): number {
  if (milestone.closedPercentage !== null) return clampPercentage(milestone.closedPercentage);
  if (legacy.totalObservations <= 0) return 0;
  return clampPercentage(((legacy.totalObservations - milestone.pendingAfter) / legacy.totalObservations) * 100);
}

function Tabs({ active, onChange }: { active: LegacyTab; onChange: (tab: LegacyTab) => void }) {
  return (
    <div className="grid shrink-0 border-b-2 border-[#e3e3e3] bg-[#f7f7f7]" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex h-[37px] items-center justify-center border-b-2 px-[6px] pb-[2px] text-[12px] font-semibold ${tab.id === active ? 'border-[#c8a064] text-[#8e6e3e]' : 'border-transparent text-[#646464]'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'total' | 'closed' | 'open' }) {
  const classes = tone === 'closed'
    ? 'border-[#b9eaaa] bg-[#f1ffec] text-[#2a5c16]'
    : tone === 'open'
      ? 'border-[#f4d28b] bg-[#fff8e7] text-[#694b08]'
      : 'border-[#c9dced] bg-[#f5faff] text-[#24588b]';
  return (
    <div className={`rounded-[10px] border px-[12px] py-[11px] ${classes}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.7px] opacity-75">{label}</p>
      <p className="mt-[4px] text-[22px] font-bold leading-none">{value}</p>
    </div>
  );
}

function ObservationsPanel({ legacy }: { legacy: InspectionDetailLegacySummaryResponse }) {
  const percent = closurePercentage(legacy);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[16px]">
      <div className="flex items-center gap-[6px]">
        <InspectionDetailListIcon />
        <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#646464]">Resumen histórico de observaciones</p>
      </div>
      <div className="mt-[12px] grid grid-cols-3 gap-[7px]">
        <SummaryCard label="Total" value={legacy.totalObservations} tone="total" />
        <SummaryCard label="Cerradas" value={legacy.closedObservations} tone="closed" />
        <SummaryCard label="Pendientes" value={legacy.openObservations} tone="open" />
      </div>
      <div className="mt-[12px] rounded-[10px] border border-[#e3e3e3] bg-[#f7f7f7] px-[12px] py-[12px]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#646464]">Avance de cierre</p>
          <p className="text-[12px] font-bold text-[#2a5c16]">{Math.round(percent)}%</p>
        </div>
        <div className="mt-[7px] h-[7px] overflow-hidden rounded-full bg-[#e3e3e3]">
          <div className="h-full rounded-full bg-[#6cc24a]" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="mt-[12px] rounded-[10px] border border-[#c9dced] bg-[#f5faff] px-[12px] py-[11px] text-[11px] leading-[16px] text-[#31506d]">
        La fuente histórica conserva cantidades y avance agregado. No contiene descripción, severidad, responsable ni evidencias por cada observación.
      </div>
    </div>
  );
}

function TimelineMarker({ completed }: { completed: boolean }) {
  return <div className={`flex size-[24px] shrink-0 items-center justify-center rounded-full text-[11px] ${completed ? 'bg-[#6cc24a] text-white' : 'bg-[#e3e3e3] text-[#acacac]'}`}>{completed ? '✓' : '○'}</div>;
}

function FollowupItem({ title, date, completed, children, last = false }: { title: string; date: string; completed: boolean; children?: ReactNode; last?: boolean }) {
  return (
    <div className={`relative flex gap-[12px] ${last ? '' : 'pb-[18px]'}`}>
      <TimelineMarker completed={completed} />
      {!last ? <div className="absolute left-[11px] top-[24px] h-[calc(100%-18px)] w-[2px] bg-[#e3e3e3]" /> : null}
      <div className="min-w-0 flex-1 pt-[2px]">
        <p className="text-[12px] font-bold leading-none text-[#131313]">{title}</p>
        <p className="pt-[4px] text-[11px] text-[#646464]">{date}</p>
        {children}
      </div>
    </div>
  );
}

function FollowupsPanel({ detail, legacy }: { detail: InspectionDetailResponse; legacy: InspectionDetailLegacySummaryResponse }) {
  const milestoneBySequence = new Map(legacy.milestones.map((milestone) => [milestone.sequenceNumber, milestone]));
  const steps = [1, 2, 3].map((sequenceNumber) => milestoneBySequence.get(sequenceNumber) ?? null);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[18px]">
      <div className="flex items-center gap-[6px]">
        <InspectionDetailFollowupIcon />
        <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#646464]">Historial de seguimientos</p>
      </div>
      <div className="pt-[12px]">
        <FollowupItem title="Inspección inicial" date={formatDate(detail.general.scheduledAt)} completed>
          <p className="pt-[5px] text-[11px] leading-[15px] text-[#646464]">{legacy.totalObservations} {legacy.totalObservations === 1 ? 'observación detectada' : 'observaciones detectadas'}</p>
        </FollowupItem>
        {steps.map((milestone, index) => {
          const sequenceNumber = index + 1;
          const percent = milestone ? milestoneClosedPercentage(legacy, milestone) : 0;
          const cumulativeClosed = milestone ? Math.max(0, legacy.totalObservations - milestone.pendingAfter) : 0;
          return (
            <FollowupItem
              key={sequenceNumber}
              title={`Seguimiento ${sequenceNumber}`}
              date={milestone ? formatDate(milestone.occurredAt) : '—'}
              completed={Boolean(milestone)}
              last={index === steps.length - 1}
            >
              {milestone ? (
                <ul className="list-disc pt-[3px] text-[11px] leading-[16px] text-[#646464]">
                  <li className="ms-[16px]">Cerradas en este seguimiento: {milestone.closedIncrement} obs.</li>
                  <li className="ms-[16px]">Cierre acumulado: {cumulativeClosed} obs. / {Math.round(percent)}%</li>
                  <li className="ms-[16px]">Pendientes posteriores: {milestone.pendingAfter} obs. / {Math.round(milestone.pendingPercentage ?? 100 - percent)}%</li>
                </ul>
              ) : null}
            </FollowupItem>
          );
        })}
      </div>
    </div>
  );
}

function Section({ icon, title, rows }: { icon: ReactNode; title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex h-[30px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#646464]">{title}</p>
      </div>
      {rows.map((row, index) => (
        <div key={row.label} className={`flex items-start justify-between gap-[12px] px-[12px] py-[9px] ${index < rows.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}>
          <p className="text-[12px] font-medium text-[#646464]">{row.label}</p>
          <p className="max-w-[190px] text-right text-[12px] font-bold leading-[16px] text-[#131313]">{row.value}</p>
        </div>
      ))}
    </section>
  );
}

function GeneralPanel({ detail, legacy }: { detail: InspectionDetailResponse; legacy: InspectionDetailLegacySummaryResponse }) {
  const participantNames = legacy.participants.map((participant) => participant.fullName).filter(Boolean).join(', ');
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[14px]">
      <div className="flex flex-col gap-[12px]">
        <Section
          icon={<InspectionDetailPersonIcon />}
          title="Quién realizó la inspección"
          rows={[
            { label: 'Nombre original', value: legacy.originalInspectorName ?? participantNames || detail.general.inspectorName ?? '—' },
            { label: 'Empresa inspeccionada', value: legacy.originalCompanyName ?? detail.general.companyName ?? '—' },
          ]}
        />
        <Section
          icon={<InspectionDetailLocationIcon />}
          title="Dónde y cuándo"
          rows={[
            { label: 'Área · Sector', value: [legacy.originalAreaName, legacy.originalSectorName].filter(Boolean).join(' · ') || '—' },
            { label: 'Fecha inicial', value: formatDate(detail.general.scheduledAt) },
            { label: 'Tipo', value: legacy.mode === 'checklist' ? 'Checklist' : 'Hallazgo' },
            { label: 'Clave histórica', value: `${legacy.legacyYear}-${String(legacy.legacyNumber).padStart(3, '0')}` },
          ]}
        />
        <Section
          icon={<InspectionDetailListIcon />}
          title="Detalle original"
          rows={[
            { label: 'Detalle', value: legacy.originalDetail ?? 'Sin detalle original' },
            { label: 'Disponibilidad', value: 'Resumen agregado; sin observaciones, imágenes ni comentarios individuales' },
          ]}
        />
      </div>
    </div>
  );
}

export function InspectionLegacyHistoryDetailModal({ open, record, detail, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<LegacyTab>('observations');
  const legacy = detail.legacy;
  if (!open || !legacy) return null;
  const headerTitle = legacy.originalDetail ?? record.title;
  const headerContext = [legacy.originalAreaName, legacy.originalSectorName, formatDate(detail.general.scheduledAt)]
    .filter((value) => value && value !== '—')
    .join(' · ');

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 bg-white px-[14px] py-[12px]">
              <div className="flex items-start gap-[12px]">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold leading-none text-[#001e39]">#{legacy.legacyYear}-{String(legacy.legacyNumber).padStart(3, '0')}</p>
                  <h2 className="mt-[5px] text-[16px] font-bold leading-[22px] text-[#2a2a2a]">{headerTitle}</h2>
                  <p className="mt-[4px] text-[11px] font-bold leading-[15px] text-[#646464]">{headerContext}</p>
                  <p className="mt-[3px] text-[10px] leading-[14px] text-[#646464]">Inspección restaurada desde planilla histórica</p>
                </div>
                <button type="button" className="flex size-[32px] shrink-0 items-center justify-center" onClick={onClose} aria-label="Cerrar detalle"><InspectionDetailCloseIcon /></button>
              </div>
            </div>
            <Tabs active={activeTab} onChange={setActiveTab} />
            {activeTab === 'observations' ? <ObservationsPanel legacy={legacy} /> : null}
            {activeTab === 'followups' ? <FollowupsPanel detail={detail} legacy={legacy} /> : null}
            {activeTab === 'general' ? <GeneralPanel detail={detail} legacy={legacy} /> : null}
          </div>
          <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]">
            <button type="button" className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] text-[13px] font-semibold text-[#333]" onClick={() => window.open(`${apiOrigin}/api/inspections/${detail.header.inspectionId}/export/pdf`, '_blank')}>
              <InspectionDetailPdfIcon />Descargar PDF
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
