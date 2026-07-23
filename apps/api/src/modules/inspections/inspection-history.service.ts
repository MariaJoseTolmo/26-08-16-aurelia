import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionFindingSeverity, InspectionFindingStatus, InspectionStatus } from '@aurelia/contracts';
import type {
  InspectionHistoryKpisResponse,
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
import { getDashboardInspectionDate } from './inspection-dashboard-period';
import type { InspectionDataScope, ManagementTableQuery } from './inspection-dashboard.service';

@Injectable()
export class InspectionHistoryService {
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

  async getHistoryKpis(scope: InspectionDataScope = {}): Promise<InspectionHistoryKpisResponse> {
    const [allInspections, allFindings] = await Promise.all([this.inspections.find(), this.findings.find()]);
    const { inspections, findings } = this.applyScope(allInspections, allFindings, scope);
    const findingsByInspection = this.groupFindingsByInspection(findings);
    const year = new Date().getFullYear();
    const closedInspections = inspections.filter((inspection) =>
      this.isClosedInspectionInYear(inspection, findingsByInspection.get(inspection.id) ?? [], year),
    );
    const closedInspectionIds = new Set(closedInspections.map((inspection) => inspection.id));
    const currentFindings = findings.filter((finding) =>
      closedInspectionIds.has(finding.inspectionId)
      && finding.status !== InspectionFindingStatus.CANCELLED,
    );
    const closedFindings = currentFindings.filter((finding) => finding.status === InspectionFindingStatus.CLOSED).length;
    const closureDays = closedInspections.map((inspection) =>
      this.resolveClosureDays(inspection, findingsByInspection.get(inspection.id) ?? []),
    );
    const validClosureDays = closureDays.filter((value) => Number.isFinite(value));
    const averageClosureDays = validClosureDays.length > 0
      ? Number((validClosureDays.reduce((sum, value) => sum + value, 0) / validClosureDays.length).toFixed(1))
      : 0;
    const contractorCompanies = new Set(
      closedInspections
        .map((inspection) => inspection.companyId)
        .filter((value): value is string => Boolean(value)),
    ).size;

    return {
      year,
      closedInspections: closedInspections.length,
      averageClosureDays,
      closedFindingsRate: currentFindings.length > 0
        ? Number(((closedFindings / currentFindings.length) * 100).toFixed(2))
        : 0,
      contractorCompanies,
    };
  }

  async getHistoryTable(
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
    const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
    const areaNameById = new Map(areas.map((area) => [area.id, area.name]));
    const sectorNameById = new Map(sectors.map((sector) => [sector.id, sector.name]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const typeById = new Map(inspectionTypes.map((type) => [type.id, type]));
    const findingsByInspection = this.groupFindingsByInspection(findings);

    const closedInspections = inspections.filter((inspection) =>
      this.isInspectionEffectivelyClosed(inspection, findingsByInspection.get(inspection.id) ?? []),
    );
    const rows = closedInspections.map((inspection, index) => {
      const inspectionFindings = findingsByInspection.get(inspection.id) ?? [];
      const observations = this.createObservationSummary(inspectionFindings);
      const maxSeverity = inspectionFindings.reduce<InspectionFindingSeverity | null>(
        (current, finding) => this.resolveMaxSeverity(current, finding.severity),
        null,
      );
      const closeDate = this.resolveCloseDate(inspection, inspectionFindings);
      const closureRate = inspectionFindings.length > 0
        ? Number(((observations.closed / inspectionFindings.length) * 100).toFixed(2))
        : 0;

      return {
        inspectionId: inspection.id,
        inspectionNumber: this.resolveInspectionNumber(inspection, index),
        date: closeDate ? closeDate.toISOString() : null,
        inspector: this.formatInspectorLabel(userById.get(inspection.inspectorId ?? '') ?? null),
        areaSector: this.formatAreaSectorLabel(inspection.areaId, inspection.sectorId, areaNameById, sectorNameById),
        company: this.formatCompanyLabel(inspection.companyId, companyNameById),
        type: this.formatInspectionTypeLabel(
          inspection,
          typeById.get(inspection.inspectionTypeId) ?? null,
          inspectionFindings.length,
        ),
        urgencyLabel: this.formatHistoryUrgencyLabel(maxSeverity),
        urgencySeverity: maxSeverity,
        observationsCount: inspectionFindings.length,
        observations,
        daysOpen: this.resolveClosureDays(inspection, inspectionFindings),
        closureRate,
      };
    }).sort((left, right) => this.parseDate(right.date) - this.parseDate(left.date));
    const pageSize = this.resolvePageSize(query.pageSize);
    const filteredRows = rows.filter((row) => this.tableRowMatches(row, query));
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const page = this.resolvePage(query.page, totalPages);
    const start = (page - 1) * pageSize;

    return {
      page,
      pageSize,
      total: filteredRows.length,
      totalPages,
      rows: filteredRows.slice(start, start + pageSize),
      filterOptions: this.buildFilterOptions(rows),
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

  private isClosedInspectionInYear(
    inspection: InspectionEntity,
    findings: InspectionFindingEntity[],
    year: number,
  ): boolean {
    if (!this.isInspectionEffectivelyClosed(inspection, findings)) return false;
    const closeDate = this.resolveCloseDate(inspection, findings);
    return Boolean(closeDate && closeDate.getFullYear() === year);
  }

  private isInspectionEffectivelyClosed(inspection: InspectionEntity, findings: InspectionFindingEntity[]): boolean {
    if (inspection.status === InspectionStatus.CANCELLED) return false;
    if (inspection.status === InspectionStatus.CLOSED) return true;
    return findings.length > 0 && findings.every((finding) => finding.status === InspectionFindingStatus.CLOSED);
  }

  private resolveCloseDate(inspection: InspectionEntity, findings: InspectionFindingEntity[]): Date | null {
    const latestFindingClose = findings.reduce<Date | null>((current, finding) => {
      if (!finding.closedAt) return current;
      return !current || finding.closedAt > current ? finding.closedAt : current;
    }, null);
    return inspection.closedAt
      ?? inspection.completedAt
      ?? latestFindingClose
      ?? inspection.updatedAt
      ?? getDashboardInspectionDate(inspection)
      ?? null;
  }

  private resolveClosureDays(inspection: InspectionEntity, findings: InspectionFindingEntity[]): number {
    const startDate = getDashboardInspectionDate(inspection) ?? inspection.createdAt;
    const closeDate = this.resolveCloseDate(inspection, findings) ?? startDate;
    return this.daysBetween(startDate, closeDate);
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

  private createObservationSummary(findings: InspectionFindingEntity[]): InspectionManagementTableObservationSummaryResponse {
    return findings.reduce((summary, finding) => {
      if (finding.status === InspectionFindingStatus.CLOSED) summary.closed += 1;
      else if (finding.status === InspectionFindingStatus.IN_PROGRESS) summary.executed += 1;
      else if (finding.status === InspectionFindingStatus.REJECTED) summary.rejected += 1;
      else summary.open += 1;
      return summary;
    }, { executed: 0, open: 0, closed: 0, rejected: 0 });
  }

  private buildFilterOptions(rows: InspectionManagementTableRowResponse[]): InspectionManagementTableFilterOptionsResponse {
    return {
      inspectors: this.uniqueSorted(rows.map((row) => row.inspector)),
      areas: this.uniqueSorted(rows.map((row) => row.areaSector)),
      companies: this.uniqueSorted(rows.map((row) => row.company)),
      types: this.uniqueSorted(rows.map((row) => row.type)),
      urgencies: this.uniqueSorted(rows.map((row) => row.urgencyLabel)),
    };
  }

  private tableRowMatches(row: InspectionManagementTableRowResponse, query: ManagementTableQuery): boolean {
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

  private textMatches(value: string, filter?: string): boolean {
    if (!filter?.trim()) return true;
    return this.normalizeSearch(value).includes(this.normalizeSearch(filter));
  }

  private exactMatches(value: string, filter?: string): boolean {
    if (!filter?.trim()) return true;
    return value === filter;
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

  private formatHistoryUrgencyLabel(severity: InspectionFindingSeverity | null): string {
    if (!severity) return 'Cerrada';
    const labelBySeverity: Record<InspectionFindingSeverity, string> = {
      [InspectionFindingSeverity.CRITICAL]: 'Crítico',
      [InspectionFindingSeverity.HIGH]: 'Alto',
      [InspectionFindingSeverity.MEDIUM]: 'Medio',
      [InspectionFindingSeverity.LOW]: 'Bajo',
    };
    return `Cerrada · ${labelBySeverity[severity]}`;
  }

  private resolveMaxSeverity(
    current: InspectionFindingSeverity | null,
    next: InspectionFindingSeverity,
  ): InspectionFindingSeverity {
    if (!current) return next;
    return this.getUrgencyWeight(next) > this.getUrgencyWeight(current) ? next : current;
  }

  private getUrgencyWeight(value: InspectionFindingSeverity | null): number {
    if (value === InspectionFindingSeverity.CRITICAL) return 4;
    if (value === InspectionFindingSeverity.HIGH) return 3;
    if (value === InspectionFindingSeverity.MEDIUM) return 2;
    if (value === InspectionFindingSeverity.LOW) return 1;
    return 0;
  }

  private daysBetween(start: Date, end: Date): number {
    const milliseconds = Math.max(0, end.getTime() - start.getTime());
    return Math.max(0, Math.ceil(milliseconds / 86_400_000));
  }

  private uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es'));
  }

  private parseDate(value: string | null): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}
