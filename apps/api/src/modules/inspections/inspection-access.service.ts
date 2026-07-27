import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InspectionDashboardSummaryResponse,
  InspectionFindingSeverity,
  InspectionFindingStatus,
  InspectionHistoryKpisResponse,
  InspectionResponse,
  InspectionStatus,
} from '@aurelia/contracts';
import { In, Repository } from 'typeorm';
import { ResourceScopeService } from '../access-control/resource-scope.service';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionFollowupEntity } from './entities/inspection-followup.entity';
import { InspectionEntity } from './entities/inspection.entity';

@Injectable()
export class InspectionAccessService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionFindingEntity)
    private readonly findings: Repository<InspectionFindingEntity>,
    @InjectRepository(InspectionFollowupEntity)
    private readonly followups: Repository<InspectionFollowupEntity>,
    private readonly resourceScope: ResourceScopeService,
  ) {}

  async assertInspection(user: AccessTokenPayload, inspectionId: string): Promise<InspectionEntity> {
    const inspection = await this.inspections.findOneBy({ id: inspectionId });
    if (!inspection) throw new NotFoundException(`Inspection ${inspectionId} not found`);
    await this.resourceScope.assertCanAccessInspection(user, inspection);
    return inspection;
  }

  async assertFinding(user: AccessTokenPayload, findingId: string): Promise<InspectionFindingEntity> {
    const finding = await this.findings.findOneBy({ id: findingId });
    if (!finding) throw new NotFoundException(`Inspection finding ${findingId} not found`);
    await this.assertInspection(user, finding.inspectionId);
    return finding;
  }

  async assertFollowup(user: AccessTokenPayload, followupId: string): Promise<InspectionFollowupEntity> {
    const followup = await this.followups.findOneBy({ id: followupId });
    if (!followup) throw new NotFoundException(`Inspection followup ${followupId} not found`);
    await this.assertFinding(user, followup.findingId);
    return followup;
  }

  async filterResponses(user: AccessTokenPayload, inspections: InspectionResponse[]): Promise<InspectionResponse[]> {
    return this.resourceScope.filterAllowedInspections(user, inspections);
  }

  async getScopedInspectionIds(user: AccessTokenPayload): Promise<string[]> {
    const inspections = await this.inspections.find({ select: { id: true, companyId: true, areaId: true } });
    const scopedInspections = await this.resourceScope.filterAllowedInspections(user, inspections);
    return scopedInspections.map((inspection) => inspection.id);
  }

  async getDashboardSummary(user: AccessTokenPayload): Promise<InspectionDashboardSummaryResponse> {
    const { inspections, findings } = await this.getScopedData(user);
    const byStatus = this.inspectionStatusCounter();
    const findingsByStatus = this.findingStatusCounter();
    const findingsBySeverity = this.findingSeverityCounter();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const inspection of inspections) byStatus[inspection.status] += 1;
    for (const finding of findings) {
      findingsByStatus[finding.status] += 1;
      findingsBySeverity[finding.severity] += 1;
    }

    const openFindings = findings.filter((finding) =>
      finding.status === InspectionFindingStatus.OPEN || finding.status === InspectionFindingStatus.IN_PROGRESS,
    );
    const overdue = openFindings.filter((finding) => finding.dueAt && finding.dueAt < now).length;
    const dueSoonNext7Days = openFindings.filter(
      (finding) => finding.dueAt && finding.dueAt >= now && finding.dueAt <= sevenDaysFromNow,
    ).length;
    const withOpenFindings = inspections.filter((inspection) => inspection.openFindingsCount > 0).length;
    const closedRate = inspections.length === 0
      ? 0
      : Number(((byStatus[InspectionStatus.CLOSED] / inspections.length) * 100).toFixed(2));

    return {
      inspections: {
        total: inspections.length,
        byStatus,
        withOpenFindings,
        closedRate,
      },
      findings: {
        total: findings.length,
        byStatus: findingsByStatus,
        bySeverity: findingsBySeverity,
        open: openFindings.length,
        overdue,
        dueSoonNext7Days,
      },
    };
  }

  async getHistoryKpis(user: AccessTokenPayload): Promise<InspectionHistoryKpisResponse> {
    const { inspections, findings } = await this.getScopedData(user);
    const findingsByInspection = new Map<string, InspectionFindingEntity[]>();
    for (const finding of findings) {
      if (finding.status === InspectionFindingStatus.CANCELLED) continue;
      const current = findingsByInspection.get(finding.inspectionId) ?? [];
      current.push(finding);
      findingsByInspection.set(finding.inspectionId, current);
    }

    const year = new Date().getFullYear();
    const closedInspections = inspections.filter((inspection) => {
      const inspectionFindings = findingsByInspection.get(inspection.id) ?? [];
      if (!this.isEffectivelyClosed(inspection, inspectionFindings)) return false;
      const closeDate = this.resolveCloseDate(inspection, inspectionFindings);
      return closeDate?.getFullYear() === year;
    });
    const closedInspectionIds = new Set(closedInspections.map((inspection) => inspection.id));
    const currentFindings = findings.filter(
      (finding) => closedInspectionIds.has(finding.inspectionId) && finding.status !== InspectionFindingStatus.CANCELLED,
    );
    const closedFindings = currentFindings.filter((finding) => finding.status === InspectionFindingStatus.CLOSED).length;
    const closureDays = closedInspections.map((inspection) => {
      const inspectionFindings = findingsByInspection.get(inspection.id) ?? [];
      const start = inspection.startedAt ?? inspection.scheduledAt ?? inspection.createdAt;
      const end = this.resolveCloseDate(inspection, inspectionFindings) ?? start;
      return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
    });
    const averageClosureDays = closureDays.length === 0
      ? 0
      : Number((closureDays.reduce((sum, value) => sum + value, 0) / closureDays.length).toFixed(1));
    const contractorCompanies = new Set(
      closedInspections.map((inspection) => inspection.companyId).filter((value): value is string => Boolean(value)),
    ).size;

    return {
      year,
      closedInspections: closedInspections.length,
      averageClosureDays,
      closedFindingsRate: currentFindings.length === 0
        ? 0
        : Number(((closedFindings / currentFindings.length) * 100).toFixed(2)),
      contractorCompanies,
    };
  }

  private async getScopedData(user: AccessTokenPayload): Promise<{ inspections: InspectionEntity[]; findings: InspectionFindingEntity[] }> {
    const allInspections = await this.inspections.find();
    const inspections = await this.resourceScope.filterAllowedInspections(user, allInspections);
    const inspectionIds = inspections.map((inspection) => inspection.id);
    const findings = inspectionIds.length === 0
      ? []
      : await this.findings.find({ where: { inspectionId: In(inspectionIds) } });
    return { inspections, findings };
  }

  private isEffectivelyClosed(inspection: InspectionEntity, findings: InspectionFindingEntity[]): boolean {
    if (inspection.status === InspectionStatus.CANCELLED) return false;
    if (inspection.status === InspectionStatus.CLOSED) return true;
    return findings.length > 0 && findings.every((finding) => finding.status === InspectionFindingStatus.CLOSED);
  }

  private resolveCloseDate(inspection: InspectionEntity, findings: InspectionFindingEntity[]): Date | null {
    const latestFindingClose = findings.reduce<Date | null>((latest, finding) => {
      if (!finding.closedAt) return latest;
      return !latest || finding.closedAt > latest ? finding.closedAt : latest;
    }, null);
    return inspection.closedAt ?? inspection.completedAt ?? latestFindingClose ?? inspection.updatedAt ?? null;
  }

  private inspectionStatusCounter(): Record<InspectionStatus, number> {
    return Object.values(InspectionStatus).reduce<Record<InspectionStatus, number>>((counter, status) => {
      counter[status] = 0;
      return counter;
    }, {} as Record<InspectionStatus, number>);
  }

  private findingStatusCounter(): Record<InspectionFindingStatus, number> {
    return Object.values(InspectionFindingStatus).reduce<Record<InspectionFindingStatus, number>>((counter, status) => {
      counter[status] = 0;
      return counter;
    }, {} as Record<InspectionFindingStatus, number>);
  }

  private findingSeverityCounter(): Record<InspectionFindingSeverity, number> {
    return Object.values(InspectionFindingSeverity).reduce<Record<InspectionFindingSeverity, number>>((counter, severity) => {
      counter[severity] = 0;
      return counter;
    }, {} as Record<InspectionFindingSeverity, number>);
  }
}
