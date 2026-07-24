import type {
  AreaResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprRecordStatus,
} from '@aurelia/contracts';
import { SprRecordStatus as SprRecordStatusEnum } from '@aurelia/contracts';
import type { SprReportAreaCardStatus, SprReportKpiCard } from './spr.constants';

/** Áreas SPR del Dashboard (orden Figma 2109:44036). Solo estas cuentan. */
export const SPR_REPORT_AREA_CATALOG = [
  { code: 'AREA-STECNICOS', slug: 'servicios-tecnicos', name: 'Servicios Técnicos', hasDetailView: true },
  { code: 'AREA-OPTACTIVOS', slug: 'optimizacion-de-activos', name: 'Optimización de Activos', hasDetailView: false },
  { code: 'AREA-MINA', slug: 'mina', name: 'Mina', hasDetailView: false },
  { code: 'AREA-FINANZAS', slug: 'finanzas', name: 'Finanzas', hasDetailView: false },
  { code: 'AREA-PLANTA', slug: 'planta', name: 'Planta', hasDetailView: true },
  { code: 'AREA-MAMBIENTE', slug: 'medio-ambiente', name: 'Medio Ambiente', hasDetailView: false },
  { code: 'AREA-SUSTENTABILIDAD', slug: 'sustentabilidad', name: 'Sustentabilidad', hasDetailView: false },
  { code: 'AREA-SOPERACIONALES', slug: 'servicios-operacionales', name: 'Servicios operacionales', hasDetailView: true },
] as const;

export type SprReportRealAreaCard = {
  slug: string;
  name: string;
  status: SprReportAreaCardStatus;
  statusLabel: string;
  progress: number;
  badges: string[];
  hasDetailView?: boolean;
  assignmentCount: number;
  recordCount: number;
};

const IN_CONSOLIDADO_STATUSES = new Set<SprRecordStatus>([
  SprRecordStatusEnum.SUBMITTED,
  SprRecordStatusEnum.UNDER_REVIEW,
  SprRecordStatusEnum.APPROVED,
]);

function isApproved(status: SprRecordStatus) {
  return status === SprRecordStatusEnum.APPROVED;
}

function isSubmittedOrBeyond(status: SprRecordStatus) {
  return (
    status === SprRecordStatusEnum.SUBMITTED ||
    status === SprRecordStatusEnum.UNDER_REVIEW ||
    status === SprRecordStatusEnum.APPROVED
  );
}

/**
 * KPIs + tarjetas por área desde assignments + monthly-records.
 * Ignora parámetros sin assignment (p. ej. los 3 demo legacy water/waste/energy).
 *
 * Estados de card (Figma 2109:44036) — reglas de negocio:
 * 1. Pendiente — 0 records del área en submitted|under_review|approved en el ciclo
 *    (incluye: sin records, solo draft/rejected). Label "Pendiente"; badge "Sin datos".
 * 2. En consolidado — ≥1 record en esos estados Y aún NO todos los assignments están approved.
 *    Incluye envío parcial (algunos approved, otros submitted o faltantes).
 * 3. Completa — TODOS los assignments del área tienen record approved en el ciclo.
 */
export function buildSprReportDashboardFromRecords(input: {
  areas: AreaResponse[] | undefined;
  assignments: SprParameterAreaAssignmentResponse[] | undefined;
  records: SprMonthlyRecordResponse[] | undefined;
}): { kpiCards: SprReportKpiCard[]; areaCards: SprReportRealAreaCard[] } {
  const areaByCode = new Map((input.areas ?? []).map((area) => [area.code, area]));
  const areaIdByCode = new Map<string, string>();
  for (const meta of SPR_REPORT_AREA_CATALOG) {
    const area = areaByCode.get(meta.code);
    if (area) areaIdByCode.set(meta.code, area.id);
  }

  // Solo assignments de las 8 áreas SPR (excluye params legacy sin assignment).
  const sprAreaIds = new Set([...areaIdByCode.values()]);
  const assignments = (input.assignments ?? []).filter(
    (assignment) => assignment.areaId && sprAreaIds.has(assignment.areaId) && assignment.status === 'active',
  );

  const parameterIdsByAreaId = new Map<string, Set<string>>();
  for (const assignment of assignments) {
    const areaId = assignment.areaId!;
    const set = parameterIdsByAreaId.get(areaId) ?? new Set<string>();
    set.add(assignment.parameterId);
    parameterIdsByAreaId.set(areaId, set);
  }

  const assignedParameterIds = new Set(assignments.map((assignment) => assignment.parameterId));
  const records = (input.records ?? []).filter(
    (record) =>
      record.areaId &&
      sprAreaIds.has(record.areaId) &&
      assignedParameterIds.has(record.parameterId),
  );

  const recordsByAreaParam = new Map<string, SprMonthlyRecordResponse>();
  for (const record of records) {
    recordsByAreaParam.set(`${record.areaId}:${record.parameterId}`, record);
  }

  const areaCards: SprReportRealAreaCard[] = SPR_REPORT_AREA_CATALOG.map((meta) => {
    const areaId = areaIdByCode.get(meta.code);
    const displayName = areaByCode.get(meta.code)?.name ?? meta.name;
    if (!areaId) {
      return {
        slug: meta.slug,
        name: displayName,
        status: 'pending' as const,
        // Figma 2109:44036 — estado = Pendiente; "Sin datos" es badge, no el label.
        statusLabel: 'Pendiente',
        progress: 0,
        badges: ['Resp.', 'Gte.', 'Sin catálogo'],
        hasDetailView: true,
        assignmentCount: 0,
        recordCount: 0,
      };
    }

    const parameterIds = [...(parameterIdsByAreaId.get(areaId) ?? [])];
    const assignmentCount = parameterIds.length;
    const areaRecords = parameterIds
      .map((parameterId) => recordsByAreaParam.get(`${areaId}:${parameterId}`))
      .filter((record): record is SprMonthlyRecordResponse => Boolean(record));
    const recordCount = areaRecords.length;

    if (assignmentCount === 0 || recordCount === 0) {
      return {
        slug: meta.slug,
        name: displayName,
        status: 'pending',
        statusLabel: 'Pendiente',
        progress: 0,
        // Figma 2109:44036 — badges grises sin check.
        badges: ['Resp.', 'Gte.', 'Sin datos'],
        // Detalle Pendiente (Figma 1560:5830) conectado al catálogo real.
        hasDetailView: true,
        assignmentCount,
        recordCount,
      };
    }

    const allApproved = parameterIds.every((parameterId) => {
      const record = recordsByAreaParam.get(`${areaId}:${parameterId}`);
      return record ? isApproved(record.status) : false;
    });
    const allSubmittedOrBeyond = parameterIds.every((parameterId) => {
      const record = recordsByAreaParam.get(`${areaId}:${parameterId}`);
      return record ? isSubmittedOrBeyond(record.status) : false;
    });
    const anyInConsolidado = areaRecords.some((record) => IN_CONSOLIDADO_STATUSES.has(record.status));

    if (allApproved) {
      return {
        slug: meta.slug,
        name: displayName,
        status: 'complete',
        statusLabel: 'Completa',
        progress: 1,
        badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
        hasDetailView: true,
        assignmentCount,
        recordCount,
      };
    }

    if (anyInConsolidado || allSubmittedOrBeyond) {
      const gtePending = !allApproved;
      return {
        slug: meta.slug,
        name: displayName,
        status: 'consolidating',
        statusLabel: 'En consolidado',
        progress: recordCount / Math.max(assignmentCount, 1),
        // Figma 2109:44036 — Resp. ✓ · Gte. → · Consol. · sin Gte.
        badges: [
          'Resp. ✓',
          gtePending ? 'Gte. →' : 'Gte. ✓',
          gtePending ? 'Consol. · sin Gte.' : 'Consolidado ✓',
        ],
        hasDetailView: true,
        assignmentCount,
        recordCount,
      };
    }

    return {
      slug: meta.slug,
      name: displayName,
      status: 'pending',
      statusLabel: 'Pendiente',
      progress: 0,
      badges: ['Resp.', 'Gte.', 'Sin datos'],
      hasDetailView: true,
      assignmentCount,
      recordCount,
    };
  });

  const participantCount = areaCards.filter((card) => card.assignmentCount > 0).length;
  const consolidatingCount = areaCards.filter(
    (card) => card.status === 'consolidating' || card.status === 'complete',
  ).length;
  const withoutDataCount = areaCards.filter((card) => card.status === 'pending').length;
  const fullyApprovedCount = areaCards.filter((card) => card.status === 'complete').length;
  const areasWithManagerScope = areaCards.filter(
    (card) => card.status === 'complete' || card.status === 'consolidating',
  ).length;

  const kpiCards: SprReportKpiCard[] = [
    {
      value: String(participantCount),
      valueTone: 'navy',
      label: 'Áreas participantes',
      helper: `${consolidatingCount} con datos en el ciclo`,
      helperTone: consolidatingCount > 0 ? 'teal' : 'muted',
    },
    {
      value: String(consolidatingCount),
      valueTone: 'teal',
      label: 'En consolidado',
      helper: 'Incluidos al recibir formulario',
      helperTone: 'teal',
    },
    {
      value: String(withoutDataCount),
      valueTone: withoutDataCount > 0 ? 'amber' : 'navy',
      label: 'Sin datos aún',
      helper: withoutDataCount > 0 ? 'Sin registros en el ciclo' : 'Todas las áreas con datos',
      helperTone: withoutDataCount > 0 ? 'amber' : 'muted',
    },
    {
      value: areasWithManagerScope === 0 ? '0/0' : `${fullyApprovedCount}/${areasWithManagerScope}`,
      valueTone: 'amber',
      label: 'Aprobados por Gerente',
      helper:
        areasWithManagerScope === 0
          ? 'Sin formularios recibidos aún'
          : `${Math.max(areasWithManagerScope - fullyApprovedCount, 0)} pendientes de aprobación`,
      helperTone: 'muted',
    },
  ];

  return { kpiCards, areaCards };
}
