import type { WasteOption } from './wasteFilterPrimitives';
import type {
  WeighingTicketAnalysisResponse,
  WithdrawalTransportValidationResponse,
} from '../../shared/services/waste-withdrawal-validation.service';

/**
 * Estado del paso 1 del flujo SIDREP —"Datos del traslado"— y sus reglas.
 *
 * Mismo papel que `wasteWithdrawalForm.ts` para la pantalla anterior: el modelo y
 * las reglas viven fuera de `components/` para que las tarjetas solo dibujen.
 */

export interface WasteSidrepFormValues {
  /** Patente del vehículo. Nodo `3765:39426`. */
  plate: string;
  /** Nombre del conductor. Nodo `3765:39431`. */
  driver: string;
  /** Lugar de disposición final. Nodo `3765:39436`. */
  disposalSite: string | null;
  /**
   * Ticket de pesaje. Nodo `4230:10649`.
   *
   * De él dependen los tres campos de peso: el nodo los dibuja con "Se necesita
   * ticket de pesaje" justamente porque todavía no hay archivo.
   */
  weighingTicket: File | null;
}

export function createWasteSidrepFormValues(): WasteSidrepFormValues {
  return { plate: '', driver: '', disposalSite: null, weighingTicket: null };
}

/**
 * Lugares de disposición final de muestra.
 *
 * SON DATOS DE MUESTRA. El párrafo del nodo `3765:39420` dice que estos datos "se
 * validan automáticamente contra el maestro de transportistas y destinatarios
 * registrados", así que el catálogo real existe en el negocio pero todavía no
 * tiene endpoint. Cuando lo tenga, se reemplazan por su `useQuery`.
 */
export const WASTE_DISPOSAL_SITE_OPTIONS: WasteOption[] = [
  { value: 'hidronor-pudahuel', label: 'Hidronor — Planta Pudahuel' },
  { value: 'hidronor-antofagasta', label: 'Hidronor — Planta Antofagasta' },
  { value: 'bravo-energy-quilicura', label: 'Bravo Energy — Quilicura' },
  { value: 'recimat-san-bernardo', label: 'Recimat — San Bernardo' },
  { value: 'relleno-til-til', label: 'Relleno Sanitario Til Til' },
];

/** Tipos y tamaño que acepta la carga, del nodo `4230:10655`. */
export const WEIGHING_TICKET_ACCEPT = 'image/png,image/jpeg,application/pdf';
export const WEIGHING_TICKET_MAX_MB = 10;
/** Texto del nodo `4230:10655`. El "·" va pegado a "Pdf", como en el diseño. */
export const WEIGHING_TICKET_HINT = 'Png, Jpg, Pdf· Máx. 10 MB';

/**
 * Texto de los tres campos de peso mientras no hay ticket — nodos `4230:10660`,
 * `4230:10663` y `4230:10666`.
 */
export const WEIGHT_PENDING_LABEL = 'Se necesita ticket de pesaje';

/** Los tres pesos del nodo `4230:10657`, en orden. */
export const WASTE_WEIGHT_FIELDS = ['Peso bruto', 'Peso tara', 'Peso neto'] as const;

/**
 * `true` cuando el paso 1 está completo y se puede continuar al paso 2.
 *
 * Habilita el botón "Continuar" del nodo `3765:39466`, que el diseño dibuja
 * DESHABILITADO. El ticket cuenta como requisito porque de él salen los tres pesos:
 * sin archivo, el paso queda con tres campos vacíos que el flujo SIDREP necesita.
 */
export function isWasteSidrepStepOneComplete(
  values: WasteSidrepFormValues,
  validation?: { transportValid: boolean; weights: WeighingTicketAnalysisResponse | null },
): boolean {
  const fieldsReady =
    values.plate.trim().length > 0 &&
    values.driver.trim().length > 0 &&
    values.disposalSite !== null &&
    values.weighingTicket !== null;

  if (!fieldsReady) return false;
  // Sin validación aún resuelta, los campos completos no alcanzan: el paso 2 del
  // flujo SIDREP arranca de una patente autorizada y de tres pesos reales.
  if (!validation) return false;

  return validation.transportValid && validation.weights !== null;
}

/**
 * Mensaje del aviso verde — nodo `4085:77269`.
 *
 * Se compone ACÁ y no lo devuelve el backend: la copia vive del lado del front
 * como el resto del módulo, y así el día que haya traducciones no hay que tocar la
 * API. El backend solo aporta los datos (patente normalizada, número de resolución,
 * razón social, vigencia).
 */
export function formatTransportValidationMessage(
  validation: WithdrawalTransportValidationResponse,
): string {
  return `Patente ${validation.plate} y tipo de residuo verificados contra la Resolución Exenta N°${validation.resolutionNumber} de ${validation.carrierName} — ${validation.resolutionStatus}.`;
}

/** Motivo del rechazo cuando el backend responde `valid: false`. */
export function formatTransportRejectionMessage(
  validation: WithdrawalTransportValidationResponse,
): string {
  return `La patente ${validation.plate} no está autorizada en la Resolución Exenta N°${validation.resolutionNumber} de ${validation.carrierName} (${validation.resolutionStatus}).`;
}

/**
 * "1.250 kg" — nodo `4085:77294`. Separador de miles con punto, como en es-CL.
 *
 * El dato llega como string numérico desde la API; si no parsea se devuelve tal
 * cual antes que mostrar "NaN kg".
 */
export function formatWeightKg(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `${value} kg`;
  return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(parsed)} kg`;
}
