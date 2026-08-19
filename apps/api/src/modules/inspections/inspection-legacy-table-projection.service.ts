import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  InspectionManagementTableResponse,
  InspectionManagementTableRowResponse,
} from '@aurelia/contracts';
import { In, Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionEntity } from './entities/inspection.entity';
import { getDashboardInspectionDate } from './inspection-dashboard-period';

@Injectable()
export class InspectionLegacyTableProjectionService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
    @InjectRepository(InspectionLegacyImportEntity)
    private readonly legacyImports: Repository<InspectionLegacyImportEntity>,
  ) {}

  async project(response: InspectionManagementTableResponse): Promise<InspectionManagementTableResponse> {
    const inspectionIds = response.rows.map((row) => row.inspectionId);
    if (inspectionIds.length === 0) return response;

    const [inspections, legacyImports] = await Promise.all([
      this.inspections.findBy({ id: In(inspectionIds) }),
      this.legacyImports.findBy({ inspectionId: In(inspectionIds) }),
    ]);
    if (legacyImports.length === 0) return response;

    const inspectionById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const legacyByInspection = new Map(legacyImports.map((legacyImport) => [legacyImport.inspectionId, legacyImport]));
    const rows = response.rows.map((row) => {
      const legacyImport = legacyByInspection.get(row.inspectionId);
      const inspection = inspectionById.get(row.inspectionId);
      if (!legacyImport || !inspection) return row;
      return this.projectRow(row, inspection, legacyImport);
    });

    return {
      ...response,
      rows,
      filterOptions: {
        ...response.filterOptions,
        types: this.uniqueSorted([
          ...response.filterOptions.types,
          ...rows.map((row) => row.type),
        ]),
      },
    };
  }

  private projectRow(
    row: InspectionManagementTableRowResponse,
    inspection: InspectionEntity,
    legacyImport: InspectionLegacyImportEntity,
  ): InspectionManagementTableRowResponse {
    const total = Math.max(0, inspection.findingsCount);
    const open = Math.max(0, inspection.openFindingsCount);
    const closed = Math.max(0, total - open);
    const closureRate = total > 0 ? Number(((closed / total) * 100).toFixed(2)) : 0;
    const isClosed = open === 0 || inspection.status === 'closed';

    return {
      ...row,
      inspectionNumber: `${legacyImport.legacyYear}-${String(legacyImport.legacyNumber).padStart(3, '0')}`,
      type: legacyImport.legacyMode === InspectionLegacyMode.CHECKLIST ? 'Checklist' : 'Hallazgo',
      urgencyLabel: isClosed ? 'Cerrada' : 'Abierta · Histórica',
      urgencySeverity: null,
      rejectedUrgencyLabel: undefined,
      hasOverdueFindings: false,
      observationsCount: total,
      observations: {
        executed: 0,
        open,
        closed,
        rejected: 0,
      },
      daysOpen: this.resolveDays(inspection),
      closureRate,
      isLegacy: true,
      readOnly: true,
    };
  }

  private resolveDays(inspection: InspectionEntity): number {
    const start = getDashboardInspectionDate(inspection) ?? inspection.createdAt;
    const end = inspection.closedAt ?? inspection.completedAt ?? new Date();
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  }

  private uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right, 'es'));
  }
}
