import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useMobileSession } from '../../modules/auth/mobileSession.store';
import { env } from '../config/env';
import { exchangeDesktopLaunch } from '../services/api/auth.api';

type MessageEventLike = { origin: string; data: unknown };
type WindowLike = typeof globalThis & {
  addEventListener?: (type: 'message', listener: (event: MessageEventLike) => void) => void;
  removeEventListener?: (type: 'message', listener: (event: MessageEventLike) => void) => void;
  parent?: { postMessage: (message: unknown, targetOrigin: string) => void };
};

type Incoming = { type?: string; code?: string };

function getParentOrigin() {
  return env.webParentOrigin;
}

function getWindow() {
  if (Platform.OS !== 'web') return null;
  return globalThis as WindowLike;
}

function allowed(origin: string) {
  const parentOrigin = getParentOrigin();
  return parentOrigin === '*' || origin === parentOrigin;
}

export function notifyDesktop(type: string, payload: Record<string, unknown> = {}) {
  const currentWindow = getWindow();
  currentWindow?.parent?.postMessage({ type, ...payload }, getParentOrigin());
}

export function useDesktopLaunchBridge() {
  const applyLaunch = useMobileSession((state) => state.setMobileSession);
  const handledCodesRef = useRef(new Set<string>());

  useEffect(() => {
    const currentWindow = getWindow();
    if (!currentWindow?.addEventListener || !currentWindow.removeEventListener) return;

    async function handleMessage(event: MessageEventLike) {
      if (!allowed(event.origin)) return;
      const data = event.data as Incoming | null;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'aurelia:desktop-launch' || !data.code) return;
      if (handledCodesRef.current.has(data.code)) return;
      handledCodesRef.current.add(data.code);

      try {
        const response = await exchangeDesktopLaunch(data.code);
        applyLaunch(response.token, response.user);
      } catch {
        handledCodesRef.current.delete(data.code);
      }
    }

    currentWindow.addEventListener('message', handleMessage);
    notifyDesktop('aurelia:mobile-ready');
    return () => currentWindow.removeEventListener?.('message', handleMessage);
  }, [applyLaunch]);
}
