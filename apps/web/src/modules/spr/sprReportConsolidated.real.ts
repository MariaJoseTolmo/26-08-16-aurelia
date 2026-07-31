import type {
  AreaResponse,
  SprMeasureGroupResponse,
  SprMonthlyRecordResponse,
  SprParameterAreaAssignmentResponse,
  SprParameterResponse,
  SprRecordStatus,
  SprUnitResponse,
} from '@aurelia/contracts';
import { SprRecordStatus as SprRecordStatusEnum } from '@aurelia/contracts';
import type { SprConsolidatedOrigin, SprConsolidatedTrend } from './spr.constants';
import { SPR_REPORT_AREA_CATALOG } from './sprReportDashboard.real';

/** Códigos de área SPR → origen Formulario | Automático (catálogo form flow). */
const AREA_ORIGIN_BY_CODE: Record<string, SprConsolidatedOrigin> = {
  'AREA-STECNICOS': 'formulario',
  'AREA-OPTACTIVOS': 'formulario',
  'AREA-MINA': 'formulario',
  'AREA-FINANZAS': 'formulario',
  'AREA-PLANTA': 'formulario',
  'AREA-SOPERACIONALES': 'formulario',
  'AREA-MAMBIENTE': 'automatico',
  'AREA-SUSTENTABILIDAD': 'automatico',
};

const IN_CONSOLIDADO_STATUSES = new Set<SprRecordStatus>([
  SprRecordStatusEnum.SUBMITTED,
  SprRecordStatusEnum.UNDER_REVIEW,
  SprRecordStatusEnum.APPROVED,
]);

/** PLACEHOLDER: sin promedio 6M aún — no inventar ↑/↓. */
const TREND_PLACEHOLDER: { trend: SprConsolidatedTrend; trendLabel: string } = {
  trend: 'flat',
  trendLabel: '—',
};

export type SprConsolidatedRealTableRow =
  | { kind: 'group'; id: string; label: string }
  | {
      kind: 'data';
      id: string;
      name: string;
      area: string;
      category: string;
      value: string;
      unit: string;
      trend: SprConsolidatedTrend;
      trendLabel: string;
      /** null = PLACEHOLDER (área fuera del catálogo conocido). */
      origin: SprConsolidatedOrigin | null;
      hasValue: boolean;
      /** PLACEHOLDER alerta histórica: siempre false hasta existir promedios. */
      highlight: false;
    };

export type SprConsolidatedRealTable = {
  rows: SprConsolidatedRealTableRow[];
  dataRowCount: number;
  filledRowCount: number;
  areaCount: number;
  pendingAreaNames: string[];
  tableTitle: string;
};

function formatNumericValue(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(numeric);
}

function unitLabel(unit: SprUnitResponse | undefined): string {
  if (!unit) return '—';
  return unit.symbol?.trim() || unit.name || '—';
}

function valueCell(record: SprMonthlyRecordResponse | undefined): { label: string; hasValue: boolean } {
  if (!record || !IN_CONSOLIDADO_STATUSES.has(record.status)) {
    return { label: 'Pendiente', hasValue: false };
  }
  const numeric = formatNumericValue(record.numericValue);
  if (numeric !== null) return { label: numeric, hasValue: true };
  const text = record.textValue?.trim();
  if (text) return { label: text, hasValue: true };
  return { label: 'Sin dato', hasValue: false };
}

/**
 * Modelo A — filas reales parámetro × área (assignments del ciclo).
 * Solo para estado En curso. Tendencia y alerta histórica = PLACEHOLDER.
 */
export function buildSprConsolidatedTableFromCatalog(input: {
  areas: AreaResponse[] | undefined;
  parameters: SprParameterResponse[] | undefined;
  units: SprUnitResponse[] | undefined;
  groups: SprMeasureGroupResponse[] | undefined;
  assignments: SprParameterAreaAssignmentResponse[] | undefined;
  records: SprMonthlyRecordResponse[] | undefined;
}): SprConsolidatedRealTable {
  const areaById = new Map((input.areas ?? []).map((area) => [area.id, area]));
  const areaByCode = new Map((input.areas ?? []).map((area) => [area.code, area]));
  const parameterById = new Map((input.parameters ?? []).map((parameter) => [parameter.id, parameter]));
  const unitById = new Map((input.units ?? []).map((unit) => [unit.id, unit]));
  const groupById = new Map((input.groups ?? []).map((group) => [group.id, group]));

  const sprAreaIds = new Set<string>();
  for (const meta of SPR_REPORT_AREA_CATALOG) {
    const area = areaByCode.get(meta.code);
    if (area) sprAreaIds.add(area.id);
  }

  const assignments = (input.assignments ?? []).filter(
    (assignment) =>
      assignment.status === 'active' &&
      assignment.areaId &&
      sprAreaIds.has(assignment.areaId) &&
      parameterById.has(assignment.parameterId),
  );

  const assignedParameterIds = new Set(assignments.map((assignment) => assignment.parameterId));
  const recordsByAreaParam = new Map<string, SprMonthlyRecordResponse>();
  for (const record of input.records ?? []) {
    if (!record.areaId || !sprAreaIds.has(record.areaId)) continue;
    if (!assignedParameterIds.has(record.parameterId)) continue;
    recordsByAreaParam.set(`${record.areaId}:${record.parameterId}`, record);
  }

  type DataDraft = {
    id: string;
    name: string;
    area: string;
    areaId: string;
    category: string;
    groupSort: number;
    parameterSort: number;
    value: string;
    unit: string;
    hasValue: boolean;
    origin: SprConsolidatedOrigin | null;
  };

  const dataDrafts: DataDraft[] = [];
  for (const assignment of assignments) {
    const areaId = assignment.areaId!;
    const area = areaById.get(areaId);
    const parameter = parameterById.get(assignment.parameterId);
    if (!area || !parameter || parameter.status !== 'active') continue;

    const group = groupById.get(parameter.measureGroupId);
    const unit = parameter.unitId ? unitById.get(parameter.unitId) : undefined;
    const record = recordsByAreaParam.get(`${areaId}:${parameter.id}`);
    const { label, hasValue } = valueCell(record);

    dataDrafts.push({
      id: assignment.id,
      name: parameter.name,
      area: area.name,
      areaId,
      category: group?.name ?? 'Sin categoría',
      groupSort: group?.sortOrder ?? 9999,
      parameterSort: parameter.sortOrder,
      value: label,
      unit: unitLabel(unit),
      hasValue,
      origin: AREA_ORIGIN_BY_CODE[area.code] ?? null,
    });
  }

  dataDrafts.sort((a, b) => {
    if (a.groupSort !== b.groupSort) return a.groupSort - b.groupSort;
    if (a.parameterSort !== b.parameterSort) return a.parameterSort - b.parameterSort;
    if (a.name !== b.name) return a.name.localeCompare(b.name, 'es');
    return a.area.localeCompare(b.area, 'es');
  });

  const rows: SprConsolidatedRealTableRow[] = [];
  let lastCategory: string | null = null;
  for (const draft of dataDrafts) {
    if (draft.category !== lastCategory) {
      lastCategory = draft.category;
      rows.push({
        kind: 'group',
        id: `group-${draft.category}`,
        label: draft.category,
      });
    }
    rows.push({
      kind: 'data',
      id: draft.id,
      name: draft.name,
      area: draft.area,
      category: draft.category,
      value: draft.value,
      unit: draft.unit,
      trend: TREND_PLACEHOLDER.trend,
      trendLabel: TREND_PLACEHOLDER.trendLabel,
      origin: draft.origin,
      hasValue: draft.hasValue,
      highlight: false,
    });
  }

  const filledByArea = new Map<string, { name: string; filled: number; total: number }>();
  for (const draft of dataDrafts) {
    const current = filledByArea.get(draft.areaId) ?? { name: draft.area, filled: 0, total: 0 };
    current.total += 1;
    if (draft.hasValue) current.filled += 1;
    filledByArea.set(draft.areaId, current);
  }

  const pendingAreaNames = [...filledByArea.values()]
    .filter((entry) => entry.filled < entry.total)
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'es'));

  const dataRowCount = dataDrafts.length;
  const filledRowCount = dataDrafts.filter((draft) => draft.hasValue).length;
  const areaCount = filledByArea.size;

  return {
    rows,
    dataRowCount,
    filledRowCount,
    areaCount,
    pendingAreaNames,
    tableTitle: `Datos consolidados · ${areaCount} áreas · ${dataRowCount} filas`,
  };
}
