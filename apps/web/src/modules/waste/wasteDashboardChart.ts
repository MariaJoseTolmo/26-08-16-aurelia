import type { WasteNonHazardousWithdrawalMonth } from '../../shared/services/waste-dashboard.service';

/**
 * Lógica pura de la tarjeta "Retiros no peligrosos (informativo)" (nodo Figma
 * `3086:13931`): rótulo del mes, altura relativa de cada barra y cuál va
 * destacada.
 *
 * Vive fuera del componente para poder probarse sin montar React y para que la
 * decisión de escala quede en UN solo lugar.
 */

/**
 * Abreviaturas de mes del diseño: "Mar", "Abr", "May", "Jun", "Jul" — tres
 * letras, inicial en mayúscula, sin punto.
 *
 * Van en un mapa explícito en vez de `Intl.DateTimeFormat('es', ...)` a
 * propósito: ese formateador devuelve "mar" en minúscula y, según el motor y los
 * datos de locale disponibles, con punto final ("sept."). El diseño fija el
 * rótulo, así que el rótulo no puede depender de qué ICU trae el navegador.
 */
const MONTH_SHORT_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

/**
 * Rótulo del eje horizontal para un mes en `YYYY-MM`.
 *
 * Ante un valor que no calce con el formato devuelve el string tal cual en vez de
 * lanzar: un mes mal formado tiene que ensuciar UNA columna, no tumbar la
 * tarjeta completa.
 */
export function formatWasteMonthShortLabel(month: string): string {
  const match = /^\d{4}-(\d{2})$/.exec(month);
  if (!match?.[1]) return month;

  return MONTH_SHORT_LABELS[Number(match[1]) - 1] ?? month;
}

/** Mes corriente en `YYYY-MM`, el formato en que viaja la serie. */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export interface WasteWithdrawalBar {
  /** Mes en `YYYY-MM`. Es la clave de render y la que decide el destaque. */
  month: string;
  label: string;
  withdrawals: number;
  /** Alto de la barra como porcentaje del área disponible, entre 0 y 100. */
  heightPercentage: number;
  /** Mes corriente: es la única barra en azul del diseño (nodo `3086:13952`). */
  highlighted: boolean;
}

/**
 * Convierte la serie del servidor en las barras que dibuja la tarjeta.
 *
 * ESCALA — desvío deliberado respecto del design context
 *
 * Los alturas del nodo son 67.195 / 81.594 / 72 / 84.5 / 84.5 px para 14 / 17 /
 * 15 / 19 / 22 retiros. Las tres primeras responden a una escala fija de ≈4.7996
 * px por retiro; las dos últimas la rompen: 19 y 22 miden LO MISMO porque el
 * maquetado tocó el techo de 84.5px y quedó recortado ahí. Reproducir eso
 * significaría dibujar dos meses distintos con la misma barra, que es
 * exactamente lo que una comparación mensual no puede hacer.
 *
 * Acá la escala es relativa al MÁXIMO de la serie: la barra más alta ocupa el
 * 100% del área y el resto se mide contra ella. Con los datos del diseño, Jul
 * (22) queda en 84.5px —idéntico al nodo— y los otros cuatro bajan proporcional
 * a su valor real. El techo del área lo pone el layout, así que la tarjeta
 * conserva su alto exacto.
 *
 * El máximo por serie —y no un techo fijo— también es lo único que aguanta datos
 * reales: el consolidado de un mes puede traer 3 retiros o 300, y una escala
 * cableada dejaría la tarjeta vacía o saturada.
 */
export function buildWasteWithdrawalBars(
  months: WasteNonHazardousWithdrawalMonth[],
  currentMonth: string,
): WasteWithdrawalBar[] {
  const maxWithdrawals = months.reduce((max, item) => Math.max(max, item.withdrawals), 0);

  /*
   * Sin la última barra en azul el destaque cae al mes corriente por clave. El
   * respaldo es el ÚLTIMO mes de la serie —no "ninguno"— porque la serie llega
   * ordenada y su cola es el mes en curso: si el servidor devuelve una ventana
   * que termina antes de hoy, la tarjeta sigue marcando el mes más reciente en
   * vez de quedarse sin referencia visual.
   */
  const highlightedMonth = months.some((item) => item.month === currentMonth)
    ? currentMonth
    : months[months.length - 1]?.month;

  return months.map((item) => ({
    month: item.month,
    label: formatWasteMonthShortLabel(item.month),
    withdrawals: item.withdrawals,
    /*
     * `maxWithdrawals === 0` es una serie de meses en cero: todas las barras van
     * a 0% en vez de dividir por cero. La tarjeta sigue mostrando los rótulos,
     * que es el dato: hubo meses, no hubo retiros.
     */
    heightPercentage: maxWithdrawals === 0 ? 0 : (item.withdrawals / maxWithdrawals) * 100,
    highlighted: item.month === highlightedMonth,
  }));
}
