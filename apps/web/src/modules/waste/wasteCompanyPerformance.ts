/**
 * Modelo de la pestaña "Desempeño por empresa" — nodo Figma `3830:63513`.
 *
 * Vive fuera de `components/` por el mismo criterio que `wasteHistoryRows`: es el
 * MODELO de la vista, no su dibujo.
 *
 * DOS REGLAS DE COLOR que el nodo aplica y que conviene no perder de vista,
 * porque las dos son por elemento y NO por tarjeta:
 *
 * 1. El valor de cada métrica toma el tono del ESTADO de la tarjeta, salvo
 *    "Folios cerrados", que va siempre neutro. Se ve en la Empresa 1 (tres
 *    valores en #570b1d y el cuarto en #131313) y en la Empresa 2 (tres en
 *    #e8720c y el cuarto en #131313).
 * 2. El color de cada barra depende de SU valor, no del de la tarjeta. La
 *    Empresa 2 tiene cuatro barras teal y una naranja.
 */

export type WasteCompanyStatus = 'critical' | 'alert' | 'normal' | 'insufficient';

export const WASTE_COMPANY_STATUS_LABELS: Record<WasteCompanyStatus, string> = {
  critical: 'Crítico',
  alert: 'Alerta / Patrón detectado',
  normal: 'Normal',
  insufficient: 'Datos insuficientes',
};

/** SLA de cierre en días — el "(SLA: 3 días)" del rótulo de la primera métrica. */
export const WASTE_CLOSING_SLA_DAYS = 3;

/**
 * A partir de cuántos días una barra de la tendencia se pinta naranja.
 *
 * INFERIDO, no declarado por el diseño. Los quince valores dibujados en el nodo
 * son consistentes con `SLA × 2`:
 *
 *   Empresa 1   8,0  9,2  10,5  11,8  12,9   todas naranja
 *   Empresa 2   5,0  8,6   3,8   4,0   5,3   sólo 8,6 naranja
 *   Empresa 3   3,1  3,2   2,9   3,4   3,3   todas teal
 *
 * 5,3 queda teal y 8,0 naranja, así que el corte está entre ambos y 6 es el
 * único número redondo con sentido de negocio en ese rango. PENDIENTE DE
 * CONFIRMAR: si negocio define otro umbral, se cambia acá y nada más.
 */
export const WASTE_TREND_ALERT_DAYS = WASTE_CLOSING_SLA_DAYS * 2;

export interface WasteCompanyTrendPoint {
  /** Etiqueta corta del mes, como la dibuja el nodo: "Ene", "Feb"… */
  month: string;
  /** Días promedio de cierre de ese mes. */
  days: number;
}

export interface WasteCompanyMetric {
  /** Valor grande. `null` se dibuja como "—", el caso de "Datos insuficientes". */
  value: string | null;
  label: string;
  /**
   * Aclaración entre paréntesis, en un gris más claro dentro del MISMO párrafo.
   * La Empresa 4 la omite en "Folios sobre SLA", que queda sin paréntesis.
   */
  hint?: string;
  /**
   * Deja el valor en el gris neutro aunque la tarjeta esté en alerta. Sólo lo usa
   * "Folios cerrados": es un conteo, no una señal.
   */
  neutral?: boolean;
}

export interface WasteCompanyPerformance {
  id: string;
  name: string;
  status: WasteCompanyStatus;
  /** Las cuatro métricas de la grilla 2 × 2, en el orden del nodo. */
  metrics: WasteCompanyMetric[];
  /** Texto de la caja de nota, al pie de las métricas. */
  note: string;
  /**
   * Serie de la tendencia. La Empresa 4 NO trae gráfico en el nodo —no es que
   * esté vacío, el bloque no existe—, así que se modela como ausente.
   */
  trend?: WasteCompanyTrendPoint[];
}

const TREND_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May'] as const;

function buildTrend(values: number[]): WasteCompanyTrendPoint[] {
  return values.map((days, index) => ({ month: TREND_MONTHS[index] ?? '', days }));
}

/**
 * Las cuatro empresas del nodo, con sus valores de maqueta.
 *
 * Se reemplazan cuando exista el endpoint; la vista no cambia.
 */
export const WASTE_COMPANY_PERFORMANCE_DEFAULTS: WasteCompanyPerformance[] = [
  {
    id: 'empresa-1',
    name: 'Empresa 1',
    status: 'critical',
    metrics: [
      { value: '12,9 días', label: 'Promedio de cierre', hint: '(SLA: 3 días)' },
      { value: '138 de 150', label: 'Folios sobre SLA (92%)' },
      {
        value: '890 kg',
        label: 'Dif. de peso promedio',
        hint: '(44% · muy sobre tolerancia ~16%)',
      },
      { value: '4', label: 'Folios cerrados (may 2026)', neutral: true },
    ],
    note: 'Las 4 señales están en alerta a la vez (SLA, ratio de demora, peso y tendencia empeorando) — prioridad máxima para gestión de contrato.',
    trend: buildTrend([8.0, 9.2, 10.5, 11.8, 12.9]),
  },
  {
    id: 'empresa-2',
    name: 'Empresa 2',
    status: 'alert',
    metrics: [
      { value: '11,4 días', label: 'Promedio de cierre', hint: '(SLA: 3 días)' },
      { value: '95 de 150', label: 'Folios sobre SLA (63%)' },
      {
        value: '844 kg',
        label: 'Dif. de peso promedio',
        hint: '(33% · levemente sobre tolerancia ~30%)',
      },
      { value: '6', label: 'Folios cerrados (may 2026)', neutral: true },
    ],
    note: '2 de 4 señales en alerta (SLA y ratio de demora); el peso está solo levemente sobre tolerancia y la tendencia no empeora — requiere seguimiento, pero no es tan grave como un caso Crítico.',
    trend: buildTrend([5.0, 8.6, 3.8, 4.0, 5.3]),
  },
  {
    id: 'empresa-3',
    name: 'Empresa 3',
    status: 'normal',
    metrics: [
      { value: '3,3 días', label: 'Promedio de cierre', hint: '(SLA: 3 días)' },
      { value: '4 de 50', label: 'Folios sobre SLA (8%)' },
      {
        value: '95 kg',
        label: 'Dif. de peso promedio',
        hint: '(9% · dentro de tolerancia ~10%)',
      },
      { value: '5', label: 'Folios cerrados (may 2026)', neutral: true },
    ],
    note: 'Sin señales de alerta — SLA, peso y tendencia dentro de lo esperado.',
    trend: buildTrend([3.1, 3.2, 2.9, 3.4, 3.3]),
  },
  {
    id: 'empresa-4',
    name: 'Empresa 4',
    status: 'insufficient',
    metrics: [
      { value: null, label: 'Promedio de cierre', hint: '(SLA: 3 días)' },
      // Sin paréntesis: sin folios cerrados no hay porcentaje que mostrar.
      { value: null, label: 'Folios sobre SLA' },
      { value: null, label: 'Dif. de peso promedio', hint: '(sin residuo predominante aún)' },
      { value: '2', label: 'Folios cerrados (may 2026)', neutral: true },
    ],
    note: 'Aún no hay suficientes folios cerrados para calcular un promedio confiable. Esta ficha se irá completando automáticamente.',
  },
];
