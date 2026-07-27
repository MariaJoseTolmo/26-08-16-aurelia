import type {
  InspectionDetailFindingGroupKey,
  InspectionDetailFindingItemResponse,
} from '@aurelia/contracts';
import { useInspectionDetail } from '../../../shared/hooks/useInspectionDetail';
import type { InspectionDetailModalRecord } from './InspectionDetailModal';

const groupOrder: InspectionDetailFindingGroupKey[] = ['executed', 'open', 'closed', 'rejected'];

const groupLabels: Record<InspectionDetailFindingGroupKey, string> = {
  executed: 'Observaciones ejecutadas',
  open: 'Observaciones abiertas',
  closed: 'Observaciones cerradas',
  rejected: 'Observaciones rechazadas',
};

const groupTone: Record<InspectionDetailFindingGroupKey, string> = {
  executed: 'bg-[#ffd0db] text-[#570b1d]',
  open: 'bg-[#ffeab8] text-[#463100]',
  closed: 'bg-[#e0ffd3] text-[#2a5c16]',
  rejected: 'bg-[#f7f7f7] text-[#646464]',
};

function normalizeGroup(value: string | null): InspectionDetailFindingGroupKey | null {
  if (value === 'executed' || value === 'open' || value === 'closed' || value === 'rejected') return value;
  return null;
}

function resolveGroup(
  requestedGroup: string | null,
  findingId: string | null,
  findings: Record<InspectionDetailFindingGroupKey, InspectionDetailFindingItemResponse[]>,
): InspectionDetailFindingGroupKey | null {
  const normalized = normalizeGroup(requestedGroup);
  if (findingId) {
    const findingGroup = groupOrder.find((group) => findings[group].some((item) => item.findingId === findingId));
    if (findingGroup) return findingGroup;
  }
  return normalized;
}

function visibleFindings(
  group: InspectionDetailFindingGroupKey | null,
  findingId: string | null,
  findings: Record<InspectionDetailFindingGroupKey, InspectionDetailFindingItemResponse[]>,
): InspectionDetailFindingItemResponse[] {
  if (findingId) {
    const match = groupOrder.flatMap((key) => findings[key]).find((item) => item.findingId === findingId);
    return match ? [match] : [];
  }
  return group ? findings[group] : [];
}

function ContextCard({ item, index }: { item: InspectionDetailFindingItemResponse; index: number }) {
  return (
    <article className="rounded-[10px] border border-[#e3e3e3] bg-[#f7f7f7] p-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <div className="flex items-center gap-[6px]">
          <span className="rounded-[6px] bg-[#e6f3ff] px-[8px] py-[3px] text-[10px] font-bold text-[#24588b]">Obs. {index + 1}</span>
          <span className="rounded-[6px] bg-white px-[8px] py-[3px] text-[10px] font-bold text-[#333]">{item.severityLabel}</span>
        </div>
        <span className={`rounded-[6px] px-[8px] py-[3px] text-[10px] font-bold ${groupTone[item.statusGroup]}`}>
          {groupLabels[item.statusGroup]}
        </span>
      </div>
      <h3 className="mt-[10px] text-[13px] font-bold leading-[18px] text-[#131313]">{item.title}</h3>
      <div className="mt-[8px] space-y-[6px]">
        <div className="rounded-[8px] bg-white p-[9px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#646464]">Condición detectada</p>
          <p className="mt-[3px] text-[12px] leading-[17px] text-[#131313]">{item.condition ?? '—'}</p>
        </div>
        <div className="rounded-[8px] bg-white p-[9px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#646464]">Medida correctiva</p>
          <p className="mt-[3px] text-[12px] leading-[17px] text-[#131313]">{item.proposedCorrectiveAction ?? '—'}</p>
        </div>
        {item.executedActionDescription ? (
          <div className="rounded-[8px] bg-white p-[9px]">
            <p className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#646464]">Acción ejecutada</p>
            <p className="mt-[3px] text-[12px] leading-[17px] text-[#131313]">{item.executedActionDescription}</p>
          </div>
        ) : null}
        {item.rejectionReason ? (
          <div className="rounded-[8px] bg-[#fff4f6] p-[9px]">
            <p className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#570b1d]">Motivo de rechazo</p>
            <p className="mt-[3px] text-[12px] leading-[17px] text-[#570b1d]">{item.rejectionReason}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function InspectionNotificationContextModal({
  inspectionId,
  findingId,
  requestedGroup,
  fallbackRecord,
  onClose,
}: {
  inspectionId: string;
  findingId: string | null;
  requestedGroup: string | null;
  fallbackRecord: InspectionDetailModalRecord;
  onClose: () => void;
}) {
  const detailQuery = useInspectionDetail(inspectionId, true);
  const detail = detailQuery.data;
  const group = detail ? resolveGroup(requestedGroup, findingId, detail.findings) : normalizeGroup(requestedGroup);
  const items = detail ? visibleFindings(group, findingId, detail.findings) : [];
  const title = detail?.header.title || fallbackRecord.title;
  const inspectionNumber = detail?.header.inspectionNumber || fallbackRecord.id;

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <section className="flex h-[calc(100vh-32px)] max-h-[692px] w-[380px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true" aria-labelledby="inspection-notification-context-title">
          <header className="flex items-start justify-between gap-[12px] border-b border-[#e3e3e3] px-[14px] py-[14px]">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-[#24588b]">{inspectionNumber.startsWith('#') ? inspectionNumber : `#${inspectionNumber}`}</p>
              <h2 id="inspection-notification-context-title" className="mt-[4px] text-[16px] font-bold leading-[21px] text-[#131313]">{title}</h2>
              <p className="mt-[5px] text-[11px] font-semibold text-[#646464]">{group ? groupLabels[group] : 'Contexto de notificación'}</p>
            </div>
            <button type="button" className="flex size-[32px] shrink-0 items-center justify-center text-[28px] leading-none text-[#131313]" onClick={onClose} aria-label="Cerrar detalle">×</button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[14px]">
            {detailQuery.isLoading ? <p className="py-[32px] text-center text-[12px] font-semibold text-[#646464]">Cargando contexto exacto…</p> : null}
            {detailQuery.isError ? <p className="py-[32px] text-center text-[12px] font-semibold text-[#570b1d]">No fue posible cargar el contexto de esta notificación.</p> : null}
            {detail && items.length === 0 ? <p className="py-[32px] text-center text-[12px] font-semibold text-[#646464]">El hallazgo o grupo solicitado ya no está disponible dentro de tu alcance.</p> : null}
            {items.length > 0 ? <div className="space-y-[12px]">{items.map((item, index) => <ContextCard key={item.findingId} item={item} index={index} />)}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
