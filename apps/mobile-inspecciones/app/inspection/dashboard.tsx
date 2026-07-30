import { useAutoSyncPendingOperations } from '../../src/shared/hooks/useAutoSyncPendingOperations';
import { DesignViewport } from '../../src/shared/layout/DesignViewport';
import { MobileInspectionManagementScreen } from '../../src/modules/inspection/MobileInspectionManagementScreen';

export default function InspectionDashboardRoute() {
  useAutoSyncPendingOperations();
  return (
    <DesignViewport testID="inspection-dashboard-design-viewport">
      <MobileInspectionManagementScreen />
    </DesignViewport>
  );
}
