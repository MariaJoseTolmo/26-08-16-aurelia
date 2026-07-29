import 'reflect-metadata';
import type { InspectionManagementTableResponse } from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import { InspectionLegacyTableProjectionService } from '../modules/inspections/inspection-legacy-table-projection.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const inspectionId = '11111111-1111-4111-8111-111111111111';
  const inspection = {
    id: inspectionId,
    status: 'closed',
    findingsCount: 7,
    openFindingsCount: 0,
    startedAt: new Date('2026-01-01T12:00:00.000Z'),
    completedAt: new Date('2026-01-05T12:00:00.000Z'),
    closedAt: new Date('2026-01-05T12:00:00.000Z'),
    createdAt: new Date('2026-01-01T12:00:00.000Z'),
  } as InspectionEntity;
  const legacyImport = {
    inspectionId,
    legacyYear: 2026,
    legacyNumber: 42,
    legacyMode: InspectionLegacyMode.FINDING,
  } as InspectionLegacyImportEntity;

  const inspectionsRepository = {
    findBy: async () => [inspection],
  } as unknown as Repository<InspectionEntity>;
  const legacyImportsRepository = {
    findBy: async () => [legacyImport],
  } as unknown as Repository<InspectionLegacyImportEntity>;

  const service = new InspectionLegacyTableProjectionService(
    inspectionsRepository,
    legacyImportsRepository,
  );
  const response = {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    rows: [{
      inspectionId,
      inspectionNumber: 'INS-001',
      date: '2026-01-05T12:00:00.000Z',
      inspector: 'Karen O.',
      areaSector: 'Planta Procesos · Barrio Cívico',
      company: 'AGGREKO',
      type: 'Hallazgo',
      urgencyLabel: 'Cerrada',
      urgencySeverity: null,
      observationsCount: 0,
      observations: {
        executed: 0,
        open: 0,
        closed: 0,
        rejected: 0,
      },
      daysOpen: 0,
      closureRate: 0,
    }],
    filterOptions: {
      inspectors: [],
      areas: [],
      companies: [],
      types: [],
      urgencies: [],
      observationStatuses: [],
    },
  } as unknown as InspectionManagementTableResponse;

  const projected = await service.project(response);
  const projectedRow = projected.rows[0];

  assert(projectedRow.observationsCount === 7, 'Legacy total observations should come from findings_count');
  assert(projectedRow.observations.open === 0, 'Legacy open observations should come from open_findings_count');
  assert(projectedRow.observations.closed === 7, 'Legacy closed observations should be total minus open');
  assert(projectedRow.closureRate === 100, 'Legacy closure rate should be calculated from aggregate counters');
  assert(projectedRow.inspectionNumber === '2026-042', 'Legacy inspection number should preserve the historical key');
  assert(projectedRow.isLegacy === true, 'Projected row should be marked as legacy');
  assert(projectedRow.readOnly === true, 'Projected row should remain read-only');

  console.log('Legacy inspections table projection smoke test passed');
}

void main();
