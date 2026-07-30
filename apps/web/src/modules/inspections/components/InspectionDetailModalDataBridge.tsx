import type { InspectionDetailResponse } from '@aurelia/contracts';
import { useInspectionCapabilities } from '../../../shared/auth/inspection-capabilities';
import { useInspectionDetail } from '../../../shared/hooks/useInspectionDetail';
import { InspectionDetailModal, type InspectionDetailModalRecord } from './InspectionDetailModal';
import { InspectionDetailRealDataModal } from './InspectionDetailRealDataModal';
import { InspectionHistoryDetailModal } from './InspectionHistoryDetailModal';

type InspectionDetailModalDataBridgeProps = {
  open: boolean;
  inspectionId: string | null;
  record: InspectionDetailModalRecord | null;
  onClose: () => void;
};

function formatInspectionNumber(value: string) {
  return value.startsWith('#') ? value : `#${value}`;
}

function buildRecordFromDetail(detail: InspectionDetailResponse, fallback: InspectionDetailModalRecord): InspectionDetailModalRecord {
  return {
    ...fallback,
    id: formatInspectionNumber(detail.header.inspectionNumber),
    title: detail.header.title || fallback.title,
    kind: detail.header.kind,
    metadataLine1: detail.header.metadataLine1 || fallback.metadataLine1,
    metadataLine2: detail.header.metadataLine2 ?? fallback.metadataLine2,
    progressPercent: detail.header.progressPercent,
    counts: detail.header.counts,
  };
}

function StatusShell({ record, title, message, onClose }: { record: InspectionDetailModalRecord | null; title: string; message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true">
          <div className="flex items-start justify-between gap-[12px] border-b border-[#e3e3e3] px-[14px] py-[14px]">
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-none text-[#001e39]">{record?.id ?? 'Detalle'}</p>
              <h2 className="mt-[6px] text-[16px] font-bold leading-[21px] text-[#2a2a2a]">{record?.title ?? title}</h2>
            </div>
            <button type="button" className="flex size-[32px] shrink-0 items-center justify-center text-[28px] leading-none text-[#131313]" onClick={onClose} aria-label="Cerrar detalle">×</button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[24px] text-center">
            <p className="text-[14px] font-bold text-[#131313]">{title}</p>
            <p className="mt-[8px] text-[12px] leading-[18px] text-[#646464]">{message}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function InspectionDetailModalDataBridge({ open, inspectionId, record, onClose }: InspectionDetailModalDataBridgeProps) {
  const detailQuery = useInspectionDetail(inspectionId, open && Boolean(record));
  const capabilities = useInspectionCapabilities();
  const isHistoryRoute = typeof window !== 'undefined' && window.location.pathname.includes('/inspections/history');
  const isReadOnly = !capabilities.execute && !capabilities.review && !capabilities.reassign;
  if (!open) return null;
  if (detailQuery.data && record) {
    const detailRecord = buildRecordFromDetail(detailQuery.data, record);
    if (isHistoryRoute || isReadOnly) {
      return <InspectionHistoryDetailModal open={open} record={detailRecord} detail={detailQuery.data} onClose={onClose} />;
    }
    return <InspectionDetailRealDataModal open={open} record={detailRecord} detail={detailQuery.data} onClose={onClose} />;
  }
  if (detailQuery.isError) return <StatusShell record={record} title="No fue posible cargar el detalle real" message="Revisa Network para la llamada /api/inspections/:id/detail. Ya no se muestra el mock como fallback cuando esa llamada falla." onClose={onClose} />;
  if (record) return <StatusShell record={record} title="Cargando detalle real" message="Obteniendo observaciones, evidencias, seguimientos y datos generales desde API." onClose={onClose} />;
  return <InspectionDetailModal open={open} record={null} onClose={onClose} />;
}
