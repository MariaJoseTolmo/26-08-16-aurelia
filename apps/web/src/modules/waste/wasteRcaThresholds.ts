import type {
  WasteRcaCategoryBreakdownItem,
  WasteRcaThresholdCategory,
} from '../../shared/services/waste-dashboard.service';
import type { WarehouseAccumulationBar } from './components/WarehouseMonthlyAccumulated';

/**
 * Convierte el acumulado por categoría en las barras de "Acumulado mensual vs.
 * umbral RCA" (nodo `3086:13843`).
 *
 * El TONO no se decide acá: lo resuelve `WarehouseMonthlyAccumulated` comparando
 * el porcentaje contra el avance del mes, con la regla de
 * `resolveWasteAccumulationTone` que comparte con el PDF de la API. Esta función
 * solo produce el porcentaje y la etiqueta.
 */

/**
 * Toneladas como las escribe el nodo: "98", "140", "34", "60" — enteros sin
 * separador de miles.
 *
 * Los valores llegan como string porque son `numeric` de Postgres. Se formatea a
 * mano y no con `toLocaleString`: el resultado de `Intl` depende de los datos de
 * locale del motor, y acá alcanza con no arrastrar decimales que el diseño no
 * muestra. Con decimal, la coma es la separación decimal en es-CL.
 */
export function formatTons(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  if (Number.isInteger(parsed)) return String(parsed);

  return parsed.toFixed(1).replace('.', ',');
}

/**
 * Kilogramos como los escribe el nodo `4304:31144`: entero, con punto de miles
 * (es-CL) y la unidad en "Kg" con K mayúscula, tal cual el diseño.
 *
 * A mano y no con `toLocaleString`, por el mismo motivo que `formatTons`: el
 * resultado de `Intl` depende de los datos de locale del motor.
 */
export function formatKilograms(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;

  return Math.round(parsed)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Una barra del desglose por residuo de la fila expandida (nodo `4304:31141`). */
export interface WasteRcaBreakdownBar {
  wasteName: string;
  /** Lectura completa a la derecha, p. ej. "44.100 Kg (45%)". */
  valueLabel: string;
  /** Participación en el acumulado de la categoría, 0-100. Es el ancho de la barra. */
  sharePercentage: number;
}

/**
 * Fila del modal de detalle: la misma barra de la tarjeta más su desglose.
 *
 * Extiende `WarehouseAccumulationBar` para que UNA sola construcción sirva a los
 * dos lugares —la tarjeta lo ignora, el modal lo usa— y no haya dos funciones que
 * puedan calcular el porcentaje del acumulado de forma distinta.
 */
export interface WasteRcaDetailRow extends WarehouseAccumulationBar {
  breakdown: WasteRcaBreakdownBar[];
}

/**
 * Desglose de una categoría en barras.
 *
 * El porcentaje se calcula contra la SUMA del desglose y no contra el acumulado de
 * la categoría, que viene en toneladas: cruzar unidades para dividir es una
 * conversión de más que puede equivocarse, y con el desglose completo —que es lo
 * que pide el contrato— los dos totales son el mismo número.
 */
function buildBreakdownBars(items: WasteRcaCategoryBreakdownItem[]): WasteRcaBreakdownBar[] {
  const total = items.reduce((sum, item) => {
    const kilograms = Number(item.kilograms);
    return sum + (Number.isFinite(kilograms) ? kilograms : 0);
  }, 0);

  return items.map((item) => {
    const kilograms = Number(item.kilograms);
    /*
     * Total en cero —categoría sin movimientos este mes— deja las barras vacías en
     * vez de dividir por cero. Los rótulos siguen visibles: hubo residuos
     * declarados, no hubo kilos.
     */
    const share = total > 0 && Number.isFinite(kilograms) ? Math.round((kilograms / total) * 100) : 0;

    return {
      wasteName: item.wasteName,
      valueLabel: `${formatKilograms(item.kilograms)} Kg (${share}%)`,
      sharePercentage: share,
    };
  });
}

export function buildWasteRcaAccumulationBars(
  categories: WasteRcaThresholdCategory[],
): WasteRcaDetailRow[] {
  return categories.map((item) => {
    const accumulated = Number(item.accumulatedTons);
    const threshold = Number(item.thresholdTons);

    /*
     * Umbral ausente, cero o no numérico → 0%. Es el único caso en que no hay
     * porcentaje que calcular, y devolver 0 deja la barra vacía con su etiqueta
     * visible; dividir daría `Infinity` o `NaN` y el `clampPercentage` de la
     * tarjeta lo taparía como 0 sin que nadie se enterara del dato roto.
     */
    const hasThreshold = Number.isFinite(threshold) && threshold > 0;
    const rawPercentage = hasThreshold && Number.isFinite(accumulated)
      ? (accumulated / threshold) * 100
      : 0;
    /*
     * Se redondea al entero, que es lo que muestra el nodo: 112/130 = 86.15 →
     * "86%", 34/60 = 56.67 → "57%". El MISMO entero alimenta la etiqueta y el
     * ancho de la barra, para que no puedan discrepar.
     */
    const percentage = Math.round(rawPercentage);

    return {
      label: item.category,
      percentage,
      valueLabel: `${formatTons(item.accumulatedTons)} / ${formatTons(item.thresholdTons)} ton (${percentage}%)`,
      breakdown: buildBreakdownBars(item.breakdown ?? []),
    };
  });
}
