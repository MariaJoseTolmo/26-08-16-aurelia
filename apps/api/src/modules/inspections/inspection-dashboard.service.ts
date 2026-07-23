import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionFindingSeverity, InspectionFindingStatus, InspectionStatus } from '@aurelia/contracts';
import type {
  InspectionDashboardAreaObservationRowResponse,
  InspectionDashboardChartsResponse,
  InspectionDashboardCompanyAnalysisResponse,
  InspectionDashboardCompanyChartRowResponse,
  InspectionDashboardOpenFindingRowResponse,
  InspectionDashboardOpenFindingsResponse,
  InspectionDashboardSummaryResponse,
  InspectionManagementKpisResponse,
  InspectionManagementTableFilterOptionsResponse,
  InspectionManagementTableObservationSummaryResponse,
  InspectionManagementTableResponse,
  InspectionManagementTableRowResponse,
} from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionTypeEntity } from './entities/inspection-type.entity';
import { InspectionEntity } from './entities/inspection.entity';
import {
  type DashboardQuery,
  buildDashboardDateFilter,
  dashboardFindingMatches,
  dashboardInspectionMatches,
  getDashboardInspectionDate,
  getDashboardPeriodLabel,
  getDashboardPeriodMonths,
} from './inspection-dashboard-period';

export interface InspectionDataScope {
  inspectionIds?: string[];
}

export interface ManagementTableQuery {
  page?: string;
  pageSize?: string;
  id?: string;
  date?: string;
  inspector?: string;
  area?: string;
  company?: string;
  type?: string;
  urgency?: string;
  count?: string;
  obs?: string;
  daysMin?: string;
  daysMax?: string;
  closure?: string;
}

@Injectable()
export class InspectionDashboardService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectors: Repository<SectorEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InspectionTypeEntity)
    private readonly inspectionTypes: Repository<InspectionTypeEntity>,
  ) {}

  async getManagementKpis(scope: InspectionDataScope = {}): Promise<InspectionManagementKpisResponse> {
    const [allInspections, allFindings] = await Promise.all([this.inspections.find(), this.findings.find()]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const year = new Date().getFullYear();
    const previousYear = year - 1;
    const inspectionById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const findingsByInspection = this.groupFindingsByInspection(findings);
    const activeInspections = inspections.filter((inspection) => inspection.status !== InspectionStatus.CANCELLED);
    const currentYearInspections = activeInspections.filter((inspection) => this.inspectionBelongsToYear(inspection, year));
    const previousYearInspections = activeInspections.filter((inspection) => this.inspectionBelongsToYear(inspection, previousYear));
    const currentYearFindings = findings.filter((finding) => {
      if (finding.status === InspectionFindingStatus.CANCELLED) return false;
      const inspection = inspectionById.get(finding.inspectionId);
      return inspection ? this.inspectionBelongsToYear(inspection, year) : false;
    });
    const closedFindings = currentYearFindings.filter((finding) => finding.status === InspectionFindingStatus.CLOSED).length;
    const openFindings = currentYearFindings.filter((finding) => this.isOpenFinding(finding)).length;
    const previousTotal = previousYearInspections.length;
    const inspectionsDeltaPercent = previousTotal > 0
      ? Number((((currentYearInspections.length - previousTotal) / previousTotal) * 100).toFixed(2))
      : currentYearInspections.length > 0 ? 100 : 0;

    return {
      year,
      previousYear,
      totalInspections: currentYearInspections.length,
      previousYearInspections: previousTotal,
      inspectionsDeltaPercent,
      openInspections: currentYearInspections.filter(
        (inspection) => !this.isInspectionEffectivelyClosed(inspection, findingsByInspection.get(inspection.id) ?? []),
      ).length,
      openFindings,
      pendingApprovalInspections: currentYearInspections.filter((inspection) =>
        !this.isInspectionEffectivelyClosed(inspection, findingsByInspection.get(inspection.id) ?? [])
        && (inspection.status === InspectionStatus.SUBMITTED || inspection.status === InspectionStatus.UNDER_REVIEW),
      ).length,
      closedFindingsRate: currentYearFindings.length > 0
        ? Number(((closedFindings / currentYearFindings.length) * 100).toFixed(2))
        : 0,
    };
  }

  async getManagementTable(
    query: ManagementTableQuery = {},
    scope: InspectionDataScope = {},
  ): Promise<InspectionManagementTableResponse> {
    const [allInspections, allFindings, companies, areas, sectors, users, inspectionTypes] = await Promise.all([
      this.inspections.find(),
      this.findings.find(),
      this.companies.find(),
      this.areas.find(),
      this.sectors.find(),
      this.users.find(),
      this.inspectionTypes.find(),
    ]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const now = new Date();
    const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
    const areaNameById = new Map(areas.map((area) => [area.id, area.name]));
    const sectorNameById = new Map(sectors.map((sector) => [sector.id, sector.name]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const typeById = new Map(inspectionTypes.map((type) => [type.id, type]));
    const findingsByInspection = this.groupFindingsByInspection(findings);

    const activeInspections = inspections.filter((inspection) =>
      inspection.status !== InspectionStatus.CANCELLED
      && !this.isInspectionEffectivelyClosed(inspection, findingsByInspection.get(inspection.id) ?? []),
    );
    const rows = activeInspections.map((inspection, index) => {
      const inspectionFindings = findingsByInspection.get(inspection.id) ?? [];
      const observations = this.createObservationSummary(inspectionFindings);
      const openFindings = inspectionFindings.filter((finding) => this.isOpenFinding(finding));
      const maxSeverity = inspectionFindings.reduce<InspectionFindingSeverity | null>(
        (current, finding) => this.resolveMaxSeverity(current, finding.severity),
        null,
      );
      const date = getDashboardInspectionDate(inspection);
      const closureRate = inspectionFindings.length > 0
        ? Number(((observations.closed / inspectionFindings.length) * 100).toFixed(2))
        : 0;

      return {
        inspectionId: inspection.id,
        inspectionNumber: this.resolveInspectionNumber(inspection, index),
        date: date ? date.toISOString() : null,
        inspector: this.formatInspectorLabel(userById.get(inspection.inspectorId ?? '') ?? null),
        areaSector: this.formatAreaSectorLabel(inspection.areaId, inspection.sectorId, areaNameById, sectorNameById),
        company: this.formatCompanyLabel(inspection.companyId, companyNameById),
        type: this.formatInspectionTypeLabel(
          inspection,
          typeById.get(inspection.inspectionTypeId) ?? null,
          inspectionFindings.length,
        ),
        urgencyLabel: this.formatUrgencyLabel(inspection, maxSeverity),
        urgencySeverity: maxSeverity,
        observationsCount: inspectionFindings.length,
        observations,
        daysOpen: openFindings.length > 0
          ? Math.max(...openFindings.map((finding) => this.daysBetween(finding.createdAt, now)))
          : 0,
        closureRate,
      };
    }).sort((a, b) =>
      this.getUrgencyWeight(b.urgencySeverity) - this.getUrgencyWeight(a.urgencySeverity)
      || b.daysOpen - a.daysOpen
      || b.observations.open - a.observations.open,
    );
    const pageSize = this.resolvePageSize(query.pageSize);
    const filteredRows = rows.filter((row) => this.managementTableRowMatches(row, query));
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const page = this.resolvePage(query.page, totalPages);
    const start = (page - 1) * pageSize;

    return {
      page,
      pageSize,
      total: filteredRows.length,
      totalPages,
      rows: filteredRows.slice(start, start + pageSize),
      filterOptions: this.buildManagementTableFilterOptions(rows),
    };
  }

  async getSummary(
    query: DashboardQuery = {},
    scope: InspectionDataScope = {},
  ): Promise<InspectionDashboardSummaryResponse> {
    const [allInspections, allFindings] = await Promise.all([this.inspections.find(), this.findings.find()]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const filter = buildDashboardDateFilter(query);
    const inspectionById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const selectedInspections = inspections.filter((inspection) => dashboardInspectionMatches(inspection, filter));
    const selectedFindings = findings.filter((finding) =>
      dashboardFindingMatches(finding, inspectionById.get(finding.inspectionId) ?? null, filter),
    );
    const findingsByInspection = this.groupFindingsByInspection(selectedFindings);
    const byStatus = this.createInspectionStatusCounter();
    const findingsByStatus = this.createFindingStatusCounter();
    const findingsBySeverity = this.createFindingSeverityCounter();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    selectedInspections.forEach((inspection) => { byStatus[inspection.status] += 1; });
    selectedFindings.forEach((finding) => {
      findingsByStatus[finding.status] += 1;
      findingsBySeverity[finding.severity] += 1;
    });
    const openFindings = selectedFindings.filter((finding) => this.isOpenFinding(finding));
    const withOpenFindings = new Set(openFindings.map((finding) => finding.inspectionId)).size;
    const closedInspections = selectedInspections.filter((inspection) =>
      this.isInspectionEffectivelyClosed(inspection, findingsByInspection.get(inspection.id) ?? []),
    ).length;
    const closedRate = selectedInspections.length === 0
      ? 0
      : Number(((closedInspections / selectedInspections.length) * 100).toFixed(2));

    return {
      inspections: { total: selectedInspections.length, byStatus, withOpenFindings, closedRate },
      findings: {
        total: selectedFindings.length,
        byStatus: findingsByStatus,
        bySeverity: findingsBySeverity,
        open: openFindings.length,
        overdue: openFindings.filter((finding) => finding.dueAt && finding.dueAt < now).length,
        dueSoonNext7Days: openFindings.filter(
          (finding) => finding.dueAt && finding.dueAt >= now && finding.dueAt <= sevenDaysFromNow,
        ).length,
      },
    };
  }

  async getCharts(
    query: DashboardQuery = {},
    scope: InspectionDataScope = {},
  ): Promise<InspectionDashboardChartsResponse> {
    const [allInspections, allFindings, areas] = await Promise.all([
      this.inspections.find(),
      this.findings.find(),
      this.areas.find(),
    ]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const filter = buildDashboardDateFilter(query);
    const currentYear = new Date().getFullYear();
    const inspectionById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const findingsByInspection = this.groupFindingsByInspection(findings);
    const areaNameById = new Map(areas.map((area) => [area.id, area.name]));
    const yearRange = Array.from({ length: 4 }, (_, index) => currentYear - 3 + index);
    const annualInspections = yearRange.map((year) => ({ year, closed: 0, open: 0 }));
    const annualByYear = new Map(annualInspections.map((row) => [row.year, row]));
    const monthlyFindings = getDashboardPeriodMonths(filter.period).map((monthIndex) => ({
      month: monthIndex + 1,
      label: new Intl.DateTimeFormat('es-CL', { month: 'short' })
        .format(new Date(filter.year, monthIndex, 1))
        .replace('.', ''),
      closed: 0,
      open: 0,
    }));
    const monthlyByMonth = new Map(monthlyFindings.map((row) => [row.month, row]));
    const areaObservations = new Map<string, InspectionDashboardAreaObservationRowResponse>();
    let totalForClosure = 0;
    let closedForClosure = 0;
    let periodTotal = 0;
    let periodClosed = 0;

    inspections.forEach((inspection) => {
      if (inspection.status === InspectionStatus.CANCELLED) return;
      const date = getDashboardInspectionDate(inspection);
      const closed = this.isInspectionEffectivelyClosed(inspection, findingsByInspection.get(inspection.id) ?? []);
      totalForClosure += 1;
      if (closed) closedForClosure += 1;
      if (date && date >= filter.start && date < filter.end) {
        periodTotal += 1;
        if (closed) periodClosed += 1;
      }
      if (!date) return;
      const annualRow = annualByYear.get(date.getFullYear());
      if (!annualRow) return;
      if (closed) annualRow.closed += 1;
      else annualRow.open += 1;
    });

    findings.forEach((finding) => {
      if (finding.status === InspectionFindingStatus.CANCELLED) return;
      const inspection = inspectionById.get(finding.inspectionId) ?? null;
      if (!dashboardFindingMatches(finding, inspection, filter)) return;
      const row = monthlyByMonth.get(finding.createdAt.getMonth() + 1);
      if (row) {
        if (finding.status === InspectionFindingStatus.CLOSED) row.closed += 1;
        else row.open += 1;
      }
      const areaId = inspection?.areaId ?? null;
      const areaKey = areaId ?? 'sin-area';
      const areaRow = areaObservations.get(areaKey) ?? {
        areaId,
        area: this.formatAreaLabel(areaId, areaNameById),
        closed: 0,
        open: 0,
      };
      if (finding.status === InspectionFindingStatus.CLOSED) areaRow.closed += 1;
      else areaRow.open += 1;
      areaObservations.set(areaKey, areaRow);
    });

    return {
      annualInspections,
      monthlyFindings,
      areaObservations: Array.from(areaObservations.values())
        .sort((a, b) => b.closed + b.open - (a.closed + a.open))
        .slice(0, 10),
      closure: {
        historicalRate: totalForClosure > 0
          ? Number(((closedForClosure / totalForClosure) * 100).toFixed(2))
          : 0,
        periodRate: periodTotal > 0 ? Number(((periodClosed / periodTotal) * 100).toFixed(2)) : 0,
        periodLabel: getDashboardPeriodLabel(filter),
      },
    };
  }

  async getCompanyAnalysis(
    query: DashboardQuery = {},
    scope: InspectionDataScope = {},
  ): Promise<InspectionDashboardCompanyAnalysisResponse> {
    const [allInspections, allFindings, companies] = await Promise.all([
      this.inspections.find(),
      this.findings.find(),
      this.companies.find(),
    ]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const filter = buildDashboardDateFilter(query);
    const now = new Date();
    const inspectionById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
    const companiesWithOpenFindings = new Set<string>();
    const openInspections = new Set<string>();
    const openAges: number[] = [];
    const chartRowsByCompany = new Map<string, InspectionDashboardCompanyChartRowResponse>();

    findings.forEach((finding) => {
      const inspection = inspectionById.get(finding.inspectionId) ?? null;
      if (!dashboardFindingMatches(finding, inspection, filter)) return;
      const companyId = finding.responsibleCompanyId ?? inspection?.companyId ?? null;
      if (this.isOpenFinding(finding)) {
        if (companyId) companiesWithOpenFindings.add(companyId);
        openInspections.add(finding.inspectionId);
        openAges.push(this.daysBetween(finding.createdAt, now));
      }
      if (finding.status === InspectionFindingStatus.CANCELLED) return;
      const companyKey = companyId ?? 'sin-empresa';
      const row = chartRowsByCompany.get(companyKey) ?? {
        companyId,
        company: this.formatCompanyLabel(companyId, companyNameById),
        closed: 0,
        open: 0,
      };
      if (finding.status === InspectionFindingStatus.CLOSED) row.closed += 1;
      else row.open += 1;
      chartRowsByCompany.set(companyKey, row);
    });

    return {
      companiesWithOpenFindings: companiesWithOpenFindings.size,
      openFindings: openAges.length,
      openInspections: openInspections.size,
      openDays: {
        max: openAges.length > 0 ? Math.max(...openAges) : 0,
        average: openAges.length > 0
          ? Number((openAges.reduce((sum, value) => sum + value, 0) / openAges.length).toFixed(1))
          : 0,
      },
      chartRows: Array.from(chartRowsByCompany.values())
        .sort((a, b) => b.closed + b.open - (a.closed + a.open))
        .slice(0, 8),
    };
  }

  async getOpenFindings(
    query: DashboardQuery = {},
    scope: InspectionDataScope = {},
  ): Promise<InspectionDashboardOpenFindingsResponse> {
    const [allInspections, allFindings, companies, areas] = await Promise.all([
      this.inspections.find(),
      this.findings.find(),
      this.companies.find(),
      this.areas.find(),
    ]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const filter = buildDashboardDateFilter(query);
    const now = new Date();
    const inspectionById = new Map(inspections.map((inspection, index) => [inspection.id, { inspection, index }]));
    const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
    const areaNameById = new Map(areas.map((area) => [area.id, area.name]));
    const rowsByInspection = new Map<string, InspectionDashboardOpenFindingRowResponse>();
    let severeOpenFindings = 0;

    findings.forEach((finding) => {
      if (!this.isOpenFinding(finding)) return;
      const inspectionEntry = inspectionById.get(finding.inspectionId);
      if (!inspectionEntry || !dashboardFindingMatches(finding, inspectionEntry.inspection, filter)) return;
      const { inspection, index } = inspectionEntry;
      const companyId = finding.responsibleCompanyId ?? inspection.companyId ?? null;
      const ageDays = this.daysBetween(finding.createdAt, now);
      const isSevere = this.isSevereFinding(finding);
      const current = rowsByInspection.get(inspection.id) ?? {
        inspectionId: inspection.id,
        inspectionNumber: this.resolveInspectionNumber(inspection, index),
        companyId,
        company: this.formatCompanyLabel(companyId, companyNameById),
        areaId: inspection.areaId,
        area: this.formatAreaLabel(inspection.areaId, areaNameById),
        ageDays: 0,
        openFindings: 0,
        severeOpenFindings: 0,
        hasSevereOpenFindings: false,
        maxSeverity: null,
        severityCounts: { severe: 0, moderate: 0, minor: 0 },
      };
      current.ageDays = Math.max(current.ageDays, ageDays);
      current.openFindings += 1;
      current.maxSeverity = this.resolveMaxSeverity(current.maxSeverity, finding.severity);
      if (isSevere) {
        current.severeOpenFindings += 1;
        current.hasSevereOpenFindings = true;
        current.severityCounts.severe += 1;
        severeOpenFindings += 1;
      } else if (finding.severity === InspectionFindingSeverity.MEDIUM) {
        current.severityCounts.moderate += 1;
      } else {
        current.severityCounts.minor += 1;
      }
      rowsByInspection.set(inspection.id, current);
    });

    return {
      severeOpenFindings,
      openInspections: rowsByInspection.size,
      rows: Array.from(rowsByInspection.values())
        .sort((a, b) =>
          Number(b.hasSevereOpenFindings) - Number(a.hasSevereOpenFindings)
          || b.ageDays - a.ageDays
          || b.openFindings - a.openFindings,
        )
        .slice(0, 20),
    };
  }

  private applyScope(
    inspections: InspectionEntity[],
    findings: InspectionFindingEntity[],
    scope: InspectionDataScope,
  ): { inspections: InspectionEntity[]; findings: InspectionFindingEntity[] } {
    if (scope.inspectionIds === undefined) return { inspections, findings };
    const allowedIds = new Set(scope.inspectionIds);
    return {
      inspections: inspections.filter((inspection) => allowedIds.has(inspection.id)),
      findings: findings.filter((finding) => allowedIds.has(finding.inspectionId)),
    };
  }

  private createInspectionStatusCounter(): Record<InspectionStatus, number> {
    return Object.values(InspectionStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<InspectionStatus, number>,
    );
  }

  private createFindingStatusCounter(): Record<InspectionFindingStatus, number> {
    return Object.values(InspectionFindingStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<InspectionFindingStatus, number>,
    );
  }

  private createFindingSeverityCounter(): Record<InspectionFindingSeverity, number> {
    return Object.values(InspectionFindingSeverity).reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<InspectionFindingSeverity, number>,
    );
  }

  private groupFindingsByInspection(findings: InspectionFindingEntity[]): Map<string, InspectionFindingEntity[]> {
    const grouped = new Map<string, InspectionFindingEntity[]>();
    findings.forEach((finding) => {
      if (finding.status === InspectionFindingStatus.CANCELLED) return;
      const current = grouped.get(finding.inspectionId) ?? [];
      current.push(finding);
      grouped.set(finding.inspectionId, current);
    });
    return grouped;
  }

  private isInspectionEffectivelyClosed(inspection: InspectionEntity, findings: InspectionFindingEntity[]): boolean {
    if (inspection.status === InspectionStatus.CANCELLED) return false;
    if (inspection.status === InspectionStatus.CLOSED) return true;
    return findings.length > 0 && findings.every((finding) => finding.status === InspectionFindingStatus.CLOSED);
  }

  private createObservationSummary(findings: InspectionFindingEntity[]): InspectionManagementTableObservationSummaryResponse {
    return findings.reduce((summary, finding) => {
      if (finding.status === InspectionFindingStatus.CLOSED) summary.closed += 1;
      else if (finding.status === InspectionFindingStatus.IN_PROGRESS) summary.executed += 1;
      else if (finding.status === InspectionFindingStatus.REJECTED) summary.rejected += 1;
      else summary.open += 1;
      return summary;
    }, { executed: 0, open: 0, closed: 0, rejected: 0 });
  }

  private buildManagementTableFilterOptions(
    rows: InspectionManagementTableRowResponse[],
  ): InspectionManagementTableFilterOptionsResponse {
    return {
      inspectors: this.uniqueSorted(rows.map((row) => row.inspector)),
      areas: this.uniqueSorted(rows.map((row) => row.areaSector)),
      companies: this.uniqueSorted(rows.map((row) => row.company)),
      types: this.uniqueSorted(rows.map((row) => row.type)),
      urgencies: this.uniqueSorted(rows.map((row) => row.urgencyLabel)),
    };
  }

  private uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es'));
  }

  private managementTableRowMatches(row: InspectionManagementTableRowResponse, query: ManagementTableQuery): boolean {
    if (!this.textMatches(`#${row.inspectionNumber}`, query.id)) return false;
    if (!this.textMatches(this.formatDateForFilter(row.date), query.date)) return false;
    if (!this.exactMatches(row.inspector, query.inspector)) return false;
    if (!this.exactMatches(row.areaSector, query.area)) return false;
    if (!this.exactMatches(row.company, query.company)) return false;
    if (!this.exactMatches(row.type, query.type)) return false;
    if (!this.exactMatches(row.urgencyLabel, query.urgency)) return false;
    if (!this.numberMatches(row.observationsCount, query.count, 'equals')) return false;
    if (!this.observationMatches(row.observations, query.obs)) return false;
    if (!this.numberMatches(row.daysOpen, query.daysMin, 'min')) return false;
    if (!this.numberMatches(row.daysOpen, query.daysMax, 'max')) return false;
    if (!this.numberMatches(row.closureRate, query.closure, 'equals')) return false;
    return true;
  }

  private textMatches(value: string, filter?: string): boolean {
    if (!filter?.trim()) return true;
    return this.normalizeSearch(value).includes(this.normalizeSearch(filter));
  }

  private exactMatches(value: string, filter?: string): boolean {
    if (!filter?.trim()) return true;
    return value === filter;
  }

  private observationMatches(
    observations: InspectionManagementTableObservationSummaryResponse,
    filter?: string,
  ): boolean {
    const filters = filter?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
    if (filters.length === 0) return true;
    return filters.some((value) => {
      if (value === 'executed') return observations.executed > 0;
      if (value === 'open') return observations.open > 0;
      if (value === 'closed') return observations.closed > 0;
      if (value === 'rejected') return observations.rejected > 0;
      return false;
    });
  }

  private numberMatches(
    value: number,
    filter: string | undefined,
    comparator: 'min' | 'max' | 'equals',
  ): boolean {
    if (!filter?.trim()) return true;
    const parsed = Number(filter.replace(',', '.'));
    if (Number.isNaN(parsed)) return true;
    if (comparator === 'min') return value >= parsed;
    if (comparator === 'max') return value <= parsed;
    return Math.round(value) === Math.round(parsed);
  }

  private normalizeSearch(value: string): string {
    return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private formatDateForFilter(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }

  private resolvePageSize(value?: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 10;
    return [10, 25, 50].includes(parsed) ? parsed : 10;
  }

  private resolvePage(value: string | undefined, totalPages: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.min(Math.floor(parsed), totalPages);
  }

  private resolveInspectionNumber(inspection: InspectionEntity, index: number): string {
    const match = inspection.title.match(/#?(\d+)/);
    return match?.[1] ?? String(index + 1).padStart(3, '0');
  }

  private formatInspectorLabel(user: UserEntity | null): string {
    if (!user) return 'Sin inspector';
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim();
    return initials ? `${user.firstName} ${initials.slice(-1)}.` : user.email;
  }

  private formatAreaSectorLabel(
    areaId: string | null,
    sectorId: string | null,
    areaNames: Map<string, string>,
    sectorNames: Map<string, string>,
  ): string {
    const area = areaId ? areaNames.get(areaId) : null;
    const sector = sectorId ? sectorNames.get(sectorId) : null;
    if (area && sector) return `${area} · ${sector}`;
    return area ?? sector ?? 'Sin área';
  }

  private formatAreaLabel(areaId: string | null, areaNames: Map<string, string>): string {
    return areaId ? areaNames.get(areaId) ?? 'Sin área' : 'Sin área';
  }

  private formatCompanyLabel(companyId: string | null, companyNames: Map<string, string>): string {
    return companyId ? companyNames.get(companyId) ?? 'Sin empresa' : 'Sin empresa';
  }

  private formatInspectionTypeLabel(
    inspection: InspectionEntity,
    type: InspectionTypeEntity | null,
    findingsCount: number,
  ): string {
    if (inspection.templateId) return 'Checklist normativo';
    if (!type) return findingsCount > 0 ? 'Hallazgo' : 'Checklist normativo';
    const label = `${type.code} ${type.name}`.toLowerCase();
    return label.includes('check') ? 'Checklist normativo' : 'Hallazgo';
  }

  private formatUrgencyLabel(inspection: InspectionEntity, severity: InspectionFindingSeverity | null): string {
    if (inspection.status === InspectionStatus.CLOSED) return 'Cerrada';
    if (!severity) return 'Abierta · Menor';
    const labelBySeverity: Record<InspectionFindingSeverity, string> = {
      [InspectionFindingSeverity.CRITICAL]: 'Grave',
      [InspectionFindingSeverity.HIGH]: 'Grave',
      [InspectionFindingSeverity.MEDIUM]: 'Moderado',
      [InspectionFindingSeverity.LOW]: 'Menor',
    };
    return `${inspection.status === InspectionStatus.UNDER_REVIEW ? 'Ejecutada' : 'Abierta'} · ${labelBySeverity[severity]}`;
  }

  private resolveMaxSeverity(
    current: InspectionFindingSeverity | null,
    next: InspectionFindingSeverity,
  ): InspectionFindingSeverity {
    return this.getUrgencyWeight(next) > this.getUrgencyWeight(current) ? next : current ?? next;
  }

  private getUrgencyWeight(severity: InspectionFindingSeverity | null): number {
    if (severity === InspectionFindingSeverity.CRITICAL) return 4;
    if (severity === InspectionFindingSeverity.HIGH) return 3;
    if (severity === InspectionFindingSeverity.MEDIUM) return 2;
    if (severity === InspectionFindingSeverity.LOW) return 1;
    return 0;
  }

  private isOpenFinding(finding: InspectionFindingEntity): boolean {
    return finding.status === InspectionFindingStatus.OPEN || finding.status === InspectionFindingStatus.IN_PROGRESS;
  }

  private isSevereFinding(finding: InspectionFindingEntity): boolean {
    return finding.severity === InspectionFindingSeverity.CRITICAL
      || finding.severity === InspectionFindingSeverity.HIGH;
  }

  private inspectionBelongsToYear(inspection: InspectionEntity, year: number): boolean {
    const date = getDashboardInspectionDate(inspection);
    return date ? date.getFullYear() === year : inspection.createdAt.getFullYear() === year;
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
