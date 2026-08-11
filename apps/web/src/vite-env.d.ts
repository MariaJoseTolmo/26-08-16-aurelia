/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /**
   * Mock de desarrollo de las validaciones del flujo SIDREP. `'true'` hace que
   * `waste-withdrawal-validation.service` responda desde
   * `waste-withdrawal-validation.mock` en vez de llamar a la API.
   *
   * Existe porque los dos endpoints todavía no están implementados y sin ellos el
   * paso 2 del flujo es inalcanzable. SE BORRA cuando el backend los exponga.
   */
  readonly VITE_WASTE_VALIDATION_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
