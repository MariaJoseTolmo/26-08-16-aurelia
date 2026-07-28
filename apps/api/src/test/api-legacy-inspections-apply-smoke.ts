import { InspectionStatus } from '@aurelia/contracts';
import type { DataSource, EntityManager } from 'typeorm';
import { InspectionLegacyMode } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyApplyService } from '../modules/inspection-legacy-import/inspection-legacy-apply.service';
import { ValidatedLegacyInspection } from '../modules/inspection-legacy-import/inspection-legacy-resolution.types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function row(legacyNumber: number): ValidatedLegacyInspection {
  const inspector = {
    status: 'DIRECT_MATCH' as const,
    sourceValue: 'Karen Opazo S.',
    entityId: '11111111-1111-4111-8111-111111111111',
    entityName: 'Karen Opazo',
    proposedEmail: 'karen.opazo@goldfields.com',
  };
  const sector = {
    status: 'DIRECT_MATCH' as const,
    sourceValue: 'Planta Procesos',
    entityId: '22222222-2222-4222-8222-222222222222',
    entityName: 'Planta Procesos',
  };
  return {
    sourceSystem: 'legacy_environmental_inspections_spreadsheet',
    alreadyImportedInspectionId: null,
    finalDisposition: 'READY',
    validationMessages: [],
    normalized: {
      sourceRow: legacyNumber + 4,
      legacyYear: 2023,
      legacyNumber,
      inspectionDate: '2023-01-01',
      inspectorName: 'Karen Opazo S.',
      areaName: 'Construcción',
      companyName: 'Gold Fields',
      sectorName: 'Planta Procesos',
      detail: 'Inspección histórica',
      mode: InspectionLegacyMode.FINDING,
      status: InspectionStatus.CLOSED,
      findingsCount: 2,
      openFindingsCount: 0,
      closedFindingsCount: 2,
      completedAt: '2023-01-01',
      closedAt: '2023-01-05',
      milestones: [{
        sequenceNumber: 1,
        occurredAt: '2023-01-05',
        closedIncrement: 2,
        pendingAfter: 0,
        closedPercentage: 100,
        pendingPercentage: 0,
        rawPayload: { source: 'S1' },
      }],
      warnings: [],
      disposition: 'READY',
      rawPayload: { sourceRow: legacyNumber + 4 },
    },
    area: {
      status: 'DIRECT_MATCH',
      sourceValue: 'Construcción',
      entityId: '33333333-3333-4333-8333-333333333333',
      entityName: 'Construcción',
    },
    company: {
      status: 'DIRECT_MATCH',
      sourceValue: 'Gold Fields',
      entityId: '44444444-4444-4444-8444-444444444444',
      entityName: 'Gold Fields',
    },
    sector,
    sectors: [sector],
    inspector,
    inspectors: [inspector],
  };
}

async function main(): Promise<void> {
  const executedSql: string[] = [];
  let legacyLookupCount = 0;
  const manager = {
    query: async (sql: string): Promise<unknown[]> => {
      executedSql.push(sql.replace(/\s+/g, ' ').trim());
      if (sql.includes('FROM inspection_types')) {
        return [{ id: '55555555-5555-4555-8555-555555555555' }];
      }
      if (sql.includes('FROM inspection_legacy_imports') && sql.includes('SELECT inspection_id')) {
        legacyLookupCount += 1;
        return legacyLookupCount === 2
          ? [{ inspection_id: '66666666-6666-4666-8666-666666666666' }]
          : [];
      }
      if (sql.includes('INSERT INTO inspections')) {
        return [{ id: '77777777-7777-4777-8777-777777777777' }];
      }
      if (sql.includes('INSERT INTO inspection_legacy_imports')) {
        return [{ id: '88888888-8888-4888-8888-888888888888' }];
      }
      return [];
    },
  } as unknown as EntityManager;
  const dataSource = {
    transaction: async <T>(work: (transactionManager: EntityManager) => Promise<T>): Promise<T> => work(manager),
  } as unknown as DataSource;

  const service = new InspectionLegacyApplyService(dataSource);
  const result = await service.apply([row(1), row(2)]);

  assert(result.receivedRows === 2, 'Apply should receive two rows');
  assert(result.importedRows === 1, 'Apply should import one row');
  assert(result.alreadyImportedRows === 1, 'Apply should skip one existing row');
  assert(executedSql.some((sql) => sql.includes('INSERT INTO inspections')), 'Inspection insert missing');
  assert(executedSql.some((sql) => sql.includes('INSERT INTO inspection_legacy_imports')), 'Legacy import insert missing');
  assert(executedSql.some((sql) => sql.includes('INSERT INTO inspection_legacy_milestones')), 'Milestone insert missing');
  assert(executedSql.some((sql) => sql.includes('INSERT INTO inspection_legacy_participants')), 'Participant insert missing');
  assert(executedSql.some((sql) => sql.includes('INSERT INTO inspection_legacy_sector_links')), 'Sector link insert missing');
  assert(executedSql.some((sql) => sql.includes('INSERT INTO inspection_status_history')), 'Status history insert missing');

  console.log('Legacy inspections apply smoke test passed');
}

void main();
