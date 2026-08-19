import { InspectionFindingSeverity, InspectionFindingStatus } from '@aurelia/contracts';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionEntity } from './entities/inspection.entity';

export type DashboardPeriod = 'year' | 'q1' | 'q2' | 'q3' | 'q4' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12';

export interface DashboardQuery {
  year?: number | string;
  period?: DashboardPeriod | string;
  companyId?: string | null;
}

export interface DashboardDateFilter {
  year: number;
  period: DashboardPeriod;
  start: Date;
  end: Date;
  companyId: string | null;
}

const periods: DashboardPeriod[] = ['year', 'q1', 'q2', 'q3', 'q4', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'];
const quarters: Record<string, number[]> = { q1: [0, 1, 2], q2: [3, 4, 5], q3: [6, 7, 8], q4: [9, 10, 11] };

export function buildDashboardDateFilter(query: DashboardQuery = {}): DashboardDateFilter {
  const currentYear = new Date().getFullYear();
  const parsedYear = typeof query.year === 'number' ? query.year : Number(query.year);
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= currentYear + 1 ? parsedYear : currentYear;
  const period = periods.includes(query.period as DashboardPeriod) ? query.period as DashboardPeriod : 'q1';
  const months = getDashboardPeriodMonths(period);

  return {
    year,
    period,
    start: new Date(year, months[0] ?? 0, 1),
    end: new Date(year, (months[months.length - 1] ?? 11) + 1, 1),
    companyId: typeof query.companyId === 'string' && query.companyId.trim() ? query.companyId.trim() : null,
  };
}

export function getDashboardPeriodMonths(period: DashboardPeriod): number[] {
  if (period === 'year') return Array.from({ length: 12 }, (_, index) => index);
  if (period.startsWith('m')) return [Number(period.slice(1)) - 1];
  return quarters[period] ?? quarters.q1;
}

export function getDashboardInspectionDate(inspection: InspectionEntity): Date | null {
  return inspection.startedAt ?? inspection.scheduledAt ?? inspection.createdAt ?? null;
}

export function isDashboardDateInFilter(date: Date | null, filter: DashboardDateFilter): boolean {
  return Boolean(date && date >= filter.start && date < filter.end);
}

export function dashboardInspectionMatches(inspection: InspectionEntity, filter: DashboardDateFilter): boolean {
  return (!filter.companyId || inspection.companyId === filter.companyId) && isDashboardDateInFilter(getDashboardInspectionDate(inspection), filter);
}

export function dashboardFindingMatches(finding: InspectionFindingEntity, inspection: InspectionEntity | null, filter: DashboardDateFilter): boolean {
  const companyId = finding.responsibleCompanyId ?? inspection?.companyId ?? null;
  return (!filter.companyId || companyId === filter.companyId) && isDashboardDateInFilter(finding.createdAt, filter);
}

export function isOpenDashboardFinding(finding: InspectionFindingEntity): boolean {
  return finding.status !== InspectionFindingStatus.CLOSED && finding.status !== InspectionFindingStatus.CANCELLED;
}

export function isSevereDashboardFinding(finding: InspectionFindingEntity): boolean {
  return finding.severity === InspectionFindingSeverity.HIGH || finding.severity === InspectionFindingSeverity.CRITICAL;
}

export function getDashboardPeriodLabel(filter: DashboardDateFilter): string {
  if (filter.period === 'year') return `${filter.year}`;
  if (filter.period.startsWith('m')) return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(filter.year, getDashboardPeriodMonths(filter.period)[0] ?? 0, 1));

  const labels: Record<string, string> = {
    q1: `T1 · Ene-Mar ${filter.year}`,
    q2: `T2 · Abr-Jun ${filter.year}`,
    q3: `T3 · Jul-Sep ${filter.year}`,
    q4: `T4 · Oct-Dic ${filter.year}`,
  };

  return labels[filter.period] ?? `${filter.year}`;
}
