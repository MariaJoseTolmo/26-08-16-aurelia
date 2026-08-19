import { InspectionFindingStatus, InspectionStatus } from '@aurelia/contracts';
import type { InspectionDashboardSummaryResponse } from '@aurelia/contracts';

export const kpis = [
  { label: 'Inspecciones 2026', value: '430', detail: '3.594 hallazgos del ano', accent: '#001e39' },
  { label: 'Cerradas', value: '400', detail: '93,02% del total', accent: '#6cc24a' },
  { label: 'Abiertas', value: '30', detail: 'pendientes de cierre', accent: '#d87b40' },
  { label: 'Hallazgos', value: '3.594', detail: 'registrados', accent: '#00b398' },
];

export const contractorKpis = [
  { label: 'EECC con obs. abiertas', value: '8', detail: 'en seguimiento activo', accent: '#c8a064' },
  { label: 'Observaciones abiertas', value: '55', detail: 'pendientes de cierre', accent: '#d87b40' },
  { label: 'Inspecciones abiertas', value: '11', detail: 'con observaciones vigentes', accent: '#001e39' },
  { label: 'Dias abierto', value: '18 · 9,7', detail: 'maximo y promedio', accent: '#bd3b5b' },
];

export const activities = [
  { id: '357', company: 'SOMACOR', area: 'Planta Procesos', age: '18 dias', risk: 'CRITICAL' },
  { id: '376', company: 'GOLD FIELDS', area: 'Servicios Generales', age: '11 dias', risk: 'HIGH' },
  { id: '269', company: 'RESITER', area: 'Servicios Generales', age: '9 dias', risk: 'MEDIUM' },
  { id: '392', company: 'AKD', area: 'Mina', age: '8 dias', risk: 'LOW' },
];

export const findingsTable = [
  { id: 357, company: 'SOMACOR', area: 'Planta Procesos', findings: 1, age: 18, critical: true },
  { id: 364, company: 'SOMACOR', area: 'Planta Procesos', findings: 8, age: 17, critical: true },
  { id: 360, company: 'GARDE CORPS', area: 'Servicios Generales', findings: 1, age: 16, critical: true },
  { id: 376, company: 'GOLD FIELDS', area: 'Servicios Generales', findings: 3, age: 11, critical: false },
  { id: 269, company: 'RESITER', area: 'Servicios Generales', findings: 3, age: 9, critical: false },
];

export function buildDashboardKpis(summary: InspectionDashboardSummaryResponse) {
  const closedCount = summary.inspections.byStatus[InspectionStatus.CLOSED] ?? 0;
  const openCount =
    (summary.inspections.byStatus[InspectionStatus.DRAFT] ?? 0) +
    (summary.inspections.byStatus[InspectionStatus.SCHEDULED] ?? 0) +
    (summary.inspections.byStatus[InspectionStatus.IN_PROGRESS] ?? 0) +
    (summary.inspections.byStatus[InspectionStatus.SUBMITTED] ?? 0) +
    (summary.inspections.byStatus[InspectionStatus.UNDER_REVIEW] ?? 0) +
    (summary.inspections.byStatus[InspectionStatus.RETURNED] ?? 0);

  return [
    {
      label: 'Inspecciones',
      value: String(summary.inspections.total),
      detail: `${summary.inspections.withOpenFindings} con hallazgos abiertos`,
      accent: '#001e39',
    },
    {
      label: 'Cerradas',
      value: String(closedCount),
      detail: `${summary.inspections.closedRate.toFixed(2)}% del total`,
      accent: '#6cc24a',
    },
    {
      label: 'Abiertas',
      value: String(openCount),
      detail: 'pendientes de cierre',
      accent: '#d87b40',
    },
    {
      label: 'Hallazgos',
      value: String(summary.findings.total),
      detail: `${summary.findings.byStatus[InspectionFindingStatus.OPEN] ?? 0} abiertos`,
      accent: '#00b398',
    },
  ];
}