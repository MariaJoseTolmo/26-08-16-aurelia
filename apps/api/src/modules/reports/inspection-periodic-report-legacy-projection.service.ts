import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  InspectionPeriodicReportCompanyRowResponse,
  InspectionPeriodicReportDistributionRowResponse,
  InspectionPeriodicReportInspectionRowResponse,
  InspectionPeriodicReportResponse,
} from '@aurelia/contracts';
import { In, Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';

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

@Injectable()
export class InspectionPeriodicReportLegacyProjectionService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionLegacyImportEntity)
    private readonly legacyImports: Repository<InspectionLegacyImportEntity>,
  ) {}

  async project(report: InspectionPeriodicReportResponse): Promise<InspectionPeriodicReportResponse> {
    const inspectionIds = report.inspections.rows.map((row) => row.inspectionId);
    if (inspectionIds.length === 0) return report;

    const [inspections, legacyImports] = await Promise.all([
      this.inspections.findBy({ id: In(inspectionIds) }),
      this.legacyImports.findBy({ inspectionId: In(inspectionIds) }),
    ]);
    if (legacyImports.length === 0) return report;

    const inspectionById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const legacyByInspection = new Map(legacyImports.map((legacyImport) => [legacyImport.inspectionId, legacyImport]));
    const rows = report.inspections.rows.map((row) => {
      const inspection = inspectionById.get(row.inspectionId);
      const legacyImport = legacyByInspection.get(row.inspectionId);
      if (!inspection || !legacyImport) return row;
      return this.projectRow(row, inspection, legacyImport);
    });

    const totalFindings = rows.reduce((total, row) => total + row.observationsCount, 0);
    const closedFindings = rows.reduce((total, row) => total + row.closedObservations, 0);
    const openFindings = rows.reduce((total, row) => total + row.openObservations, 0);
    const executedFindings = rows.reduce((total, row) => total + row.executedObservations, 0);
    const overdueFindings = rows.reduce((total, row) => total + row.overdueObservations, 0);
    const closedInspections = rows.filter((row) => row.effectiveStatus === 'closed').length;

    return {
      ...report,
      summary: {
        ...report.summary,
        totalInspections: rows.length,
        openInspections: rows.length - closedInspections,
        closedInspections,
        totalFindings,
        openFindings,
        executedFindings,
        pendingApprovalFindings: executedFindings,
        closedFindings,
        overdueFindings,
        complianceRate: totalFindings > 0
          ? Number(((closedFindings / totalFindings) * 100).toFixed(2))
          : 0,
      },
      inspectionsByType: this.buildDistribution(rows.map((row) => row.type)),
      inspectionsByArea: this.buildAreaDistribution(rows, false),
      findingsByArea: this.buildAreaDistribution(rows, true),
      inspections: {
        total: rows.length,
        rows,
      },
      companiesWithMostPending: this.buildCompanyRows(rows, inspectionById),
    };
  }

  private projectRow(
    row: InspectionPeriodicReportInspectionRowResponse,
    inspection: InspectionEntity,
    legacyImport: InspectionLegacyImportEntity,
  ): InspectionPeriodicReportInspectionRowResponse {
    const total = Math.max(0, inspection.findingsCount);
    const open = Math.max(0, Math.min(total, inspection.openFindingsCount));
    const closed = Math.max(0, total - open);
    const closureRate = total > 0 ? Number(((closed / total) * 100).toFixed(2)) : 0;
    const areaSector = [legacyImport.legacyAreaName, legacyImport.legacySectorName]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .join(' · ');

    return {
      ...row,
      inspectionNumber: `${legacyImport.legacyYear}-${String(legacyImport.legacyNumber).padStart(3, '0')}`,
      inspector: legacyImport.legacyInspectorName?.trim() || row.inspector,
      areaSector: areaSector || row.areaSector,
      company: legacyImport.legacyCompanyName?.trim() || row.company,
      type: legacyImport.legacyMode === InspectionLegacyMode.CHECKLIST ? 'Checklist' : 'Hallazgo',
      urgencyLabel: row.effectiveStatus === 'closed' ? 'Cerrada · Sin criticidad' : 'Abierta · Sin criticidad',
      maxSeverity: null,
      observationsCount: total,
      closedObservations: closed,
      openObservations: open,
      executedObservations: 0,
      overdueObservations: 0,
      closureRate,
    };
  }

  private buildCompanyRows(
    rows: InspectionPeriodicReportInspectionRowResponse[],
    inspectionById: Map<string, InspectionEntity>,
  ): InspectionPeriodicReportCompanyRowResponse[] {
    const accumulators = new Map<string, CompanyAccumulator>();

    for (const row of rows) {
      const inspection = inspectionById.get(row.inspectionId);
      const companyId = inspection?.companyId ?? null;
      const company = row.company.trim() || 'Sin empresa';
      const key = companyId ?? company.toLocaleLowerCase('es');
      const current = accumulators.get(key) ?? {
        companyId,
        company,
        inspections: new Set<string>(),
        openInspections: new Set<string>(),
        totalFindings: 0,
        closedFindings: 0,
        pendingFindings: 0,
        overdueFindings: 0,
      };

      current.inspections.add(row.inspectionId);
      if (row.effectiveStatus === 'open') current.openInspections.add(row.inspectionId);
      current.totalFindings += row.observationsCount;
      current.closedFindings += row.closedObservations;
      current.pendingFindings += row.openObservations + row.executedObservations + row.overdueObservations;
      current.overdueFindings += row.overdueObservations;
      accumulators.set(key, current);
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
        || right.inspectionsInPeriod - left.inspectionsInPeriod
        || left.company.localeCompare(right.company, 'es')
      ))
      .slice(0, 5);
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

  private buildAreaDistribution(
    rows: InspectionPeriodicReportInspectionRowResponse[],
    weightByFindings: boolean,
  ): InspectionPeriodicReportDistributionRowResponse[] {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const area = row.areaSector.split(' · ')[0]?.trim() || 'Sin área';
      const increment = weightByFindings ? row.observationsCount : 1;
      counts.set(area, (counts.get(area) ?? 0) + increment);
    }
    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        key: label,
        label,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'es'))
      .slice(0, 5);
  }
}
