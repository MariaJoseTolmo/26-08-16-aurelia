const utmBands = 'CDEFGHJKLMNPQRSTUVWX';

export function isFiniteCoordinate(latitude: number | null | undefined, longitude: number | null | undefined): latitude is number {
  return typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function latitudeBand(latitude: number): string {
  const index = Math.max(0, Math.min(utmBands.length - 1, Math.floor((latitude + 80) / 8)));
  return utmBands[index];
}

export function toUtmLabel(latitude: number, longitude: number): string {
  if (!isFiniteCoordinate(latitude, longitude)) return 'Coordenada no válida';

  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e = Math.sqrt(f * (2 - f));
  const ePrimeSquared = e * e / (1 - e * e);
  const zone = Math.floor((longitude + 180) / 6) + 1;
  const lonOrigin = (zone - 1) * 6 - 180 + 3;
  const latRad = latitude * Math.PI / 180;
  const lonRad = longitude * Math.PI / 180;
  const lonOriginRad = lonOrigin * Math.PI / 180;
  const n = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
  const t = Math.tan(latRad) * Math.tan(latRad);
  const c = ePrimeSquared * Math.cos(latRad) * Math.cos(latRad);
  const x = Math.cos(latRad) * (lonRad - lonOriginRad);
  const m = a * ((1 - e * e / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256) * latRad - (3 * e * e / 8 + 3 * e ** 4 / 32 + 45 * e ** 6 / 1024) * Math.sin(2 * latRad) + (15 * e ** 4 / 256 + 45 * e ** 6 / 1024) * Math.sin(4 * latRad) - (35 * e ** 6 / 3072) * Math.sin(6 * latRad));
  let easting = k0 * n * (x + (1 - t + c) * x ** 3 / 6 + (5 - 18 * t + t * t + 72 * c - 58 * ePrimeSquared) * x ** 5 / 120) + 500000;
  let northing = k0 * (m + n * Math.tan(latRad) * (x * x / 2 + (5 - t + 9 * c + 4 * c * c) * x ** 4 / 24 + (61 - 58 * t + t * t + 600 * c - 330 * ePrimeSquared) * x ** 6 / 720));

  if (latitude < 0) northing += 10000000;

  easting = Math.round(easting);
  northing = Math.round(northing);

  return `${zone}${latitudeBand(latitude)} ${easting}E ${northing}N`;
}

export function formatAccuracyLabel(accuracy: number | null): string {
  if (accuracy === null || Number.isNaN(accuracy)) return 'Precisión no disponible';
  return `± ${accuracy.toFixed(1)} m`;
}

export function formatLocationLabel(latitude: number, longitude: number, accuracyLabel: string): string {
  return `${toUtmLabel(latitude, longitude)} ${accuracyLabel}`;
}

function latLngToWorldPixel(latitude: number, longitude: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sinLatitude = Math.sin(latitude * Math.PI / 180);
  const x = ((longitude + 180) / 360) * scale;
  const y = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function worldPixelToLatLng(x: number, y: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const longitude = x / scale * 360 - 180;
  const mercator = Math.PI - 2 * Math.PI * y / scale;
  const latitude = 180 / Math.PI * Math.atan(0.5 * (Math.exp(mercator) - Math.exp(-mercator)));
  return { latitude, longitude };
}

export function moveLatLngFromViewportPoint(params: {
  latitude: number;
  longitude: number;
  mapWidth: number;
  mapHeight: number;
  locationX: number;
  locationY: number;
  zoom?: number;
}) {
  const zoom = params.zoom ?? 14;

  if (!isFiniteCoordinate(params.latitude, params.longitude)) return null;
  if (![params.mapWidth, params.mapHeight, params.locationX, params.locationY].every(Number.isFinite)) return null;
  if (params.mapWidth <= 0 || params.mapHeight <= 0) return null;

  const center = latLngToWorldPixel(params.latitude, params.longitude, zoom);
  const nextX = center.x + params.locationX - params.mapWidth / 2;
  const nextY = center.y + params.locationY - params.mapHeight / 2;
  const next = worldPixelToLatLng(nextX, nextY, zoom);

  if (!isFiniteCoordinate(next.latitude, next.longitude)) return null;

  return next;
}
