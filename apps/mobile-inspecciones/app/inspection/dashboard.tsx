import { useAutoSyncPendingOperations } from '../../src/shared/hooks/useAutoSyncPendingOperations';
import { useMobileSession } from '../../src/modules/auth/mobileSession.store';
import {
  isEeccInspectionResponsible,
  MobileAssignedFindingsScreen,
} from '../../src/modules/inspection/MobileAssignedFindingsScreen';
import { MobileInspectionManagementScreen } from '../../src/modules/inspection/MobileInspectionManagementScreen';

export default function InspectionDashboardRoute() {
  useAutoSyncPendingOperations();
  const user = useMobileSession((state) => state.user);
  return isEeccInspectionResponsible(user)
    ? <MobileAssignedFindingsScreen />
    : <MobileInspectionManagementScreen />;
}
