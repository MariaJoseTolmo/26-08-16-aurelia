import type { SprMonthlyRecordResponse, SprParameterResponse } from '@aurelia/contracts';
import type { SprHistoricalRangeResult } from './sprHistoricalRange';

export type SprParameterCompletion = 'completed' | 'pending' | 'not-applicable';

// View-model que combina catalogo (parametro) + registro persistido + borrador de UI.
export interface SprParameterRow {
  parameter: SprParameterResponse;
  record: SprMonthlyRecordResponse | null;
  unitSymbol: string | null;
  completion: SprParameterCompletion;
  // Texto ya formateado para la lista (valor + unidad, "No aplica", "Sin completar").
  valueLabel: string;
  // PLACEHOLDER: alerta de rango historico (sin backend).
  needsHistoricalReview: boolean;
  historicalRange: SprHistoricalRangeResult | null;
  /** MOCK: valor estimado pendiente de reemplazo (Figma 2424:1066). */
  isEstimated: boolean;
}
