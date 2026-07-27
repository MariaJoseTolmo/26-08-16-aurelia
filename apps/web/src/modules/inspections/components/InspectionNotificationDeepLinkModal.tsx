import { useLocation, useNavigate } from 'react-router-dom';
import type { InspectionDetailModalRecord } from './InspectionDetailModal';
import { InspectionDetailModalDataBridge } from './InspectionDetailModalDataBridge';
import { InspectionNotificationContextModal } from './InspectionNotificationContextModal';

function normalizeInspectionNumber(value: string | null) {
  if (!value) return '#—';
  return value.startsWith('#') ? value : `#${value}`;
}

function findingGroupLabel(value: string | null) {
  if (value === 'executed') return 'Observaciones ejecutadas';
  if (value === 'open') return 'Observaciones abiertas';
  if (value === 'closed') return 'Observaciones cerradas';
  if (value === 'rejected') return 'Observaciones rechazadas';
  return 'Cargando detalle real';
}

function buildFallbackRecord(params: URLSearchParams): InspectionDetailModalRecord {
  return {
    id: normalizeInspectionNumber(params.get('inspectionNumber')),
    title: 'Detalle de inspección',
    kind: 'finding',
    metadataLine1: 'Inspección desde notificación',
    metadataLine2: findingGroupLabel(params.get('group')),
    progressPercent: 0,
    counts: { executed: 0, open: 0, closed: 0, rejected: 0 },
  };
}

function removeDeepLinkParams(search: string) {
  const params = new URLSearchParams(search);
  ['notification', 'inspectionId', 'inspectionNumber', 'findingId', 'group', 'notificationId'].forEach((key) => params.delete(key));
  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : '';
}

export function InspectionNotificationDeepLinkModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const notificationSource = params.get('notification') === '1';
  const inspectionId = notificationSource ? params.get('inspectionId') : null;
  const findingId = params.get('findingId');
  const requestedGroup = params.get('group');
  const fallbackRecord = buildFallbackRecord(params);

  function closeModal() {
    navigate({ pathname: location.pathname, search: removeDeepLinkParams(location.search) }, { replace: true });
  }

  if (!inspectionId) return null;
  if (!findingId && !requestedGroup) {
    return <InspectionDetailModalDataBridge open inspectionId={inspectionId} record={fallbackRecord} onClose={closeModal} />;
  }
  return (
    <InspectionNotificationContextModal
      inspectionId={inspectionId}
      findingId={findingId}
      requestedGroup={requestedGroup}
      fallbackRecord={fallbackRecord}
      onClose={closeModal}
    />
  );
}
