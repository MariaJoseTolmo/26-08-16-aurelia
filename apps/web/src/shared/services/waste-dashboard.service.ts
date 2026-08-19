import { env } from '../config/env';
import { httpGet, httpPost } from './http-client';
import {
  mockDismissWasteDashboardAlert,
  mockWasteDashboardAlerts,
  mockWasteDashboardKpis,
  mockWasteNonHazardousWithdrawals,
  mockWasteRcaThresholds,
} from './waste-dashboard.mock';

/**
 * Lecturas del "Dashboard Residuos" (nodo Figma `3086:13957`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL ENDPOINT NO EXISTE TODAVÍA
 *
 * `apps/api/src/modules/waste/waste.controller.ts` expone hoy catálogos, lotes,
 * recepciones, solicitudes de retiro, SIDREP y períodos SINADER — ninguna
 * agregación para el dashboard. Las tres rutas de abajo son la PROPUESTA de
 * contrato para el backend; hasta que se implementen, los hooks caen en su estado
 * de error y cada bloque muestra "no se pudo cargar" con Reintentar. Eso es
 * correcto por defecto: no se simula un éxito que el servidor no dio.
 *
 * Es la misma convención que `waste-withdrawal-validation.service.ts` ya sigue
 * para las dos validaciones del paso 1 de SIDREP, incluida la bandera de mock de
 * desarrollo —`VITE_WASTE_DASHBOARD_MOCK`— que sirve para REVISAR la pantalla con
 * datos. Viene apagada: hay que pedirla explícitamente.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LOS TIPOS DE ABAJO VAN A `@aurelia/contracts` cuando el backend los implemente.
 * Viven acá y no allá porque `CONTRACTS_GUIDELINES.md` pide PROPONER un contrato
 * nuevo, no agregarlo unilateralmente. Destino sugerido:
 *
 *   `dtos/waste/waste-non-hazardous-withdrawals.response.ts`
 *   `dtos/waste/waste-dashboard-kpis.response.ts`
 *   `dtos/waste/waste-rca-thresholds.response.ts`
 *   `dtos/waste/waste-dashboard-alerts.response.ts`
 */

/**
 * Gravedad de la alerta. Decide el COLOR del badge, no el icono.
 *
 * Vive acá y no en el módulo de residuos porque es parte del contrato propuesto:
 * lo manda el servidor. El mapa de gravedad → color sí es del módulo
 * (`WASTE_ALERT_SEVERITY_STYLES`), que es lo que corresponde — `shared/` no puede
 * depender de un módulo.
 */
export type WasteAlertSeverity = 'WARNING' | 'CRITICAL';

/**
 * Qué regla disparó la alerta. Decide el ICONO, no el color.
 *
 * Es un enum cerrado y no un string libre porque el icono es una decisión de
 * presentación: el servidor dice qué pasó, el front elige el glifo. Los tres
 * valores son las tres alertas del nodo `3086:13898`.
 */
export type WasteAlertKind =
  /** Folio SIDREP abierto más allá de su plazo de confirmación de cierre. */
  | 'FOLIO_CLOSURE_OVERDUE'
  /** Diferencia de peso entre despacho y recepción. */
  | 'WEIGHT_DISCREPANCY'
  /** Partida acercándose al límite de almacenaje en bodega. */
  | 'STORAGE_LIMIT';

/**
 * Un fragmento del mensaje de la alerta.
 *
 * El diseño pone en NEGRITA los valores dentro de la frase —"Folio **#SR-2026-0812**
 * lleva **4 días** abierto…"—, así que el mensaje no puede viajar como un string
 * plano sin perder ese énfasis.
 *
 * Se eligió que el texto lo redacte el SERVIDOR y no el front, al revés que en los
 * KPIs. El motivo es el catálogo: los KPIs son cuatro y fijos, mientras que las
 * alertas son un feed que crece con cada regla nueva de negocio, y componer la
 * frase acá obligaría a publicar la web cada vez que el backend agrega una regla.
 * El front igual conserva lo que es presentación —icono, color y jerarquía—.
 */
export interface WasteAlertMessageSegment {
  text: string;
  /** `true` para los fragmentos en negrita, que en el diseño son siempre los valores. */
  strong?: boolean;
}

export interface WasteDashboardAlert {
  id: string;
  kind: WasteAlertKind;
  severity: WasteAlertSeverity;
  /** Frase principal, en fragmentos, para poder reproducir las negritas del nodo. */
  message: WasteAlertMessageSegment[];
  /** Segunda línea, p. ej. "Resiter S.A. · sobre el plazo de 3 días". */
  detail: string;
  /**
   * Si el aprobador puede descartarla. En el nodo, la tercera alerta NO trae botón
   * de cierre: ya fue notificada a Servicios Generales, así que no es suya para
   * descartar.
   */
  dismissible: boolean;
}

export interface WasteDashboardAlertsResponse {
  alerts: WasteDashboardAlert[];
}

export const getWasteDashboardAlerts = () =>
  env.wasteDashboardMock
    ? mockWasteDashboardAlerts()
    : httpGet<WasteDashboardAlertsResponse>('/waste/dashboard/alerts');

/**
 * Descarta una alerta.
 *
 * Es `POST .../dismiss` y no `DELETE .../:id` porque la alerta no se borra: se
 * marca como vista por este usuario. El registro de que la regla disparó tiene que
 * sobrevivir al descarte.
 */
export const dismissWasteDashboardAlert = (alertId: string) =>
  env.wasteDashboardMock
    ? mockDismissWasteDashboardAlert(alertId)
    : httpPost<Record<string, never>, void>(
        `/waste/dashboard/alerts/${encodeURIComponent(alertId)}/dismiss`,
        {},
      );

/**
 * Un residuo específico dentro de una categoría (nodo `4304:31141`), como lo
 * muestra la fila expandida del modal de detalle.
 */
export interface WasteRcaCategoryBreakdownItem {
  /** Nombre del residuo, p. ej. "Aceite lubricante usado". */
  wasteName: string;
  /**
   * Acumulado del mes para ese residuo, en KILOGRAMOS —no en toneladas—: es la
   * unidad que usa el nodo ("XXXX Kg"), porque un residuo individual pesa órdenes
   * menos que el total de su categoría.
   *
   * String numérico por el mismo motivo que el resto del módulo: `numeric` de
   * Postgres llega como texto y redondear en el camino pierde precisión.
   */
  kilograms: string;
}

/** Una categoría de residuo contra su umbral RCA mensual (nodo `3785:46353`). */
export interface WasteRcaThresholdCategory {
  /** Nombre de la categoría: "Residuos peligrosos", "Industriales no peligrosos", "Domésticos". */
  category: string;
  /**
   * Acumulado del mes en toneladas. Va como STRING numérico, igual que el resto
   * del módulo: las columnas `numeric` de Postgres llegan como texto y redondear
   * en el camino sería perder precisión de un dato que va a un informe
   * reglamentario.
   */
  accumulatedTons: string;
  /** Umbral RCA mensual de la categoría, en toneladas. Mismo criterio de string. */
  thresholdTons: string;
  /**
   * Desglose por residuo, para la fila expandida del modal `4304:31130`.
   *
   * DEBE VENIR COMPLETO: el porcentaje de cada barra se calcula contra la SUMA del
   * desglose, así que una lista recortada a los primeros N haría que los
   * porcentajes describieran solo lo listado y no la categoría. Si el desglose
   * crece al punto de no convenir en esta respuesta, se mueve a su propio endpoint
   * y se carga al expandir.
   *
   * Viaja en la MISMA respuesta y no en una lectura aparte porque son unos pocos
   * residuos por categoría y el modal se llama "Ver detalle completo": pedirlo al
   * expandir agregaría un spinner por fila para ahorrar bytes que no pesan.
   */
  breakdown: WasteRcaCategoryBreakdownItem[];
}

export interface WasteRcaThresholdsResponse {
  /** En el orden en que se muestran. El orden lo decide el servidor, no el cliente. */
  categories: WasteRcaThresholdCategory[];
}

/**
 * Acumulado del mes por categoría contra su umbral RCA.
 *
 * Devuelve el acumulado y el umbral CRUDOS, no el porcentaje ni la etiqueta
 * "98 / 140 ton (70%)": el porcentaje decide el color de la barra comparándose con
 * el avance del mes, y esa regla ya vive en `resolveWasteAccumulationTone` de
 * contracts —compartida con el PDF que genera la API—. Si el servidor mandara el
 * porcentaje ya calculado habría dos fuentes para el mismo número.
 */
export const getWasteRcaThresholds = () =>
  env.wasteDashboardMock
    ? mockWasteRcaThresholds()
    : httpGet<WasteRcaThresholdsResponse>('/waste/dashboard/rca-thresholds');

/**
 * Los cuatro KPIs de la fila superior (nodo `3086:13811`).
 *
 * Devuelve NÚMEROS CRUDOS, no las frases ya armadas ("3 vs. junio", "+4pp",
 * "2 sobre SLA"). Esas frases son presentación: dependen del idioma de la interfaz
 * y del criterio de color, y las compone `buildWasteDashboardKpis`. El servidor
 * aporta los hechos.
 */
export interface WasteDashboardKpisResponse {
  /** Retiros peligrosos cerrados en el mes en curso. */
  hazardousWithdrawalsThisMonth: number;
  /**
   * Los del mes anterior. Va el CONTEO y no el delta: con los dos valores el
   * cliente arma "3 vs. junio" y además puede mostrar la dirección; con solo el
   * delta perdería el segundo dato para siempre.
   */
  hazardousWithdrawalsPreviousMonth: number;
  /** Folios SIDREP cerrados dentro de plazo, en porcentaje 0–100. */
  sidrepClosedOnTimePercentage: number;
  /** Variación contra el mes anterior, en puntos porcentuales. Puede ser negativa. */
  sidrepClosedOnTimeDeltaPoints: number;
  /** Folios SIDREP abiertos. */
  openFolios: number;
  /** Cuántos de esos folios abiertos ya pasaron su SLA. */
  openFoliosOverSla: number;
  /** Alertas activas que requieren acción. Es el mismo número que titula `3086:13893`. */
  activeAlerts: number;
}

export const getWasteDashboardKpis = () =>
  env.wasteDashboardMock
    ? mockWasteDashboardKpis()
    : httpGet<WasteDashboardKpisResponse>('/waste/dashboard/kpis');

/** Un mes de la serie de retiros no peligrosos. */
export interface WasteNonHazardousWithdrawalMonth {
  /**
   * Mes en `YYYY-MM`. Va en formato máquina y NO con la abreviatura ya escrita
   * ("Mar", "Abr"): el rótulo es presentación y se arma en el cliente, que es el
   * único lado que conoce el idioma de la interfaz.
   */
  month: string;
  /** Cantidad de retiros no peligrosos consolidados en ese mes. */
  withdrawals: number;
}

export interface WasteNonHazardousWithdrawalsResponse {
  /** Serie ordenada de más antiguo a más reciente. El diseño muestra cinco meses. */
  months: WasteNonHazardousWithdrawalMonth[];
}

/**
 * Serie mensual de retiros no peligrosos.
 *
 * `months` es la ventana pedida, y la resuelve el SERVIDOR: el consolidado de
 * Servicios Generales es mensual y cerrado, así que el recorte pertenece a quien
 * tiene los datos, no al cliente pidiendo todo el histórico para descartar la
 * mayoría en memoria.
 */
export const getWasteNonHazardousWithdrawals = (months: number) =>
  env.wasteDashboardMock
    ? mockWasteNonHazardousWithdrawals(months)
    : httpGet<WasteNonHazardousWithdrawalsResponse>(
        `/waste/dashboard/non-hazardous-withdrawals?months=${months}`,
      );
