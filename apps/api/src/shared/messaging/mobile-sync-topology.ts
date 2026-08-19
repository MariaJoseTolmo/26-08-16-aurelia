export const MOBILE_SYNC_TOPIC = 'aurelia.mobile.sync';
export const MOBILE_SYNC_INSPECTIONS_SUBSCRIPTION = 'mobile-inspecciones';
export const MOBILE_SYNC_INCIDENTS_SUBSCRIPTION = 'mobile-incidentes';

export const MOBILE_SYNC_MESSAGE_PROPERTIES = {
  appId: 'appId',
  deviceId: 'deviceId',
  deviceSessionId: 'deviceSessionId',
  batchId: 'batchId',
  bootstrapVersion: 'bootstrapVersion',
} as const;
