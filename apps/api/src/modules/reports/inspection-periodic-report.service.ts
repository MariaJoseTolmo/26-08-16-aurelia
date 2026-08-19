import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionStatus,
  type InspectionPeriodicReportAttentionRowResponse,
  type InspectionPeriodicReportCompanyRowResponse,
  type InspectionPeriodicReportDistributionRowResponse,
  type InspectionPeriodicReportInspectionRowResponse,
  type InspectionPeriodicReportMonthRowResponse,
  type InspectionPeriodicReportRequest,
  type InspectionPeriodicReportResponse,
  type InspectionPeriodicReportState,
} from '@aurelia/contracts';
import { In, Not, Repository } from 'typeorm';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InspectionFindingEntity } from '../inspections/entities/inspection-finding.entity';
import { InspectionTypeEntity } from '../inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';
import { ReportPeriodService } from './report-period.service';
import { ReportScopeService } from './report-scope.service';

interface CompanyAccumulator {
  companyId: string | null;
  company: string;
  inspections: Set<string>;
  openInspections: Set<string>;
  totalFindings: number;
  closedFindings: number;
  pendingFindings: number;
  overdueFindings: number;
}

interface FindingBuckets {
  closed: number;
  executed: number;
  open: number;
  overdue: number;
}

@Injectable()
export class InspectionPeriodicReportService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
    @InjectRepository(SectorEntity)
    private readonly sectors: Repository<SectorEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InspectionTypeEntity)
    private readonly inspectionTypes: Repository<InspectionTypeEntity>,
    private readonly periods: ReportPeriodService,
    private readonly scopes: ReportScopeService,
  ) {}

  async build(request: InspectionPeriodicReportRequest, user: AccessTokenPayload): Promise<InspectionPeriodicReportResponse> {
    const period = this.periods.resolve(request);
    const scope = await this.scopes.resolveCompanyScope(user, request.companyId);
    const state = this.resolveState(request.inspectionState);

    const inspectionQuery = this.inspections
      .createQueryBuilder('inspection')
      .where('inspection.status != :cancelledStatus', { cancelledStatus: InspectionStatus.CANCELLED })
      .andWhere(
        'COALESCE(inspection.started_at, inspection.scheduled_at, inspection.created_at) >= :periodStart',
        { periodStart: period.start },
      )
      .andWhere(
        'COALESCE(inspection.started_at, inspection.scheduled_at, inspection.created_at) < :periodEnd',
        { periodEnd: period.end },
      )
      .orderBy('COALESCE(inspection.started_at, inspection.scheduled_at, inspection.created_at)', 'ASC');

    if (!scope.unrestricted) {
      if (scope.companyIds.length === 0) inspectionQuery.andWhere('1 = 0');
      else inspectionQuery.andWhere('inspection.company_id IN (:...companyIds)', { companyIds: scope.companyIds });
    }

    const candidateInspections = await inspectionQuery.getMany();
    const candidateInspectionIds = candidateInspections.map((inspection) => inspection.id);
    const candidateFindings = candidateInspectionIds.length > 0
      ? await this.findings.find({
          where: {
            inspectionId: In(candidateInspectionIds),
            status: Not(InspectionFindingStatus.CANCELLED),
          },
        })
      : [];

    const candidateFindingsByInspection = this.groupFindings(candidateFindings);
    const periodInspections = candidateInspections.filter((inspection) => {
      const closed = this.isEffectivelyClosed(inspection, candidateFindingsByInspection.get(inspection.id) ?? []);
      if (state === 'closed') return closed;
      if (state === 'open') return !closed;
      return true;
    });

    const selectedInspectionIds = new Set(periodInspections.map((inspection) => inspection.id));
    const selectedFindings = candidateFindings.filter((finding) => selectedInspectionIds.has(finding.inspectionId));
    const selectedFindingsByInspection = this.groupFindings(selectedFindings);

    const companyIds = this.uniqueIds([
      ...periodInspections.map((inspection) => inspection.companyId),
      ...selectedFindings.map((finding) => finding.responsibleCompanyId),
    ]);
    const areaIds = this.uniqueIds(periodInspections.map((inspection) => inspection.areaId));
    const sectorIds = this.uniqueIds(periodInspections.map((inspection) => inspection.sectorId));
    const userIds = this.uniqueIds(periodInspections.map((inspection) => inspection.inspectorId));
    const typeIds = this.uniqueIds(periodInspections.map((inspection) => inspection.inspectionTypeId));

    const [companies, areas, sectors, users, inspectionTypes] = await Promise.all([
      companyIds.length > 0 ? this.companies.findBy({ id: In(companyIds) }) : Promise.resolve([]),
      areaIds.length > 0 ? this.areas.findBy({ id: In(areaIds) }) : Promise.resolve([]),
      sectorIds.length > 0 ? this.sectors.findBy({ id: In(sectorIds) }) : Promise.resolve([]),
      userIds.length > 0 ? this.users.findBy({ id: In(userIds) }) : Promise.resolve([]),
      typeIds.length > 0 ? this.inspectionTypes.findBy({ id: In(typeIds) }) : Promise.resolve([]),
    ]);

    const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
    const areaNameById = new Map(areas.map((area) => [area.id, area.name]));
    const sectorNameById = new Map(sectors.map((sector) => [sector.id, sector.name]));
    const userById = new Map(users.map((entry) => [entry.id, entry]));
    const typeById = new Map(inspectionTypes.map((type) => [type.id, type]));
    const now = new Date();

    const rows = periodInspections.map((inspection, index) => this.buildInspectionRow(
      inspection,
      index,
      selectedFindingsByInspection.get(inspection.id) ?? [],
      now,
      companyNameById,
      areaNameById,
      sectorNameById,
      userById,
      typeById,
    ));

    const buckets = this.buildFindingBuckets(selectedFindings, now);
    const closedInspections = rows.filter((row) => row.effectiveStatus === 'closed').length;
    const complianceRate = selectedFindings.length > 0
      ? Number(((buckets.closed / selectedFindings.length) * 100).toFixed(2))
      : 0;
    const attentionRows = rows
      .filter((row) => row.effectiveStatus === 'open' && (
        row.overdueObservations > 0
        || row.maxSeverity === InspectionFindingSeverity.CRITICAL
        || row.maxSeverity === InspectionFindingSeverity.HIGH
      ))
      .sort((left, right) => (
        right.overdueObservations - left.overdueObservations
        || this.severityWeight(right.maxSeverity) - this.severityWeight(left.maxSeverity)
        || right.daysOpen - left.daysOpen
      ))
      .map<InspectionPeriodicReportAttentionRowResponse>((row) => ({ ...row, requiresImmediateAttention: true }));
    const inspectionsByArea = this.buildInspectionsByArea(periodInspections, areaNameById);

    return {
      metadata: {
        year: period.year,
        period: period.period,
        periodLabel: period.label,
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        inspectionState: state,
        companyId: !scope.unrestricted && scope.companyIds.length === 1
          ? scope.companyIds[0]
          : request.companyId ?? null,
        generatedAt: now.toISOString(),
        generatedBy: user.fullName,
      },
      summary: {
        totalInspections: rows.length,
        openInspections: rows.length - closedInspections,
        closedInspections,
        totalFindings: selectedFindings.length,
        openFindings: buckets.open,
        executedFindings: buckets.executed,
        pendingApprovalFindings: buckets.executed,
        closedFindings: buckets.closed,
        overdueFindings: buckets.overdue,
        complianceRate,
      },
      inspectionsByMonth: this.buildMonthlyDistribution(rows, period.months, period.year),
      inspectionsByType: this.buildDistribution(rows.map((row) => row.type)),
      inspectionsByArea,
      findingsByArea: inspectionsByArea,
      inspections: {
        total: rows.length,
        rows,
      },
      attention: {
        inspectionsCount: attentionRows.length,
        rows: attentionRows,
      },
      companiesWithMostPending: this.buildCompanyRows(
        periodInspections,
        selectedFindingsByInspection,
        now,
        companyNameById,
      ),
    };
  }

  private buildInspectionRow(
    inspection: InspectionEntity,
    index: number,
    findings: InspectionFindingEntity[],
    now: Date,
    companyNames: Map<string, string>,
    areaNames: Map<string, string>,
    sectorNames: Map<string, string>,
    users: Map<string, UserEntity>,
    types: Map<string, InspectionTypeEntity>,
  ): InspectionPeriodicReportInspectionRowResponse {
    const closed = this.isEffectivelyClosed(inspection, findings);
    const maxSeverity = findings.reduce<InspectionFindingSeverity | null>(
      (current, finding) => this.resolveMaxSeverity(current, finding.severity),
      null,
    );
    const buckets = this.buildFindingBuckets(findings, now);
    const date = this.getInspectionDate(inspection);
    const closureRate = findings.length > 0
      ? Number(((buckets.closed / findings.length) * 100).toFixed(2))
      : 0;
    const inspector = inspection.inspectorId ? users.get(inspection.inspectorId) : null;
    const type = types.get(inspection.inspectionTypeId);
    const hasExecutedFinding = findings.some((finding) => finding.status === InspectionFindingStatus.IN_PROGRESS);

    return {
      inspectionId: inspection.id,
      inspectionNumber: this.resolveInspectionNumber(inspection, index),
      date: date.toISOString(),
      inspector: inspector ? `${inspector.firstName} ${inspector.lastName}`.trim() : 'Sin inspector',
      areaSector: this.formatAreaSector(inspection.areaId, inspection.sectorId, areaNames, sectorNames),
      company: inspection.companyId ? companyNames.get(inspection.companyId) ?? 'Sin empresa' : 'Sin empresa',
      type: type?.name ?? 'Sin tipo',
      urgencyLabel: this.formatUrgencyLabel(closed, hasExecutedFinding, maxSeverity),
      maxSeverity,
      observationsCount: findings.length,
      closedObservations: buckets.closed,
      openObservations: buckets.open,
      executedObservations: buckets.executed,
      overdueObservations: buckets.overdue,
      closureRate,
      daysOpen: this.resolveDaysOpen(inspection, findings, now, closed),
      effectiveStatus: closed ? 'closed' : 'open',
    };
  }

  private buildFindingBuckets(findings: InspectionFindingEntity[], now: Date): FindingBuckets {
    return findings.reduce<FindingBuckets>((buckets, finding) => {
      if (finding.status === InspectionFindingStatus.CLOSED) buckets.closed += 1;
      else if (this.isOverdue(finding, now)) buckets.overdue += 1;
      else if (finding.status === InspectionFindingStatus.IN_PROGRESS) buckets.executed += 1;
      else buckets.open += 1;
      return buckets;
    }, { closed: 0, executed: 0, open: 0, overdue: 0 });
  }

  private buildMonthlyDistribution(
    rows: InspectionPeriodicReportInspectionRowResponse[],
    months: number[],
    year: number,
  ): InspectionPeriodicReportMonthRowResponse[] {
    return months.map((month) => {
      const count = rows.filter((row) => row.date && new Date(row.date).getUTCMonth() === month).length;
      const label = new Intl.DateTimeFormat('es-CL', { month: 'short', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month, 1)))
        .replace('.', '');
      return {
        key: String(month + 1),
        month: month + 1,
        label: `${label.charAt(0).toUpperCase()}${label.slice(1)}`,
        count,
        percentage: rows.length > 0 ? Number(((count / rows.length) * 100).toFixed(2)) : 0,
      };
    });
  }

  private buildDistribution(values: string[]): InspectionPeriodicReportDistributionRowResponse[] {
    const counts = values.reduce<Map<string, number>>(
      (map, value) => map.set(value, (map.get(value) ?? 0) + 1),
      new Map(),
    );
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        key: label,
        label,
        count,
        percentage: values.length > 0 ? Number(((count / values.length) * 100).toFixed(2)) : 0,
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'es'));
  }

  private buildInspectionsByArea(
    inspections: InspectionEntity[],
    areaNames: Map<string, string>,
  ): InspectionPeriodicReportDistributionRowResponse[] {
    const values = inspections.map((inspection) => (
      inspection.areaId ? areaNames.get(inspection.areaId) ?? 'Sin área' : 'Sin área'
    ));
    return this.buildDistribution(values).slice(0, 5);
  }

  private buildCompanyRows(
    inspections: InspectionEntity[],
    findingsByInspection: Map<string, InspectionFindingEntity[]>,
    now: Date,
    companyNames: Map<string, string>,
  ): InspectionPeriodicReportCompanyRowResponse[] {
    const accumulators = new Map<string, CompanyAccumulator>();
    for (const inspection of inspections) {
      for (const finding of findingsByInspection.get(inspection.id) ?? []) {
        const companyId = finding.responsibleCompanyId ?? inspection.companyId;
        const key = companyId ?? 'sin-empresa';
        const current = accumulators.get(key) ?? {
          companyId,
          company: companyId ? companyNames.get(companyId) ?? 'Sin empresa' : 'Sin empresa',
          inspections: new Set<string>(),
          openInspections: new Set<string>(),
          totalFindings: 0,
          closedFindings: 0,
          pendingFindings: 0,
          overdueFindings: 0,
        };
        current.inspections.add(inspection.id);
        current.totalFindings += 1;
        if (finding.status === InspectionFindingStatus.CLOSED) current.closedFindings += 1;
        else {
          current.pendingFindings += 1;
          current.openInspections.add(inspection.id);
        }
        if (this.isOverdue(finding, now)) current.overdueFindings += 1;
        accumulators.set(key, current);
      }
    }

    return Array.from(accumulators.values())
      .map((row) => ({
        companyId: row.companyId,
        company: row.company,
        inspectionsInPeriod: row.inspections.size,
        openInspections: row.openInspections.size,
        pendingFindings: row.pendingFindings,
        overdueFindings: row.overdueFindings,
        complianceRate: row.totalFindings > 0
          ? Number(((row.closedFindings / row.totalFindings) * 100).toFixed(2))
          : 0,
      }))
      .sort((left, right) => (
        right.pendingFindings - left.pendingFindings
        || right.overdueFindings - left.overdueFindings
        || left.company.localeCompare(right.company, 'es')
      ))
      .slice(0, 5);
  }

  private groupFindings(findings: InspectionFindingEntity[]): Map<string, InspectionFindingEntity[]> {
    const grouped = new Map<string, InspectionFindingEntity[]>();
    for (const finding of findings) {
      if (finding.status === InspectionFindingStatus.CANCELLED) continue;
      const current = grouped.get(finding.inspectionId) ?? [];
      current.push(finding);
      grouped.set(finding.inspectionId, current);
    }
    return grouped;
  }

  private uniqueIds(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
  }

  private resolveState(value?: string): InspectionPeriodicReportState {
    if (value === 'open' || value === 'closed') return value;
    return 'all';
  }

  private isEffectivelyClosed(inspection: InspectionEntity, findings: InspectionFindingEntity[]): boolean {
    if (inspection.status === InspectionStatus.CANCELLED) return false;
    if (inspection.status === InspectionStatus.CLOSED) return true;
    return findings.length > 0 && findings.every((finding) => finding.status === InspectionFindingStatus.CLOSED);
  }

  private getInspectionDate(inspection: InspectionEntity): Date {
    return inspection.startedAt ?? inspection.scheduledAt ?? inspection.createdAt;
  }

  private isOverdue(finding: InspectionFindingEntity, now: Date): boolean {
    return Boolean(
      finding.dueAt
      && finding.dueAt < now
      && finding.status !== InspectionFindingStatus.CLOSED
      && finding.status !== InspectionFindingStatus.CANCELLED,
    );
  }

  private resolveMaxSeverity(
    current: InspectionFindingSeverity | null,
    next: InspectionFindingSeverity,
  ): InspectionFindingSeverity {
    return this.severityWeight(next) > this.severityWeight(current) ? next : current ?? next;
  }

  private severityWeight(severity: InspectionFindingSeverity | null): number {
    if (severity === InspectionFindingSeverity.CRITICAL) return 4;
    if (severity === InspectionFindingSeverity.HIGH) return 3;
    if (severity === InspectionFindingSeverity.MEDIUM) return 2;
    if (severity === InspectionFindingSeverity.LOW) return 1;
    return 0;
  }

  private formatUrgencyLabel(
    closed: boolean,
    executed: boolean,
    severity: InspectionFindingSeverity | null,
  ): string {
    const state = closed ? 'Cerrada' : executed ? 'Ejecutada' : 'Abierta';
    const severityLabel = severity === InspectionFindingSeverity.CRITICAL
      ? 'Crítica'
      : severity === InspectionFindingSeverity.HIGH
        ? 'Grave'
        : severity === InspectionFindingSeverity.MEDIUM
          ? 'Moderada'
          : severity === InspectionFindingSeverity.LOW
            ? 'Menor'
            : 'Sin criticidad';
    return `${state} · ${severityLabel}`;
  }

  private formatAreaSector(
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

  private resolveInspectionNumber(inspection: InspectionEntity, index: number): string {
    const match = inspection.title.match(/#?(\d+)/);
    return match?.[1] ?? String(index + 1).padStart(3, '0');
  }

  private resolveDaysOpen(
    inspection: InspectionEntity,
    findings: InspectionFindingEntity[],
    now: Date,
    closed: boolean,
  ): number {
    const start = this.getInspectionDate(inspection);
    if (closed) {
      const end = inspection.closedAt ?? inspection.completedAt ?? inspection.updatedAt;
      return this.daysBetween(start, end);
    }
    const openFindings = findings.filter((finding) => (
      finding.status !== InspectionFindingStatus.CLOSED
      && finding.status !== InspectionFindingStatus.CANCELLED
    ));
    if (openFindings.length === 0) return this.daysBetween(start, now);
    return Math.max(...openFindings.map((finding) => this.daysBetween(finding.createdAt, now)));
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  }
}
