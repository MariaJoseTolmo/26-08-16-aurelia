import 'reflect-metadata';
import type { InspectionPeriodicReportResponse } from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import { InspectionPeriodicReportLegacyProjectionService } from '../modules/reports/inspection-periodic-report-legacy-projection.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const legacyInspectionId = '11111111-1111-4111-8111-111111111111';
  const nativeInspectionId = '22222222-2222-4222-8222-222222222222';
  const legacyInspection = {
    id: legacyInspectionId,
    findingsCount: 7,
    openFindingsCount: 0,
  } as InspectionEntity;
  const legacyImport = {
    inspectionId: legacyInspectionId,
    legacyYear: 2026,
    legacyNumber: 42,
    legacyMode: InspectionLegacyMode.FINDING,
    legacyInspectorName: 'Karen Opazo',
    legacyAreaName: 'Servicios Generales',
    legacySectorName: 'Campamento',
    legacyCompanyName: 'AGGREKO',
  } as InspectionLegacyImportEntity;

  const inspectionsRepository = {
    findBy: async () => [legacyInspection],
  } as unknown as Repository<InspectionEntity>;
  const legacyImportsRepository = {
    findBy: async () => [legacyImport],
  } as unknown as Repository<InspectionLegacyImportEntity>;
  const service = new InspectionPeriodicReportLegacyProjectionService(
    inspectionsRepository,
    legacyImportsRepository,
  );

  const report = {
    metadata: {
      year: 2026,
      period: 'year',
      periodLabel: 'Todo el año',
      start: '2026-01-01T00:00:00.000Z',
      end: '2027-01-01T00:00:00.000Z',
      inspectionState: 'closed',
      companyId: null,
      generatedAt: '2026-07-30T00:00:00.000Z',
      generatedBy: 'Admin Aurelia',
    },
    summary: {
      totalInspections: 2,
      openInspections: 0,
      closedInspections: 2,
      totalFindings: 2,
      openFindings: 0,
      executedFindings: 0,
      pendingApprovalFindings: 0,
      closedFindings: 2,
      overdueFindings: 0,
      complianceRate: 100,
    },
    inspectionsByMonth: [],
    inspectionsByType: [],
    inspectionsByArea: [],
    findingsByArea: [],
    inspections: {
      total: 2,
      rows: [
        {
          inspectionId: nativeInspectionId,
          inspectionNumber: '17',
          date: '2026-07-17T00:00:00.000Z',
          inspector: 'Carlos Aguirre',
          areaSector: 'Medio Ambiente · PTAS',
          company: 'Gold Fields',
          type: 'Checklist',
          urgencyLabel: 'Cerrada · Alta',
          maxSeverity: 'high',
          observationsCount: 2,
          closedObservations: 2,
          openObservations: 0,
          executedObservations: 0,
          overdueObservations: 0,
          closureRate: 100,
          daysOpen: 9,
          effectiveStatus: 'closed',
        },
        {
          inspectionId: legacyInspectionId,
          inspectionNumber: '2',
          date: '2026-02-07T00:00:00.000Z',
          inspector: 'Sin inspector',
          areaSector: 'Área homologada · Sector homologado',
          company: 'Empresa homologada',
          type: 'Ambiental',
          urgencyLabel: 'Cerrada · Sin criticidad',
          maxSeverity: null,
          observationsCount: 0,
          closedObservations: 0,
          openObservations: 0,
          executedObservations: 0,
          overdueObservations: 0,
          closureRate: 0,
          daysOpen: 12,
          effectiveStatus: 'closed',
        },
      ],
    },
    attention: {
      inspectionsCount: 0,
      rows: [],
    },
    companiesWithMostPending: [],
  } as unknown as InspectionPeriodicReportResponse;

  const projected = await service.project(report);
  const nativeRow = projected.inspections.rows.find((row) => row.inspectionId === nativeInspectionId);
  const legacyRow = projected.inspections.rows.find((row) => row.inspectionId === legacyInspectionId);

  assert(nativeRow?.observationsCount === 2, 'Native inspection must keep its real observations');
  assert(legacyRow?.inspectionNumber === '2026-042', 'Legacy report must preserve the historical key');
  assert(legacyRow?.observationsCount === 7, 'Legacy report must use findings_count');
  assert(legacyRow?.closedObservations === 7, 'Legacy closed observations must be derived from aggregate counters');
  assert(legacyRow?.closureRate === 100, 'Legacy closure rate must be reconstructed');
  assert(legacyRow?.inspector === 'Karen Opazo', 'Legacy report must preserve the original inspector');
  assert(legacyRow?.areaSector === 'Servicios Generales · Campamento', 'Legacy report must preserve original area and sector');
  assert(legacyRow?.company === 'AGGREKO', 'Legacy report must preserve the original company');
  assert(legacyRow?.type === 'Hallazgo', 'Legacy report must preserve its restored mode');
  assert(projected.summary.totalFindings === 9, 'Report summary must combine native and legacy observations');
  assert(projected.summary.closedFindings === 9, 'Report summary must combine all closed observations');
  assert(projected.summary.complianceRate === 100, 'Combined report compliance must be recalculated');
  assert(projected.inspectionsByType.some((row) => row.label === 'Hallazgo' && row.count === 1), 'Type distribution must include legacy rows');
  assert(projected.findingsByArea.some((row) => row.label === 'Servicios Generales' && row.count === 7), 'Area findings distribution must include legacy counters');

  console.log('Legacy inspection periodic report projection smoke test passed');
}

void main();
