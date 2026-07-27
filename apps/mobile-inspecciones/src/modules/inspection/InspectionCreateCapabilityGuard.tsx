import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';
import { InspectionModeScreen } from './InspectionModeScreen';
import { useMobileInspectionCapabilities } from './mobileInspectionCapabilities';

export function InspectionCreateCapabilityGuard() {
  const hydrated = useMobileSession((state) => state.hydrated);
  const capabilities = useMobileInspectionCapabilities();

  useEffect(() => {
    if (!hydrated || capabilities.create) return;
    Alert.alert('Sin permiso', 'Tu perfil no tiene permiso para crear inspecciones.');
    router.replace('/inspection/dashboard');
  }, [capabilities.create, hydrated]);

  if (!hydrated || !capabilities.create) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return <InspectionModeScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
