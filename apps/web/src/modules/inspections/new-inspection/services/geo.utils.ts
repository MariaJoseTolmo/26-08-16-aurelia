export function formatAccuracyLabel(accuracy: number | null): string {
  if (accuracy === null || Number.isNaN(accuracy)) return 'Precision no disponible';
  return `+- ${accuracy.toFixed(1)} m`;
}

export function formatLocationLabel(latitude: number, longitude: number, accuracyLabel: string): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)} ${accuracyLabel}`;
}
