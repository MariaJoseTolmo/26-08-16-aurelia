import type {
  ValidateWithdrawalTransportRequest,
  WeighingTicketAnalysisResponse,
  WithdrawalTransportValidationResponse,
} from './waste-withdrawal-validation.service';

/**
 * ARCHIVO TEMPORAL. Mock de las dos validaciones del flujo SIDREP.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE Y CUÁNDO SE BORRA
 *
 * `POST /waste/withdrawals/validate-transport` y
 * `POST /waste/withdrawals/weighing-ticket` no están implementados. Sin ellos el
 * "Continuar" del paso 1 nunca se habilita —depende de las dos validaciones— y el
 * paso 2 queda inalcanzable, así que la pantalla no se puede revisar.
 *
 * Se activa con `VITE_WASTE_VALIDATION_MOCK=true` y SOLO con ese valor exacto.
 * Cuando el backend exponga los dos endpoints se borran: este archivo, la bandera
 * de `env.ts`, su entrada en `vite-env.d.ts` y las dos ramas de
 * `waste-withdrawal-validation.service.ts`. Cuatro lugares, todos anotados.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Latencia simulada, para que los estados de carga se alcancen a ver. */
const MOCK_DELAY_MS = 700;

function delay<TValue>(value: TValue): Promise<TValue> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

/**
 * Razón social por transportista.
 *
 * Se duplican los rótulos de `WASTE_CARRIER_OPTIONS` en vez de importarlos: eso
 * haría que `shared/services` dependa de `modules/waste`, que es la dirección
 * equivocada. Como es un mock que se va a borrar, la copia es más barata que
 * invertir la dependencia.
 */
const CARRIER_NAMES: Record<string, string> = {
  hidronor: 'Hidronor Chile S.A.',
  'bravo-energy': 'Bravo Energy Chile S.A.',
  recimat: 'Recimat S.A.',
  ecoprial: 'Ecoprial Ltda.',
  resiter: 'Resiter S.A.',
  'transportes-cordillera': 'Transportes Cordillera SpA',
};

/**
 * SENTINELA PARA PROBAR EL RECHAZO: una patente que termina en `-00` vuelve como
 * `valid: false`, para poder ver el estado de patente no autorizada sin tener que
 * tocar el código. No es una regla de negocio, es una perilla del mock.
 */
const REJECTED_PLATE_SUFFIX = '-00';

export function mockValidateWithdrawalTransport(
  input: ValidateWithdrawalTransportRequest,
): Promise<WithdrawalTransportValidationResponse> {
  const plate = input.plate.trim().toUpperCase();

  return delay({
    valid: !plate.endsWith(REJECTED_PLATE_SUFFIX),
    plate,
    // Los valores del nodo `4085:77269`.
    resolutionNumber: '10171/2022',
    carrierName: CARRIER_NAMES[input.carrierId] ?? 'Transportista autorizado',
    resolutionStatus: 'vigente',
  });
}

/** Los tres pesos del nodo `4085:77290`. */
export function mockAnalyzeWeighingTicket(): Promise<WeighingTicketAnalysisResponse> {
  return delay({
    grossWeightKg: '1250',
    tareWeightKg: '380',
    netWeightKg: '870',
  });
}
