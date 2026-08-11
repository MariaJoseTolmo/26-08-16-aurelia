import { env } from '../config/env';
import { httpPost, httpPostForm } from './http-client';
import {
  mockAnalyzeWeighingTicket,
  mockValidateWithdrawalTransport,
} from './waste-withdrawal-validation.mock';

/**
 * Validaciones del paso 1 del flujo SIDREP (nodos `3765:39262` sin validar y
 * `4085:77186` validado).
 *
 * Son las dos consultas que el diseño da por hechas:
 *
 *   `POST /waste/withdrawals/validate-transport`  patente + residuo contra el
 *                                                 maestro de transportistas
 *   `POST /waste/withdrawals/weighing-ticket`     ticket de pesaje → tres pesos
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NINGUNO DE LOS DOS ENDPOINTS EXISTE TODAVÍA
 *
 * `waste.controller.ts` solo expone lecturas de catálogos. Estas rutas son la
 * PROPUESTA de contrato para el backend; hasta que se implementen, los dos hooks
 * caen en su estado de error y las tarjetas muestran "no se pudo validar" con
 * Reintentar. Eso es correcto y es lo que hay que ver: no se simula un éxito que
 * el servidor no dio.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LOS TIPOS DE ABAJO VAN A `@aurelia/contracts` cuando el backend los implemente.
 * Viven acá y no allá porque `CONTRACTS_GUIDELINES.md` pide PROPONER un contrato
 * nuevo, no agregarlo unilateralmente. Destino sugerido:
 *
 *   `dtos/waste/validate-withdrawal-transport.request.ts`
 *   `dtos/waste/withdrawal-transport-validation.response.ts`
 *   `dtos/waste/weighing-ticket-analysis.response.ts`
 *   `enums/resolution-status.enum.ts`  (`VIGENTE` / `VENCIDA`)
 */

export interface ValidateWithdrawalTransportRequest {
  /** Patente tecleada, tal cual. La normalización es del backend. */
  plate: string;
  driverName: string;
  /** Transportista elegido en el paso anterior. */
  carrierId: string;
  disposalSiteId: string;
  /** Lote que se retira: el backend cruza su tipo de residuo con la resolución. */
  lotId: string;
}

/** Vigencia de la Resolución Exenta que autoriza al transportista. */
export type ResolutionStatus = 'vigente' | 'vencida';

export interface WithdrawalTransportValidationResponse {
  valid: boolean;
  /** Patente normalizada por el backend, que es la que se muestra en el aviso. */
  plate: string;
  /** Número de la Resolución Exenta, p. ej. "10171/2022". */
  resolutionNumber: string;
  /** Razón social del transportista según la resolución. */
  carrierName: string;
  resolutionStatus: ResolutionStatus;
}

/**
 * Pesos que el backend transcribe del ticket.
 *
 * Van como STRING numérico y no como `number`, igual que el resto del módulo: las
 * columnas `numeric` de Postgres llegan como texto y redondear en el camino sería
 * perder precisión de un dato que va a un informe reglamentario.
 */
export interface WeighingTicketAnalysisResponse {
  grossWeightKg: string;
  tareWeightKg: string;
  netWeightKg: string;
}

/*
 * LAS DOS RAMAS DE MOCK SON TEMPORALES. Se borran junto con
 * `waste-withdrawal-validation.mock.ts` cuando existan los endpoints. Viven acá
 * —en la frontera HTTP— y no en los hooks a propósito: así los hooks, las tarjetas
 * y la página no saben nada del mock y no hay que tocarlos el día que se vaya.
 */

export const validateWithdrawalTransport = (input: ValidateWithdrawalTransportRequest) =>
  env.wasteValidationMock
    ? mockValidateWithdrawalTransport(input)
    : httpPost<ValidateWithdrawalTransportRequest, WithdrawalTransportValidationResponse>(
        '/waste/withdrawals/validate-transport',
        input,
      );

/**
 * Sube el ticket y devuelve los pesos.
 *
 * Va por `httpPostForm` porque es un archivo: el `http-client` ya distingue ese
 * caso y no le pone `Content-Type`, para que el navegador arme el `boundary`.
 */
export function analyzeWeighingTicket(file: File) {
  if (env.wasteValidationMock) return mockAnalyzeWeighingTicket();

  const body = new FormData();
  body.append('file', file);
  return httpPostForm<WeighingTicketAnalysisResponse>('/waste/withdrawals/weighing-ticket', body);
}
