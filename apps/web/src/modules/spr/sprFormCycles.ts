/**
 * Ciclos del selector en Mi formulario (Responsable de Área) — Figma 2404:2037 / 2424:1066.
 *
 * Reglas de negocio (MOCK / UX Alexis):
 * - Las áreas emiten hasta el día 9; si no, el consolidado usa estimados (promedio 6 meses).
 * - Los estimados no son ideales: el área debe reemplazarlos con datos reales.
 * - Si hay estimados en ciclos anteriores, el selector muestra un punto rojo.
 * - En el desplegable, esos ciclos se marcan como "Abierto con estimados".
 * - Al abrir un ciclo con estimados (Figma 2424:1066) se muestra el detalle editable
 *   y el proceso real se reinicia paso a paso:
 *   1. Envío de formulario por responsable de área
 *   2. Firma de gerente de área (no limitante para consolidado)
 *   3. AurelIA actualiza consolidado, sube a SAP y genera reporte SAC
 *   4. AurelIA actualiza el reporte SPR
 *   5. Debe ser firmado
 *   6. Revisión área SOX (solo si aplica)
 *   7. El ciclo cierra si no hay discrepancias
 *
 * Demo: ciclo actual Mayo 2026; Abril queda abierto con estimados.
 */

export const SPR_FORM_CYCLE_QUERY = 'ciclo';

export type SprFormCycleId = 'mayo-2026' | 'abril-2026' | 'marzo-2026' | 'febrero-2026';

export type SprFormCyclePickerBadge =
  | { kind: 'open-estimates'; label: 'Abierto con estimados' }
  | { kind: 'closed'; label: 'Ciclo cerrado' };

export type SprFormCycle = {
  id: SprFormCycleId;
  label: string;
  periodYear: number;
  periodMonth: number;
  isActual: boolean;
  rangeLabel: string;
  /** MOCK: fecha límite del ciclo (pasada en ciclos con estimados). */
  deadlineLabel: string;
  deadlineHelper: string;
  pickerBadge?: SprFormCyclePickerBadge;
};

/** Copy del modo estimados — detalle de ciclo (Figma 2424:1066). */
export const SPR_FORM_ESTIMATES_MODE = {
  triggerBadgeLabel: 'Activo con estimados',
  bannerTitle: 'Esta área cuenta con datos estimados',
  /** Figma dice "En necesario…"; copy corregido a español. */
  bannerBody: 'Es necesario que actualices el formulario con datos reales.',
  listBadgeLabel: 'Estimado',
  detailBadgeLabel: 'Estimado - Ingresa datos reales',
  progressEstimatesLabel: 'Estimados',
  deadlinePassedHelper: 'Fecha cumplida',
  /** Valores MOCK de promedio 6 meses para demo visual (sin backend de estimados). */
  mockNumericByIndex: ['58.432', '12.450', '3.210', '890', '1.025'] as const,
} as const;

/** Ciclos demo del selector del responsable (Figma 2404:2037). */
export const SPR_FORM_CYCLES: SprFormCycle[] = [
  {
    id: 'mayo-2026',
    label: 'Mayo 2026',
    periodYear: 2026,
    periodMonth: 5,
    isActual: true,
    rangeLabel: '01 mayo — 31 mayo',
    deadlineLabel: '10-06-2026',
    deadlineHelper: '5 días restantes',
  },
  {
    id: 'abril-2026',
    label: 'Abril 2026',
    periodYear: 2026,
    periodMonth: 4,
    isActual: false,
    rangeLabel: '01 abril — 30 abril',
    // Figma 2424:1066 muestra 10-06-2026 / Fecha cumplida en el detalle de estimados.
    deadlineLabel: '10-06-2026',
    deadlineHelper: SPR_FORM_ESTIMATES_MODE.deadlinePassedHelper,
    pickerBadge: { kind: 'open-estimates', label: 'Abierto con estimados' },
  },
  {
    id: 'marzo-2026',
    label: 'Marzo 2026',
    periodYear: 2026,
    periodMonth: 3,
    isActual: false,
    rangeLabel: '01 marzo — 31 marzo',
    deadlineLabel: '10-04-2026',
    deadlineHelper: 'Ciclo cerrado',
    pickerBadge: { kind: 'closed', label: 'Ciclo cerrado' },
  },
  {
    id: 'febrero-2026',
    label: 'Febrero 2026',
    periodYear: 2026,
    periodMonth: 2,
    isActual: false,
    rangeLabel: '01 febrero — 28 febrero',
    deadlineLabel: '10-03-2026',
    deadlineHelper: 'Ciclo cerrado',
    pickerBadge: { kind: 'closed', label: 'Ciclo cerrado' },
  },
];

const SPR_FORM_CYCLE_BY_ID = Object.fromEntries(
  SPR_FORM_CYCLES.map((cycle) => [cycle.id, cycle]),
) as Record<SprFormCycleId, SprFormCycle>;

export function resolveSprFormCycle(raw: string | null): SprFormCycle {
  if (raw && raw in SPR_FORM_CYCLE_BY_ID) {
    return SPR_FORM_CYCLE_BY_ID[raw as SprFormCycleId];
  }
  return SPR_FORM_CYCLE_BY_ID['mayo-2026'];
}

export function sprFormCycleTriggerLabel(cycle: SprFormCycle) {
  return cycle.isActual ? `${cycle.label} (Actual)` : cycle.label;
}

/** Punto rojo en el selector: hay al menos un ciclo anterior abierto con estimados. */
export function sprFormHasPriorEstimatesAlert(cycles: SprFormCycle[] = SPR_FORM_CYCLES) {
  return cycles.some((cycle) => cycle.pickerBadge?.kind === 'open-estimates');
}

export function isSprFormCycleEstimatesMode(cycle: SprFormCycle) {
  return cycle.pickerBadge?.kind === 'open-estimates';
}

export function getSprFormMockEstimateValue(index: number) {
  const values = SPR_FORM_ESTIMATES_MODE.mockNumericByIndex;
  return values[index % values.length] ?? values[0];
}
