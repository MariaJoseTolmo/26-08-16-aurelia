import type { MobileBootstrapResponse } from '@aurelia/contracts';
import { fetchMobileBootstrap } from '../services/api/mobile-bootstrap.api';
import { localStorageDriver } from '../storage/local-storage';

const LOCAL_CATALOGS_KEY = 'local_catalogs:mobile_bootstrap:v1';
export const MISSING_MOBILE_BOOTSTRAP_MESSAGE = 'Debe sincronizar catálogos antes de operar offline';

export class MissingMobileBootstrapCacheError extends Error {
  constructor() {
    super(MISSING_MOBILE_BOOTSTRAP_MESSAGE);
    this.name = 'MissingMobileBootstrapCacheError';
  }
}

function browserIsOffline(): boolean {
  const runtime = globalThis as typeof globalThis & { navigator?: { onLine?: boolean } };
  return runtime.navigator?.onLine === false;
}

export async function getLocalMobileBootstrap(): Promise<MobileBootstrapResponse | null> {
  return localStorageDriver.get<MobileBootstrapResponse>(LOCAL_CATALOGS_KEY);
}

export async function saveLocalMobileBootstrap(bootstrap: MobileBootstrapResponse): Promise<void> {
  await localStorageDriver.set(LOCAL_CATALOGS_KEY, bootstrap);
}

export async function clearLocalMobileBootstrap(): Promise<void> {
  await localStorageDriver.remove(LOCAL_CATALOGS_KEY);
}

export async function refreshLocalMobileBootstrap(): Promise<MobileBootstrapResponse> {
  const bootstrap = await fetchMobileBootstrap();
  await saveLocalMobileBootstrap(bootstrap);
  return bootstrap;
}

export async function getMobileBootstrapLocalFirst(): Promise<MobileBootstrapResponse> {
  if (!browserIsOffline()) {
    try {
      return await refreshLocalMobileBootstrap();
    } catch {
      const cached = await getLocalMobileBootstrap();
      if (cached) return cached;
      throw new MissingMobileBootstrapCacheError();
    }
  }

  const cached = await getLocalMobileBootstrap();
  if (cached) return cached;
  throw new MissingMobileBootstrapCacheError();
}
