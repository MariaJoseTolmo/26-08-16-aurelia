import { useAutoSyncPendingOperations } from '../../src/shared/hooks/useAutoSyncPendingOperations';
import { MobileInspectionManagementScreen } from '../../src/modules/inspection/MobileInspectionManagementScreen';

export default function InspectionDashboardRoute() {
  useAutoSyncPendingOperations();
  return <MobileInspectionManagementScreen />;
}
