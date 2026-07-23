import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fontWeight } from '../../../src/shared/theme/tokens';
import { useMobileSession } from '../../../src/modules/auth/mobileSession.store';
import {
  resolveMobileNotificationDeepLink,
  savePendingMobileNotificationRoute,
  toMobileNotificationRoute,
} from '../../../src/shared/services/mobileNotificationDeepLink';

type LinkState = 'loading' | 'invalid' | 'expired' | 'error';

export default function MobileNotificationDeepLinkScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const accessToken = useMobileSession((state) => state.accessToken);
  const hydrated = useMobileSession((state) => state.hydrated);
  const hydrate = useMobileSession((state) => state.hydrateMobileSession);
  const [state, setState] = useState<LinkState>('loading');

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;

    async function openNotification(deepLinkToken: string) {
      try {
        const result = await resolveMobileNotificationDeepLink(deepLinkToken);
        if (cancelled) return;
        if (result.status === 'expired') {
          setState('expired');
          return;
        }
        if (result.status !== 'valid') {
          setState('invalid');
          return;
        }

        const target = toMobileNotificationRoute(result);
        if (!accessToken && result.requiresLogin) {
          await savePendingMobileNotificationRoute(target);
          if (!cancelled) router.replace('/access');
          return;
        }
        router.replace(target as never);
      } catch {
        if (!cancelled) setState('error');
      }
    }

    void openNotification(token);
    return () => {
      cancelled = true;
    };
  }, [accessToken, hydrated, token]);

  const message = state === 'expired'
    ? 'Este enlace expiró. Abre la notificación desde AurelIA.'
    : state === 'invalid'
      ? 'El enlace de notificación no es válido.'
      : state === 'error'
        ? 'No fue posible abrir la notificación.'
        : 'Abriendo notificación…';

  return (
    <View style={styles.screen}>
      {state === 'loading' ? <ActivityIndicator color={colors.gold} /> : null}
      <Text style={styles.title}>Notificación AurelIA</Text>
      <Text style={styles.message}>{message}</Text>
      {state !== 'loading' ? (
        <TouchableOpacity style={styles.button} onPress={() => router.replace(accessToken ? '/inspection/dashboard' : '/access')}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.surface,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
});
