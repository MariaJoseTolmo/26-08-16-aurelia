function readRequiredEnv(name: 'VITE_API_URL', value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing required environment variable ${name}`);
  return normalized;
}

/**
 * Bandera booleana opcional. Solo `'true'` la activa: cualquier otro valor
 * —incluido `'1'` o `'yes'`— la deja apagada, para que no se prenda por accidente
 * en un `.env` de producción.
 */
function readFlagEnv(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export const env = {
  apiUrl: readRequiredEnv('VITE_API_URL', import.meta.env.VITE_API_URL),
  /**
   * Mock de las dos validaciones del flujo SIDREP. Ver `vite-env.d.ts`.
   *
   * ES TEMPORAL: se borra junto con `waste-withdrawal-validation.mock.ts` cuando el
   * backend exponga `POST /waste/withdrawals/validate-transport` y
   * `POST /waste/withdrawals/weighing-ticket`.
   */
  wasteValidationMock: readFlagEnv(import.meta.env.VITE_WASTE_VALIDATION_MOCK),
};