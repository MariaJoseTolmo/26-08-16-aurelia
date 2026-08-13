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
  /**
   * Tolerancia alrededor del ritmo esperado, en puntos porcentuales, dentro de la
   * cual la barra sigue siendo normal.
   *
   * La enuncia la leyenda del diseño (nodo `3785:46381`): "Normal (±10pp del
   * ritmo esperado)". Antes no existía y CUALQUIER exceso sobre el ritmo pasaba a
   * ámbar, lo que pintaba de "Adelantado" una barra a +1pp.
   */
  paceTolerancePercentagePoints: 10,
  /**
   * Desvío sobre el ritmo esperado, en puntos porcentuales, a partir del cual la
   * barra es crítica sin importar cuánto margen le quede al umbral.
   *
   * También de la leyenda: "Crítico (+25pp o más)".
   */
  criticalPaceDeviationPercentagePoints: 25,
} as const;

/**
 * Tono del acumulado mensual, comparado contra la BARRA DE DÍA DEL MES (nodo
 * Figma `3686:25776`), que marca el porcentaje del mes transcurrido.
 *
 * La regla mira el RITMO —una barra que consume su umbral más rápido de lo que
 * avanza el mes va adelantada— con una excepción absoluta por cercanía al umbral.
 *
 *   1. Va +25pp o más sobre el ritmo esperado          →  rojo
 *   2. Le queda 20% o menos para el final              →  rojo
 *   3. Va más de +10pp sobre el ritmo esperado         →  ámbar
 *   4. El resto, incluidos los ±10pp de tolerancia     →  verde
 *
 * La regla 2 no depende del ritmo: acercarse al umbral RCA es un riesgo absoluto.
 * Consecuencia deliberada: a fin de mes una barra al día pero muy avanzada igual
 * sale roja, porque le queda poco margen real.
 *
 * LAS BANDAS SALEN DE LA LEYENDA DEL DISEÑO (nodo `3785:46381`), que las enuncia
 * textualmente: "Normal (±10pp del ritmo esperado)", "Adelantado (+10 a +25pp)",
 * "Crítico (+25pp o más)".
 *
 * Antes de esa leyenda la regla mandaba a ámbar CUALQUIER exceso sobre el ritmo
 * (`percentage > monthElapsedPercentage`), y por eso la tercera barra del nodo
 * `3086:13843` —57% con el mes al 52%, o sea +5pp— se pintaba "Adelantado" cuando
 * el diseño la muestra "Normal". Con la tolerancia de ±10pp las tres barras de ese
 * nodo coinciden. El cambio afecta también a "Control de bodega" y al PDF que
 * genera la API, que es justamente el motivo por el que la condición vive acá.
 *
 * `NaN` en cualquiera de los dos argumentos cae en `safe` —no se pinta un color
 * con un valor inválido—. `Infinity` en `percentage` NO se degrada: entra por la
 * regla 1, que es el lado correcto del error.
 */
export function resolveWasteAccumulationTone(
  percentage: number,
  monthElapsedPercentage: number,
): WasteAccumulationTone {
  if (Number.isNaN(percentage)) return 'safe';

  const paceDeviation = roundPaceDeviation(percentage, monthElapsedPercentage);

  if (paceDeviation >= WasteAccumulationConstraints.criticalPaceDeviationPercentagePoints) return 'critical';
  if (100 - percentage <= WasteAccumulationConstraints.criticalRemainingMarginPercentage) return 'critical';
  if (paceDeviation > WasteAccumulationConstraints.paceTolerancePercentagePoints) return 'warning';
  return 'safe';
}

/**
 * Desvío respecto del ritmo esperado, en puntos porcentuales REDONDEADOS.
 *
 * El redondeo tiene que pasar ANTES de comparar contra las bandas, no después.
 * Las bandas se comparan contra el mismo número que se imprime, así que la
 * etiqueta y el color no pueden discrepar en los bordes: con el desvío crudo, una
 * barra a +9.6pp caía en `safe` y a la vez se rotulaba "+10pp", que según la
 * leyenda ya es Adelantado.
 *
 * `|| 0` normaliza dos casos que no deben llegar a la vista: `-0`, que se
 * imprimiría como "-0pp", y `NaN` por argumentos inválidos. Con `NaN` el desvío
 * queda en 0 y el tono cae en `safe` por ritmo —sin acusar un adelanto que no se
 * puede calcular—, salvo que la regla del margen restante, que no mira el ritmo,
 * diga otra cosa.
 */
function roundPaceDeviation(percentage: number, monthElapsedPercentage: number): number {
  return Math.round(percentage - monthElapsedPercentage) || 0;
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
 * El desvío sale de `roundPaceDeviation`, la MISMA función con la que
 * `resolveWasteAccumulationTone` compara las bandas. Es lo que garantiza que el
 * número impreso y el color caigan siempre del mismo lado del umbral.
 */
export function resolveWasteAccumulationDeviation(
  percentage: number,
  monthElapsedPercentage: number,
): WasteAccumulationDeviation {
  return {
    tone: resolveWasteAccumulationTone(percentage, monthElapsedPercentage),
    deltaPercentagePoints: roundPaceDeviation(percentage, monthElapsedPercentage),
  };
}
