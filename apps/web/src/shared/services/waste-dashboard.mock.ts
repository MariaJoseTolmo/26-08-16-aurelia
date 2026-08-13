import type {
  WasteDashboardAlert,
  WasteDashboardAlertsResponse,
  WasteDashboardKpisResponse,
  WasteNonHazardousWithdrawalsResponse,
  WasteRcaThresholdsResponse,
} from './waste-dashboard.service';

/**
 * Mock de desarrollo de las tres lecturas del Dashboard Residuos.
 *
 * ES TEMPORAL. Se borra junto con las ramas de `waste-dashboard.service.ts` que lo
 * consultan, en cuanto el backend exponga los tres endpoints. Mismo patrón y mismo
 * ciclo de vida que `waste-withdrawal-validation.mock.ts`.
 *
 * Existe para poder REVISAR la pantalla: sin datos, los tres bloques solo saben
 * mostrar su estado de error y no hay forma de comprobar barras, tonos, la pastilla
 * "Hoy", la leyenda ni la fidelidad al diseño.
 *
 * LOS NÚMEROS SON LOS DEL DISEÑO, no inventados: salen de los nodos `3086:13811`
 * (KPIs), `3086:13843` (umbrales RCA) y `3086:13931` (retiros no peligrosos). Así
 * lo que se ve en pantalla es comparable contra el archivo de Figma.
 */

/** Retardo para que los estados de carga sean visibles y no un parpadeo. */
const MOCK_LATENCY_MS = 400;

function resolveAfterLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_LATENCY_MS);
  });
}

/**
 * Nodo `3086:13811`.
 *
 * "3 vs. junio" del diseño sale de 18 este mes contra 15 el anterior. El nombre
 * del mes lo pone `buildWasteDashboardKpis` con la fecha real, así que en agosto
 * dirá "3 vs. julio": el delta es el dato, el mes es presentación.
 */
export function mockWasteDashboardKpis(): Promise<WasteDashboardKpisResponse> {
  return resolveAfterLatency({
    hazardousWithdrawalsThisMonth: 18,
    hazardousWithdrawalsPreviousMonth: 15,
    sidrepClosedOnTimePercentage: 89,
    sidrepClosedOnTimeDeltaPoints: 4,
    openFolios: 12,
    openFoliosOverSla: 2,
    activeAlerts: 3,
  });
}

/**
 * Nodo `3086:13843`: 98/140, 112/130 y 34/60 toneladas.
 *
 * OJO AL COMPARAR LOS COLORES CONTRA LA IMAGEN DEL DISEÑO. El tono no sale del
 * porcentaje solo, sino de su distancia al avance REAL del mes, y el nodo está
 * dibujado con el mes al 52% (día 16 de 31). Con estos mismos números:
 *
 *   avance 52% (el del nodo)   70% → Adelantado +18   86% → Crítico +34   57% → Normal +5
 *   avance 42% (día 13 de 31)  70% → Crítico +28      86% → Crítico +44   57% → Adelantado +15
 *
 * No es un error: la regla mide RITMO, y a principio de mes el mismo acumulado
 * está más adelantado respecto de lo esperado. Para ver la paleta exacta del nodo
 * hay que fijar la fecha —`WarehouseMonthlyAccumulated` acepta `today` para eso—.
 */
export function mockWasteRcaThresholds(): Promise<WasteRcaThresholdsResponse> {
  /*
   * DESGLOSE POR RESIDUO, para la fila expandida del modal (nodo `4304:31130`).
   *
   * El nodo rotula "Residuo 1..4" con "XXXX Kg (#%)": son placeholders. Y sus
   * anchos de barra —214 / 169 / 158 / 85 sobre 476— suman más de 100%, o sea
   * tampoco describen una composición real.
   *
   * Acá los kilos SUMAN el acumulado de su categoría, que es lo que el contrato
   * exige para que los porcentajes signifiquen "participación en la categoría":
   * 98 ton → 98.000 Kg, 112 → 112.000, 34 → 34.000. Los nombres son los del
   * catálogo que ya usan los otros mocks del módulo, y cada categoría trae una
   * cantidad distinta de residuos para ejercitar listas de 4, 3 y 2.
   */
  return resolveAfterLatency({
    categories: [
      {
        category: 'Residuos peligrosos',
        accumulatedTons: '98',
        thresholdTons: '140',
        breakdown: [
          { wasteName: 'Aceite lubricante usado', kilograms: '44100' },
          { wasteName: 'Baterías de plomo-ácido', kilograms: '24500' },
          { wasteName: 'Envases contaminados', kilograms: '19600' },
          { wasteName: 'Huaipe y EPP contaminado', kilograms: '9800' },
        ],
      },
      {
        category: 'Industriales no peligrosos',
        accumulatedTons: '112',
        thresholdTons: '130',
        breakdown: [
          { wasteName: 'Chatarra metálica', kilograms: '56000' },
          { wasteName: 'Madera y pallets', kilograms: '39200' },
          { wasteName: 'Neumáticos fuera de uso', kilograms: '16800' },
        ],
      },
      {
        category: 'Domésticos',
        accumulatedTons: '34',
        thresholdTons: '60',
        breakdown: [
          { wasteName: 'Asimilables a domiciliarios', kilograms: '23800' },
          { wasteName: 'Reciclables segregados', kilograms: '10200' },
        ],
      },
    ],
  });
}

/**
 * Nodo `3086:13931`: 14, 17, 15, 19 y 22 retiros.
 *
 * La ventana se calcula RELATIVA a hoy y no con los meses fijos del diseño
 * (2026-03 … 2026-07). Dos razones: el mock no se vuelve viejo, y así ejercita el
 * camino principal del destaque —la barra del mes CORRIENTE— en vez del respaldo
 * "última barra de la serie", que es lo que pasaría con una ventana que termina en
 * el pasado. Las alturas son las del nodo igual, porque son los mismos conteos.
 */
export function mockWasteNonHazardousWithdrawals(
  months: number,
): Promise<WasteNonHazardousWithdrawalsResponse> {
  const counts = [14, 17, 15, 19, 22];
  const today = new Date();

  const series = Array.from({ length: months }, (_, index) => {
    // El último elemento es el mes corriente; hacia atrás, un mes por posición.
    const offset = months - 1 - index;
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);

    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      /*
       * Con una ventana más larga que los cinco conteos del diseño, se repiten
       * cíclicamente: es un mock, y lo que importa es que las alturas relativas
       * sean las del nodo en los últimos cinco meses.
       */
      withdrawals: counts[index % counts.length] ?? 0,
    };
  });

  return resolveAfterLatency({ months: series });
}

/**
 * Nodo `3086:13898`: las tres alertas del diseño, con sus negritas donde el nodo
 * las pone —siempre sobre los valores—.
 *
 * La tercera no es descartable: en el nodo es la única sin botón de cierre, porque
 * ya fue notificada a Servicios Generales.
 */
const MOCK_ALERTS: WasteDashboardAlert[] = [
  {
    id: 'SR-2026-0812-closure',
    kind: 'FOLIO_CLOSURE_OVERDUE',
    severity: 'WARNING',
    message: [
      { text: 'Folio ' },
      { text: '#SR-2026-0812', strong: true },
      { text: ' lleva ' },
      { text: '4 días', strong: true },
      { text: ' abierto sin confirmación de cierre.' },
    ],
    detail: 'Resiter S.A. · sobre el plazo de 3 días',
    dismissible: true,
  },
  {
    id: 'SR-2026-0790-weight',
    kind: 'WEIGHT_DISCREPANCY',
    severity: 'WARNING',
    message: [
      { text: 'Diferencia de peso de ' },
      { text: '410 kg', strong: true },
      { text: ' entre despacho y recepción en folio ' },
      { text: '#SR-2026-0790', strong: true },
      { text: '.' },
    ],
    detail: 'Sobre el rango habitual (~300-500 kg) · requiere justificación',
    dismissible: true,
  },
  {
    id: 'lot-storage-limit',
    kind: 'STORAGE_LIMIT',
    severity: 'CRITICAL',
    message: [
      { text: 'Partida en bodega de acopio lleva ' },
      { text: '3,1 meses', strong: true },
      { text: ' almacenada (máx. 6 meses).' },
    ],
    detail: 'Notificado a subintendencia de Servicios Generales',
    dismissible: false,
  },
];

/**
 * Descartes de esta sesión.
 *
 * El mock TIENE ESTADO a propósito: sin él, descartar una alerta invalidaba la
 * query, el refetch devolvía las tres otra vez y la fila reaparecía. Con el estado,
 * la interacción se puede revisar de verdad, que es para lo que existe el mock.
 * Vive en memoria del módulo: recargar la página las devuelve todas.
 */
const dismissedAlertIds = new Set<string>();

export function mockWasteDashboardAlerts(): Promise<WasteDashboardAlertsResponse> {
  return resolveAfterLatency({
    alerts: MOCK_ALERTS.filter((alert) => !dismissedAlertIds.has(alert.id)),
  });
}

export function mockDismissWasteDashboardAlert(alertId: string): Promise<void> {
  dismissedAlertIds.add(alertId);
  return resolveAfterLatency(undefined);
}
