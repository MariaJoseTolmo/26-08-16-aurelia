import type { MobileBootstrapResponse } from '@aurelia/contracts';
import { httpGet } from '../http-client';

export function fetchMobileBootstrap(): Promise<MobileBootstrapResponse> {
  return httpGet<MobileBootstrapResponse>('/mobile/bootstrap');
}
