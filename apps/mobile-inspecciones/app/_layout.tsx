import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/shared/query/query-client';
import { useDesktopLaunchBridge } from '../src/shared/bridge/desktop-launch-bridge';
import { MobileSessionBootstrap } from '../src/modules/auth/MobileSessionBootstrap';

function DesktopBridgeMount() {
  useDesktopLaunchBridge();
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <DesktopBridgeMount />
        <MobileSessionBootstrap>
          <GestureHandlerRootView style={styles.root}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
          </GestureHandlerRootView>
        </MobileSessionBootstrap>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, height: '100%', minHeight: '100%', backgroundColor: '#F7F7F7' },
});
