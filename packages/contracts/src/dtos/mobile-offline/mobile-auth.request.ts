import type { ISODateString } from '../../types/common';

export interface MobileLoginRequest {
  email: string;
  credential: string;
  deviceId: string;
  deviceName?: string | null;
  platform: 'ios' | 'android' | 'web';
  appId: 'mobile-inspecciones' | 'mobile-incidentes';
  appVersion?: string | null;
}

export interface MobileRefreshRequest {
  refreshToken: string;
  deviceId: string;
  deviceSessionId: string;
}

export interface MobileLogoutRequest {
  deviceId: string;
  deviceSessionId: string;
  loggedOutAt: ISODateString;
}
