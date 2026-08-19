import {
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionStatus,
  type InspectionDashboardSummaryResponse,
  type InspectionResponse,
} from '@aurelia/contracts';

export type DashboardOpenDetailRow = {
  inspectionNumber: string;
  company: string;
  area: string;
  ageDays: number;
  openFindings: number;
};

export type DashboardRuntimeModel = {
  totalInspections: string;
  totalFindings: string;
  closedInspections: string;
  closedRate: string;
  openInspections: string;
  openLabel: string;
  findingsLabel: string;
  criticalOpenFindings: number;
  openDetails: DashboardOpenDetailRow[];
};

export type DashboardAreaObservationRow = {
  area: string;
  closedFindings: number;
  openFindings: number;
};

export type DashboardMonthlySeriesRow = {
  month: string;
  inspections: number;
  findings: number;
  closedFindings: number;
  openFindings: number;
};

export type DashboardClosureMetrics = {
  historicalClosureRate: number;
  periodClosureRate: number;
  periodLabel: string;
};

export const DASHBOARD_OPEN_DETAILS_ROW_COUNT = 11;

export const FALLBACK_OPEN_DETAILS: DashboardOpenDetailRow[] = [
  { inspectionNumber: '357', company: 'SOMACOR', area: 'Planta Procesos', ageDays: 18, openFindings: 1 },
  { inspectionNumber: '364', company: 'SOMACOR', area: 'Planta Procesos', ageDays: 17, openFindings: 8 },
  { inspectionNumber: '369', company: 'GARDE CORPS', area: 'Servicios Generales', ageDays: 16, openFindings: 1 },
  { inspectionNumber: '376', company: 'GOLD FIELDS', area: 'Servicios Generales', ageDays: 11, openFindings: 3 },
  { inspectionNumber: '389', company: 'RESITER', area: 'Servicios Generales', ageDays: 9, openFindings: 3 },
  { inspectionNumber: '390', company: 'GARDE CORPS', area: 'Medio Ambiente', ageDays: 9, openFindings: 3 },
  { inspectionNumber: '392', company: 'AKD', area: 'Mina', ageDays: 8, openFindings: 5 },
  { inspectionNumber: '393', company: 'ICV', area: 'Mina', ageDays: 8, openFindings: 7 },
  { inspectionNumber: '395', company: 'AGGREKO', area: 'Planta Procesos', ageDays: 4, openFindings: 13 },
  { inspectionNumber: '396', company: 'FAST MODULAR', area: 'Sustaining', ageDays: 4, openFindings: 4 },
  { inspectionNumber: '398', company: 'ICV', area: 'Mina', ageDays: 3, openFindings: 7 },
];

export const FALLBACK_RUNTIME: DashboardRuntimeModel = {
  totalInspections: '430',
  totalFindings: '3.594',
  closedInspections: '400',
  closedRate: '93,02% del total',
  openInspections: '30',
  openLabel: 'pendientes de cierre',
  findingsLabel: 'hallazgos registrados',
  criticalOpenFindings: 3,
  openDetails: FALLBACK_OPEN_DETAILS,
};

export const FALLBACK_AREA_OBSERVATIONS: DashboardAreaObservationRow[] = [
  { area: 'Planta Procesos', closedFindings: 1285, openFindings: 35 },
  { area: 'Sustaining', closedFindings: 700, openFindings: 15 },
  { area: 'Gerencia de Operaciones', closedFindings: 380, openFindings: 8 },
  { area: 'Medio Ambiente', closedFindings: 110, openFindings: 10 },
  { area: 'Gestión Activos', closedFindings: 100, openFindings: 4 },
  { area: 'IT', closedFindings: 14, openFindings: 4 },
];

export function getOpenDetailRow(runtime: DashboardRuntimeModel, index: number): DashboardOpenDetailRow {
  return runtime.openDetails[index] ?? FALLBACK_OPEN_DETAILS[index] ?? FALLBACK_OPEN_DETAILS[0]!;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('es-CL').format(value);
}

function buildEntityLabel(prefix: string, value: string | null): string {
  if (!value) return `Sin ${prefix}`;
  return `${prefix} ${value.slice(0, 8).toUpperCase()}`;
}

function resolveInspectionNumber(inspection: InspectionResponse, index: number): string {
  const titleNumber = inspection.title.match(/\d+/)?.[0];
  if (titleNumber) return titleNumber;

  return `${index + 1}`;
}

function resolveInspectionAgeDays(inspection: InspectionResponse, nowEpochMs: number): number {
  const candidateDate = inspection.startedAt ?? inspection.scheduledAt ?? inspection.createdAt;
  if (!candidateDate) return 0;

  const epochMs = Date.parse(candidateDate);
  if (Number.isNaN(epochMs)) return 0;

  return Math.max(0, Math.floor((nowEpochMs - epochMs) / (1000 * 60 * 60 * 24)));
}

export function buildOpenDetailsRows(inspections: InspectionResponse[] | undefined): DashboardOpenDetailRow[] {
  if (!inspections || inspections.length === 0) {
    return FALLBACK_OPEN_DETAILS;
  }

  const nowEpochMs = Date.now();

  const mappedRows = inspections
    .filter((inspection) => inspection.openFindingsCount > 0)
    .map((inspection, index) => {
      const ageDays = resolveInspectionAgeDays(inspection, nowEpochMs);

      return {
        inspectionNumber: resolveInspectionNumber(inspection, index),
        company: buildEntityLabel('Empresa', inspection.companyId),
        area: buildEntityLabel('Área', inspection.areaId),
        ageDays,
        openFindings: inspection.openFindingsCount,
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays);

  return [...mappedRows, ...FALLBACK_OPEN_DETAILS].slice(0, DASHBOARD_OPEN_DETAILS_ROW_COUNT);
}

export function buildDashboardRuntimeModel(
  summary: InspectionDashboardSummaryResponse | undefined,
  inspections: InspectionResponse[] | undefined,
): DashboardRuntimeModel {
  if (!summary) {
    const visibleInspections = (inspections ?? []).filter((inspection) => inspection.status !== InspectionStatus.DRAFT);

    if (visibleInspections.length === 0) {
      return {
        ...FALLBACK_RUNTIME,
        openDetails: buildOpenDetailsRows(inspections),
      };
    }

    const totalInspectionsFromList = visibleInspections.length;
    const closedInspectionsFromList = visibleInspections.filter((inspection) => inspection.status === InspectionStatus.CLOSED).length;
    const openInspectionsFromList = visibleInspections.filter((inspection) => inspection.status !== InspectionStatus.CLOSED && inspection.status !== InspectionStatus.CANCELLED).length;
    const totalFindingsFromList = visibleInspections.reduce((total, inspection) => total + Math.max(0, inspection.findingsCount ?? 0), 0);
    const openFindingsFromList = visibleInspections.reduce((total, inspection) => total + Math.max(0, inspection.openFindingsCount ?? 0), 0);
    const closedRateFromList = totalInspectionsFromList > 0 ? (closedInspectionsFromList / totalInspectionsFromList) * 100 : 0;

    return {
      totalInspections: formatCompactNumber(totalInspectionsFromList),
      totalFindings: formatCompactNumber(totalFindingsFromList),
      closedInspections: formatCompactNumber(closedInspectionsFromList),
      closedRate: `${closedRateFromList.toFixed(2)}% del total`,
      openInspections: formatCompactNumber(openInspectionsFromList),
      openLabel: 'pendientes de cierre',
      findingsLabel: `${formatCompactNumber(openFindingsFromList)} abiertos`,
      criticalOpenFindings: 0,
      openDetails: buildOpenDetailsRows(inspections),
    };
  }

  const totalInspections = summary.inspections.total;
  const totalFindings = summary.findings.total;
  const closedInspections = summary.inspections.byStatus[InspectionStatus.CLOSED] ?? 0;
  const openInspections = computeOpenInspections(summary.inspections.byStatus);
  const openFindings = summary.findings.byStatus[InspectionFindingStatus.OPEN] ?? summary.findings.open;
  const criticalOpenFindings = summary.findings.bySeverity[InspectionFindingSeverity.CRITICAL] ?? 0;

  return {
    totalInspections: formatCompactNumber(totalInspections),
    totalFindings: formatCompactNumber(totalFindings),
    closedInspections: formatCompactNumber(closedInspections),
    closedRate: `${summary.inspections.closedRate.toFixed(2)}% del total`,
    openInspections: formatCompactNumber(openInspections),
    openLabel: 'pendientes de cierre',
    findingsLabel: `${formatCompactNumber(openFindings)} abiertos`,
    criticalOpenFindings,
    openDetails: buildOpenDetailsRows(inspections),
  };
}

export function buildAreaObservationsRows(inspections: InspectionResponse[] | undefined): DashboardAreaObservationRow[] {
  if (!inspections || inspections.length === 0) {
    return FALLBACK_AREA_OBSERVATIONS;
  }

  const areaMap = new Map<string, DashboardAreaObservationRow>();

  inspections.forEach((inspection) => {
    const key = inspection.areaId ?? 'sin-area';
    const current = areaMap.get(key) ?? {
      area: buildEntityLabel('Área', inspection.areaId),
      closedFindings: 0,
      openFindings: 0,
    };

    const openFindings = Math.max(0, inspection.openFindingsCount ?? 0);
    const closedFindings = Math.max(0, (inspection.findingsCount ?? 0) - openFindings);

    current.openFindings += openFindings;
    current.closedFindings += closedFindings;

    areaMap.set(key, current);
  });

  const rows = Array.from(areaMap.values())
    .filter((row) => row.openFindings + row.closedFindings > 0)
    .sort((a, b) => b.closedFindings + b.openFindings - (a.closedFindings + a.openFindings))
    .slice(0, 10);

  return rows.length > 0 ? rows : FALLBACK_AREA_OBSERVATIONS;
}

export function buildMonthlySeriesRows(inspections: InspectionResponse[] | undefined): DashboardMonthlySeriesRow[] {
  const now = new Date();
  const year = now.getFullYear();

  const monthBuckets = Array.from({ length: 12 }, (_, monthIndex) => ({
    month: new Intl.DateTimeFormat('es-CL', { month: 'short' })
      .format(new Date(year, monthIndex, 1))
      .replace('.', ''),
    inspections: 0,
    findings: 0,
    closedFindings: 0,
    openFindings: 0,
  }));

  if (!inspections || inspections.length === 0) {
    return monthBuckets;
  }

  inspections.forEach((inspection) => {
    const candidateDate = inspection.startedAt ?? inspection.scheduledAt ?? inspection.createdAt;
    if (!candidateDate) return;

    const parsed = new Date(candidateDate);
    if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== year) return;

    const monthIndex = parsed.getMonth();
    monthBuckets[monthIndex]!.inspections += 1;
    const openFindings = Math.max(0, inspection.openFindingsCount ?? 0);
    const totalFindings = Math.max(0, inspection.findingsCount ?? 0);
    monthBuckets[monthIndex]!.findings += totalFindings;
    monthBuckets[monthIndex]!.openFindings += openFindings;
    monthBuckets[monthIndex]!.closedFindings += Math.max(0, totalFindings - openFindings);
  });

  return monthBuckets;
}

export function buildClosureMetrics(
  summary: InspectionDashboardSummaryResponse | undefined,
  inspections: InspectionResponse[] | undefined,
): DashboardClosureMetrics {
  const historicalClosureRate = Math.max(0, Math.min(100, summary?.inspections.closedRate ?? 0));

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const periodLabel = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(now);

  if (!inspections || inspections.length === 0) {
    return {
      historicalClosureRate,
      periodClosureRate: historicalClosureRate,
      periodLabel,
    };
  }

  let monthTotal = 0;
  let monthClosed = 0;

  inspections.forEach((inspection) => {
    const candidateDate = inspection.startedAt ?? inspection.scheduledAt ?? inspection.createdAt;
    if (!candidateDate) return;

    const parsed = new Date(candidateDate);
    if (Number.isNaN(parsed.getTime())) return;
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month) return;

    monthTotal += 1;
    if (inspection.status === InspectionStatus.CLOSED) {
      monthClosed += 1;
    }
  });

  const periodClosureRate = monthTotal > 0 ? (monthClosed / monthTotal) * 100 : historicalClosureRate;

  return {
    historicalClosureRate,
    periodClosureRate,
    periodLabel,
  };
}

export function computeOpenInspections(byStatus: Record<InspectionStatus, number>): number {
  return (
    (byStatus[InspectionStatus.DRAFT] ?? 0) +
    (byStatus[InspectionStatus.SCHEDULED] ?? 0) +
    (byStatus[InspectionStatus.IN_PROGRESS] ?? 0) +
    (byStatus[InspectionStatus.SUBMITTED] ?? 0) +
    (byStatus[InspectionStatus.UNDER_REVIEW] ?? 0) +
    (byStatus[InspectionStatus.RETURNED] ?? 0)
  );
}
