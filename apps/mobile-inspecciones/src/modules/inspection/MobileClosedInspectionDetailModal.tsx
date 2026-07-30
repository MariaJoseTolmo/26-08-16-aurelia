import React from 'react';
import { useMobileInspectionDetail } from './hooks/useMobileInspectionManagement';
import { MobileLegacyClosedInspectionDetailModal } from './MobileLegacyClosedInspectionDetailModal';
import {
  MobileClosedInspectionDetailModal as MobileNativeClosedInspectionDetailModal,
} from './MobileNativeClosedInspectionDetailModal';

type Props = {
  visible: boolean;
  inspectionId: string | null;
  onClose: () => void;
};

export function MobileClosedInspectionDetailModal({ visible, inspectionId, onClose }: Props) {
  const detailQuery = useMobileInspectionDetail(inspectionId, visible);
  const detail = detailQuery.data;

  if (detail?.legacy) {
    return (
      <MobileLegacyClosedInspectionDetailModal
        visible={visible}
        detail={detail}
        onClose={onClose}
      />
    );
  }

  return (
    <MobileNativeClosedInspectionDetailModal
      visible={visible}
      inspectionId={inspectionId}
      onClose={onClose}
    />
  );
}
