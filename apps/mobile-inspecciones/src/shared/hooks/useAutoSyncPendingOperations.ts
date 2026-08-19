import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useMobileSession } from '../../modules/auth/mobileSession.store';
import { syncPendingOperations } from '../sync/sync-engine';

function isOnline(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function useAutoSyncPendingOperations() {
  const queryClient = useQueryClient();
  const hasSession = useMobileSession((state) => Boolean(state.accessToken));
  const runningRef = useRef(false);

  const runOnce = useCallback(async () => {
    if (!hasSession || !isOnline() || runningRef.current) return;
    runningRef.current = true;
    try {
      const result = await syncPendingOperations({ ignoreRetryDelay: true });
      if (result.attempted > 0) {
        void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspections'] });
        void queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspection-home-summary'] });
      }
    } finally {
      runningRef.current = false;
    }
  }, [hasSession, queryClient]);

  useEffect(() => {
    void runOnce();
    const intervalId = setInterval(() => {
      void runOnce();
    }, 30000);

    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return () => clearInterval(intervalId);
    }

    function handleOnline() {
      void runOnce();
    }

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
    };
  }, [runOnce]);
}
