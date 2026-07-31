import { StyleSheet, View } from 'react-native';
import { useAutoSyncPendingOperations } from '../../src/shared/hooks/useAutoSyncPendingOperations';
import { DesignViewport } from '../../src/shared/layout/DesignViewport';
import { MobileInspectionManagementScreen } from '../../src/modules/inspection/MobileInspectionManagementScreen';

export default function InspectionDashboardRoute() {
  useAutoSyncPendingOperations();
  return (
    <DesignViewport testID="inspection-dashboard-design-viewport">
      <View style={styles.canvas}>
        <View style={styles.statusBarSpacer} />
        <View style={styles.content}>
          <MobileInspectionManagementScreen />
        </View>
      </View>
    </DesignViewport>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#012659',
  },
  statusBarSpacer: {
    height: 28,
    backgroundColor: '#012659',
  },
  content: {
    flex: 1,
  },
});
