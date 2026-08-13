import type { WasteDashboardKpisResponse } from '../../shared/services/waste-dashboard.service';
import type { WasteKpi } from './components/WasteKpiCard';

/**
 * Composición de los cuatro KPIs de la fila superior del Dashboard Residuos
 * (nodo `3086:13811`) a partir de los números crudos del servidor.
 *
 * Vive fuera del componente para poder probarse sin montar React: es donde se
 * deciden las frases y los colores, que es lo que se puede equivocar.
 *
 * PALETA — el nodo usa exactamente dos colores de nota, y no un tercero:
 *
 *   #006153  favorable        "3 vs. junio" (↑), "+4pp"
 *   #e8720c  requiere atención "2 sobre SLA", "requieren acción"
 *
 * Las cuatro tarjetas del diseño están dibujadas en su caso favorable o de aviso,
 * nunca en el opuesto. Los casos que el nodo NO dibuja —menos retiros que el mes
 * anterior, variación negativa de SIDREP, cero folios sobre SLA, cero alertas— se
 * resuelven con ESOS MISMOS dos colores según el criterio de arriba, sin inventar
 * un color nuevo. Están marcados uno por uno más abajo para que el diseño los
 * confirme o los corrija.
 */

const FAVORABLE_TONE = '#006153';
const ATTENTION_TONE = '#e8720c';

/** Nombres de mes en minúscula, como los escribe el nodo `3086:13820`: "3 vs. junio". */
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/**
 * Nombre del mes anterior a `reference`.
 *
 * Mapa explícito y no `Intl.DateTimeFormat('es', { month: 'long' })` por el mismo
 * motivo que las abreviaturas del gráfico: el resultado de `Intl` depende de los
 * datos de locale del motor, y el rótulo lo fija el diseño.
 */
export function previousMonthName(reference: Date): string {
  // `setMonth` con 0 rebobina al mes anterior, incluido el salto de año.
  const previous = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return MONTH_NAMES[previous.getMonth()] ?? '';
}

export function buildWasteDashboardKpis(
  kpis: WasteDashboardKpisResponse,
  today: Date,
): WasteKpi[] {
  const withdrawalsDelta = kpis.hazardousWithdrawalsThisMonth - kpis.hazardousWithdrawalsPreviousMonth;

  return [
    {
      label: 'Retiros peligrosos (mes)',
      value: `${kpis.hazardousWithdrawalsThisMonth}`,
      /*
       * La nota va SIN signo: la dirección la carga la flecha, igual que el nodo
       * `3086:13820` ("3 vs. junio" con ↑). Con delta 0 no hay flecha ni número
       * que comparar, así que la frase lo dice — estado no dibujado por el diseño.
       */
      note:
        withdrawalsDelta === 0
          ? `sin cambio vs. ${previousMonthName(today)}`
          : `${Math.abs(withdrawalsDelta)} vs. ${previousMonthName(today)}`,
      trend: withdrawalsDelta === 0 ? undefined : withdrawalsDelta > 0 ? 'up' : 'down',
      /*
       * Más retiros que el mes anterior es favorable: es residuo que salió de la
       * bodega y dejó de consumir plazo de almacenaje. Menos retiros va en naranja
       * —estado no dibujado— porque significa acumulación.
       */
      noteTone: withdrawalsDelta < 0 ? ATTENTION_TONE : FAVORABLE_TONE,
    },
    {
      label: '% SIDREP cerrados a tiempo',
      value: `${kpis.sidrepClosedOnTimePercentage}%`,
      /* El nodo `3086:13827` escribe "+4pp": el signo va explícito en esta tarjeta. */
      note: `${kpis.sidrepClosedOnTimeDeltaPoints >= 0 ? '+' : '−'}${Math.abs(kpis.sidrepClosedOnTimeDeltaPoints)}pp`,
      // Caída de cumplimiento en naranja — estado no dibujado por el diseño.
      noteTone: kpis.sidrepClosedOnTimeDeltaPoints < 0 ? ATTENTION_TONE : FAVORABLE_TONE,
    },
    {
      label: 'Folios abiertos',
      value: `${kpis.openFolios}`,
      note: `${kpis.openFoliosOverSla} sobre SLA`,
      // Cero sobre SLA es la única lectura favorable — estado no dibujado.
      noteTone: kpis.openFoliosOverSla > 0 ? ATTENTION_TONE : FAVORABLE_TONE,
    },
    {
      label: 'Alertas activas',
      value: `${kpis.activeAlerts}`,
      /*
       * "requieren acción" es copy fija del nodo `3086:13841`, no un dato. Con cero
       * alertas la frase se invierte, porque "0 requieren acción" se lee como aviso
       * cuando en realidad es la buena noticia — estado no dibujado.
       */
      note: kpis.activeAlerts > 0 ? 'requieren acción' : 'sin pendientes',
      noteTone: kpis.activeAlerts > 0 ? ATTENTION_TONE : FAVORABLE_TONE,
    },
  ];
}
