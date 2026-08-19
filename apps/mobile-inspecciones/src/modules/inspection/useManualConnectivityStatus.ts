import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useMobileSession } from '../auth/mobileSession.store';

function getInitialOnlineStatus(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function useManualConnectivityStatus() {
  const hasSession = useMobileSession((state) => Boolean(state.accessToken));
  const [online, setOnline] = useState(getInitialOnlineStatus);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    online,
    hasSession,
    localOnly: !online || !hasSession,
  };
}
