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
  /**
   * Mock de desarrollo de las tres lecturas del Dashboard Residuos. `'true'` hace
   * que `waste-dashboard.service` responda desde `waste-dashboard.mock` en vez de
   * llamar a la API.
   *
   * Existe porque `GET /waste/dashboard/kpis`, `/rca-thresholds` y
   * `/non-hazardous-withdrawals` todavía no están implementados, y sin ellos la
   * pantalla solo sabe mostrar sus estados de error: no hay forma de revisar
   * barras, tonos ni fidelidad al diseño. SE BORRA cuando el backend los exponga.
   */
  readonly VITE_WASTE_DASHBOARD_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
