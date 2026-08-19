import type { ISODateString, ID } from '../../types/common';

export interface MobileUserSnapshot {
  id: ID;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  companyId: ID | null;
  companyName: string | null;
  areaId: ID | null;
  areaName: string | null;
  roles: string[];
  permissions: string[];
  capturedAt: ISODateString;
}

export interface MobileOfflineGrant {
  id: ID;
  deviceId: string;
  deviceSessionId: ID;
  issuedAt: ISODateString;
  expiresAt: ISODateString;
  maxOfflineDays: number;
  bootstrapVersion: string;
}

export interface MobileLoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: ISODateString;
  refreshTokenExpiresAt: ISODateString;
  offlineGrant: MobileOfflineGrant;
  userSnapshot: MobileUserSnapshot;
}

export interface MobileRefreshResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: ISODateString;
  refreshTokenExpiresAt: ISODateString;
  offlineGrant: MobileOfflineGrant;
  userSnapshot: MobileUserSnapshot;
}
