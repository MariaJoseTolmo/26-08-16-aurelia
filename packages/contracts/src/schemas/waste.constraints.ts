/**
 * Reglas del módulo de residuos que web y api DEBEN evaluar igual.
 *
 * El acumulado mensual vs. umbral RCA se pinta en la vista "Control de bodega" y
 * se vuelve a pintar en el PDF que genera la API. Cuando cada lado tenía su
 * propia copia de la condición, un cambio de umbral en uno dejaba al otro
 * mostrando colores distintos para el mismo dato.
 *
 * Es la primera función que exporta este paquete. Un objeto de constantes no
 * alcanzaba: con solo los números, cada consumidor sigue escribiendo su cadena
 * de `if` y basta que uno use `>=` en vez de `>` para que los bordes difieran.
 */

/** Tono del acumulado mensual respecto del umbral RCA. */
export type WasteAccumulationTone = 'safe' | 'warning' | 'critical';

export const WasteAccumulationConstraints = {
  /**
   * Margen que puede quedar hasta el umbral antes de que la barra sea crítica,
   * en puntos porcentuales.
   *
   * Expresado como margen restante y no como "80%" porque así está enunciada la
   * regla: la barra es roja cuando le queda un 20% o menos para llegar al final.
   */
  criticalRemainingMarginPercentage: 20,
} as const;

/**
 * Tono del acumulado mensual, comparado contra la BARRA DE DÍA DEL MES (nodo
 * Figma `3686:25776`), que marca el porcentaje del mes transcurrido.
 *
 * La regla no mira umbrales fijos: mira el RITMO. Una barra que consume su
 * umbral más rápido de lo que avanza el mes va adelantada.
 *
 *   1. Llega hasta la barra de día del mes, o no alcanza a llegar  →  verde
 *   2. La sobrepasa                                               →  ámbar
 *   3. Le queda 20% o menos para el final                          →  rojo
 *
 * La regla 3 PISA a las otras dos: está enunciada sin condición, y acercarse al
 * umbral RCA es un riesgo absoluto, no de ritmo. Consecuencia deliberada: a fin
 * de mes una barra al día pero muy avanzada igual sale roja, porque le queda
 * poco margen real.
 *
 * `NaN` en cualquiera de los dos argumentos cae en `safe` —no se pinta un color
 * con un valor inválido—. `Infinity` en `percentage` NO se degrada: entra por la
 * regla 3, que es el lado correcto del error.
 */
export function resolveWasteAccumulationTone(
  percentage: number,
  monthElapsedPercentage: number,
): WasteAccumulationTone {
  if (Number.isNaN(percentage)) return 'safe';
  if (100 - percentage <= WasteAccumulationConstraints.criticalRemainingMarginPercentage) return 'critical';
  // Con `monthElapsedPercentage` en NaN esta comparación es false y cae en
  // `safe`, que es el comportamiento buscado.
  if (percentage > monthElapsedPercentage) return 'warning';
  return 'safe';
}

/** Desvío de una barra respecto de la barra de día del mes. */
export interface WasteAccumulationDeviation {
  tone: WasteAccumulationTone;
  /**
   * Distancia hasta la barra de día del mes, en puntos porcentuales, redondeada.
   * Positiva si la barra va adelantada, negativa si va atrasada.
   */
  deltaPercentagePoints: number;
}

/**
 * Tono y desvío de una barra en una sola pasada.
 *
 * Los dos salen de la MISMA comparación, así que la etiqueta de desvío no puede
 * contradecir al color: era lo que pasaba cuando la etiqueta era texto fijo y el
 * color se calculaba.
 *
 * No devuelve el texto de la etiqueta a propósito. Este paquete no lleva copy de
 * interfaz —solo tipos, contratos y reglas—, así que la palabra ("Normal",
 * "Adelantado", "Crítico") la pone quien renderiza.
 *
 * `|| 0` normaliza dos casos que no deben llegar a la vista: `-0`, que se
 * imprimiría como "-0pp", y `NaN` por argumentos inválidos.
 */
export function resolveWasteAccumulationDeviation(
  percentage: number,
  monthElapsedPercentage: number,
): WasteAccumulationDeviation {
  return {
    tone: resolveWasteAccumulationTone(percentage, monthElapsedPercentage),
    deltaPercentagePoints: Math.round(percentage - monthElapsedPercentage) || 0,
  };
}
