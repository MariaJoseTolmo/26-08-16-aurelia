// PLACEHOLDER: validacion de rango historico sin respaldo en backend.
// AurelIA deberia exponer promedios de 6 meses y reglas de desviacion via API.
// Por ahora se simula con promedios mock por codigo de parametro (Figma 2670:1398 / 1395:4462).

export const SPR_HISTORICAL_RANGE_THRESHOLD_PERCENT = 10;

export const SPR_HISTORICAL_RANGE_COPY = {
  alertTitle: 'Valor fuera del rango histórico habitual',
  alertBody:
    'El valor ingresado tiene una desviación mayor al 10% respecto al promedio de los últimos 6 meses. Por favor, agregue un comentario justificando la diferencia en “Notas para el gerente de área”.',
  alertHelper: 'Puedes enviar el formulario con esta desviación solo si describes el motivo de la diferencia.',
  averageLabel: 'Promedio últimos 6 meses',
  lowerLimitLabel: 'Límite inferior (−10%)',
  upperLimitLabel: 'Límite superior (+10%)',
  notesRequiredHint: 'Este campo es obligatorio cuando hay desviación y queda registrado en la trazabilidad.',
  submitBlockedByNotes: 'Completa las notas de los parámetros con desviación para poder firmar y enviar',
} as const;

// Promedio de 6 meses mock por codigo de parametro (ej. control SOX del diseno).
export const SPR_MOCK_HISTORICAL_AVERAGES: Record<string, number> = {
  ESG_SD_C06_WMA: 44.2,
  // MOCK temporal para pruebas visuales con el seed actual ("Consumo mensual de energia").
  // Pendiente de reemplazar cuando el equipo defina la regla real de negocio / API de promedios.
  'ENERGY-CONSUMPTION-KWH': 44.2,
};

export interface SprHistoricalRangeResult {
  isOutOfRange: boolean;
  enteredValue: number | null;
  averageValue: number | null;
  lowerLimit: number | null;
  upperLimit: number | null;
  deviationPercent: number | null;
}

export function parseSprNumericValue(value: string): number | null {
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function evaluateHistoricalRange(parameterCode: string, valueText: string): SprHistoricalRangeResult {
  const averageValue = SPR_MOCK_HISTORICAL_AVERAGES[parameterCode] ?? null;
  const enteredValue = parseSprNumericValue(valueText);

  if (averageValue === null || enteredValue === null || averageValue === 0) {
    return {
      isOutOfRange: false,
      enteredValue,
      averageValue,
      lowerLimit: null,
      upperLimit: null,
      deviationPercent: null,
    };
  }

  const factor = SPR_HISTORICAL_RANGE_THRESHOLD_PERCENT / 100;
  const lowerLimit = averageValue * (1 - factor);
  const upperLimit = averageValue * (1 + factor);
  const deviationPercent = ((enteredValue - averageValue) / averageValue) * 100;
  const isOutOfRange = Math.abs(deviationPercent) > SPR_HISTORICAL_RANGE_THRESHOLD_PERCENT;

  return { isOutOfRange, enteredValue, averageValue, lowerLimit, upperLimit, deviationPercent };
}

export function formatDeviationPercent(deviationPercent: number) {
  const sign = deviationPercent > 0 ? '+' : '';
  return `${sign}${deviationPercent.toFixed(1)}%`;
}

/** Nota efectiva (borrador UI o registro persistido) para validar desviaciones. */
export function resolveSprHistoricalNote(
  draftNote: string | undefined,
  recordNotes: string | null | undefined,
): string {
  const draft = draftNote?.trim() ?? '';
  if (draft !== '') return draft;
  return recordNotes?.trim() ?? '';
}

export function hasSprHistoricalDeviationNote(
  draftNote: string | undefined,
  recordNotes: string | null | undefined,
): boolean {
  return resolveSprHistoricalNote(draftNote, recordNotes) !== '';
}
