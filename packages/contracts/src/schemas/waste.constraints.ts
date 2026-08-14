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

/**
 * Plazo de declaración del Reporte SINADER en la Ventanilla Única del RETC.
 *
 * El consolidado de un mes se declara entre el 1° y el 7 del mes SIGUIENTE. Ese
 * plazo lo evalúan tres lugares y tienen que coincidir en el borde:
 *
 *   - la API decide qué correo sale cada día (`available` del 1 al 7, `overdue`
 *     del 8 en adelante);
 *   - la web decide si el botón "Marcar como declarado" ya está habilitado;
 *   - la web decide si muestra el recuadro rojo de "SLA vencido".
 *
 * Vive acá por el mismo motivo que `resolveWasteAccumulationTone`, y no como una
 * constante suelta: con sólo el número, cada consumidor escribe su propia
 * comparación y basta que uno use `>=` donde otro usa `>` para que el día 7
 * reciba a la vez el correo de "último día" y el cartel de plazo vencido.
 */
export const WasteSinaderConstraints = {
  /** Primer día de la ventana: el 1°, apenas cierra el mes que se declara. */
  declarationFirstDay: 1,
  /** Último día de la ventana, y plazo que anuncia el correo. */
  declarationDeadlineDay: 7,
} as const;

/** Mes calendario de un período SINADER. `periodMonth` es 1–12, no índice base 0. */
export interface WasteSinaderPeriodMonth {
  periodYear: number;
  periodMonth: number;
}

/**
 * Índice absoluto de mes, para comparar dos períodos con una resta y sin construir
 * fechas intermedias.
 */
function wasteMonthIndex(year: number, monthNumber: number): number {
  return year * 12 + (monthNumber - 1);
}

/**
 * ¿El mes del período ya terminó?
 *
 * Queda cerrado el día 1° del mes siguiente a las 00:00 LOCALES. Se usa
 * `getFullYear`/`getMonth` y no `toISOString()` porque en Chile el UTC adelanta el
 * día y el 31 a la noche caería en el mes siguiente, dando por cerrado un período
 * que todavía admite movimientos.
 */
export function hasWasteSinaderPeriodEnded(period: WasteSinaderPeriodMonth, today: Date): boolean {
  return (
    wasteMonthIndex(today.getFullYear(), today.getMonth() + 1) >
    wasteMonthIndex(period.periodYear, period.periodMonth)
  );
}

/**
 * ¿El día del mes cae dentro de la ventana de declaración?
 *
 * Sólo mira el calendario. Si el período YA fue declarado no corresponde ningún
 * recordatorio, pero eso lo sabe la base y no una función de fechas; quien
 * programa los envíos encadena las dos condiciones.
 */
export function isWithinWasteSinaderDeclarationWindow(dayOfMonth: number): boolean {
  return (
    Number.isInteger(dayOfMonth) &&
    dayOfMonth >= WasteSinaderConstraints.declarationFirstDay &&
    dayOfMonth <= WasteSinaderConstraints.declarationDeadlineDay
  );
}

/**
 * ¿Venció el plazo para declarar este período?
 *
 * Verdadero cuando el mes ya terminó Y se pasó el día límite del mes siguiente. Si
 * transcurrió más de un mes, el plazo venció con el mes y el día ya no importa.
 *
 * NO consulta el estado del período: un consolidado ya declarado no está atrasado,
 * pero eso es un hecho de la base y lo evalúa quien llama.
 */
export function isWasteSinaderDeclarationOverdue(
  period: WasteSinaderPeriodMonth,
  today: Date,
): boolean {
  if (!hasWasteSinaderPeriodEnded(period, today)) return false;

  const periodEndedAt = wasteMonthIndex(period.periodYear, period.periodMonth);
  const currentMonth = wasteMonthIndex(today.getFullYear(), today.getMonth() + 1);

  if (currentMonth > periodEndedAt + 1) return true;
  return today.getDate() > WasteSinaderConstraints.declarationDeadlineDay;
}

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
