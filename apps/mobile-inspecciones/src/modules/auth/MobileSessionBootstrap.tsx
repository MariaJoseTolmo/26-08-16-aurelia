import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useMobileSession } from './mobileSession.store';

export function MobileSessionBootstrap({ children }: { children: React.ReactNode }) {
  const hydrated = useMobileSession((state) => state.hydrated);
  const hydrateMobileSession = useMobileSession((state) => state.hydrateMobileSession);

  useEffect(() => {
    if (!hydrated) void hydrateMobileSession();
  }, [hydrateMobileSession, hydrated]);

  if (!hydrated) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#C7A14A" /></View>;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B2242' },
});