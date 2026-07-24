import { resolveSprReportFlow, SPR_REPORT_FLOW_QUERY, type SprReportFlowId } from './spr.constants';

/** Query param del selector de ciclo en Reporte SPR (Figma 2109:49524). */
export const SPR_REPORT_CYCLE_QUERY = 'ciclo';

export type SprReportCycleId = 'junio-2026' | 'mayo-2026' | 'abril-2026' | 'marzo-2026';

export type SprReportCyclePickerBadge =
  | { kind: 'estimates'; label: 'Activo con estimados' }
  | { kind: 'closed'; label: 'Ciclo cerrado' };

export type SprReportCycle = {
  id: SprReportCycleId;
  label: string;
  periodYear: number;
  periodMonth: number;
  isActual: boolean;
  pickerBadge?: SprReportCyclePickerBadge;
  defaultFlow: SprReportFlowId;
};

/** Ciclos demo del selector (Figma 2109:49524). */
export const SPR_REPORT_CYCLES: SprReportCycle[] = [
  {
    id: 'junio-2026',
    label: 'Junio 2026',
    periodYear: 2026,
    periodMonth: 6,
    isActual: true,
    defaultFlow: 'ciclo-cerrado',
  },
  {
    id: 'mayo-2026',
    label: 'Mayo 2026',
    periodYear: 2026,
    periodMonth: 5,
    isActual: false,
    pickerBadge: { kind: 'estimates', label: 'Activo con estimados' },
    /** Figma 2109:49560 — dashboard activo con estimados, ciclo no cerrable. */
    defaultFlow: 'validacion-aprobada',
  },
  {
    id: 'abril-2026',
    label: 'Abril 2026',
    periodYear: 2026,
    periodMonth: 4,
    isActual: false,
    pickerBadge: { kind: 'closed', label: 'Ciclo cerrado' },
    defaultFlow: 'ciclo-cerrado',
  },
  {
    id: 'marzo-2026',
    label: 'Marzo 2026',
    periodYear: 2026,
    periodMonth: 3,
    isActual: false,
    pickerBadge: { kind: 'closed', label: 'Ciclo cerrado' },
    defaultFlow: 'ciclo-cerrado',
  },
];

const SPR_REPORT_CYCLE_BY_ID = Object.fromEntries(
  SPR_REPORT_CYCLES.map((cycle) => [cycle.id, cycle]),
) as Record<SprReportCycleId, SprReportCycle>;

export function resolveSprReportCycle(raw: string | null): SprReportCycle {
  if (raw && raw in SPR_REPORT_CYCLE_BY_ID) {
    return SPR_REPORT_CYCLE_BY_ID[raw as SprReportCycleId];
  }
  // Sin ciclo explícito: compat demo Mayo vía ?estado= sin ?ciclo=
  if (raw === null) {
    return SPR_REPORT_CYCLE_BY_ID['junio-2026'];
  }
  return SPR_REPORT_CYCLE_BY_ID['junio-2026'];
}

export function inferSprReportCycleFromLegacyState(estado: string | null): SprReportCycle {
  if (estado === 'validacion-aprobada') return SPR_REPORT_CYCLE_BY_ID['mayo-2026'];
  if (estado === 'ciclo-cerrado') return SPR_REPORT_CYCLE_BY_ID['junio-2026'];
  return SPR_REPORT_CYCLE_BY_ID['junio-2026'];
}

export function resolveSprReportCycleContext(
  cicloRaw: string | null,
  estadoRaw: string | null,
): { cycle: SprReportCycle; flow: SprReportFlowId } {
  const cycle = cicloRaw ? resolveSprReportCycle(cicloRaw) : inferSprReportCycleFromLegacyState(estadoRaw);
  const flow = estadoRaw ? resolveSprReportFlow(estadoRaw) : cycle.defaultFlow;
  return { cycle, flow };
}

export function sprReportCycleTriggerLabel(cycle: SprReportCycle) {
  return cycle.isActual ? `${cycle.label} (Actual)` : cycle.label;
}

export function sprReportCycleSearchParams(cycle: SprReportCycle, flow?: SprReportFlowId) {
  const params = new URLSearchParams();
  params.set(SPR_REPORT_CYCLE_QUERY, cycle.id);
  if (flow) params.set(SPR_REPORT_FLOW_QUERY, flow);
  return params;
}

/** Href detalle de área preservando ciclo (y flow opcional) del Dashboard. */
export function buildSprReportAreaHref(areaSlug: string, cycle: SprReportCycle, flow?: SprReportFlowId) {
  const query = sprReportCycleSearchParams(cycle, flow).toString();
  return `/spr/reporte/area/${areaSlug}?${query}`;
}

/** Href Dashboard preservando ciclo/flow (p. ej. volver desde detalle de área). */
export function buildSprReportDashboardHref(cycle: SprReportCycle, flow?: SprReportFlowId) {
  const query = sprReportCycleSearchParams(cycle, flow).toString();
  return `/spr/reporte?${query}`;
}

/** Añade `?ciclo=` a hrefs del dashboard (consolidado, etc.). */
export function appendSprReportCycleToHref(href: string, cycleId: SprReportCycleId) {
  const [pathname = '', search = ''] = href.split('?');
  const params = new URLSearchParams(search);
  params.set(SPR_REPORT_CYCLE_QUERY, cycleId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
