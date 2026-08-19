import { localStorageDriver } from '../storage/local-storage';

const DEVICE_SESSION_KEY = 'offline_device_session:v1';

export interface OfflineDeviceSession {
  deviceId: string;
  deviceSessionId: string;
  bootstrapVersion: string;
  createdAt: string;
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

export async function getOrCreateOfflineDeviceSession(): Promise<OfflineDeviceSession> {
  const existing = await localStorageDriver.get<OfflineDeviceSession>(DEVICE_SESSION_KEY);
  if (existing) return existing;
  const session: OfflineDeviceSession = {
    deviceId: createId('device'),
    deviceSessionId: createId('session'),
    bootstrapVersion: 'dev-bootstrap-v1',
    createdAt: new Date().toISOString(),
  };
  await localStorageDriver.set(DEVICE_SESSION_KEY, session);
  return session;
}
