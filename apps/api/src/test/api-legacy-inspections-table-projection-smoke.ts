import 'reflect-metadata';
import { InspectionStatus, type InspectionManagementTableResponse } from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { AreaEntity } from '../modules/organization/entities/area.entity';
import { CompanyEntity } from '../modules/organization/entities/company.entity';
import { SectorEntity } from '../modules/organization/entities/sector.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { InspectionFindingEntity } from '../modules/inspections/entities/inspection-finding.entity';
import { InspectionTypeEntity } from '../modules/inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import { InspectionHistoryService } from '../modules/inspections/inspection-history.service';
import { InspectionLegacyTableProjectionService } from '../modules/inspections/inspection-legacy-table-projection.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const year = new Date().getFullYear();
  const inspectionId = '11111111-1111-4111-8111-111111111111';
  const companyId = '22222222-2222-4222-8222-222222222222';
  const areaId = '33333333-3333-4333-8333-333333333333';
  const sectorId = '44444444-4444-4444-8444-444444444444';
  const inspectorId = '55555555-5555-4555-8555-555555555555';
  const inspectionTypeId = '66666666-6666-4666-8666-666666666666';
  const startedAt = new Date(`${year}-01-01T12:00:00.000Z`);
  const closedAt = new Date(`${year}-01-05T12:00:00.000Z`);
  const inspection = {
    id: inspectionId,
    status: InspectionStatus.CLOSED,
    findingsCount: 7,
    openFindingsCount: 0,
    startedAt,
    scheduledAt: startedAt,
    completedAt: closedAt,
    closedAt,
    createdAt: startedAt,
    updatedAt: closedAt,
    companyId,
    areaId,
    sectorId,
    inspectorId,
    inspectionTypeId,
    templateId: null,
    title: 'Inspección histórica restaurada',
  } as InspectionEntity;
  const legacyImport = {
    inspectionId,
    legacyYear: year,
    legacyNumber: 42,
    legacyMode: InspectionLegacyMode.FINDING,
  } as InspectionLegacyImportEntity;
  const company = { id: companyId, name: 'AGGREKO' } as CompanyEntity;
  const area = { id: areaId, name: 'Planta Procesos' } as AreaEntity;
  const sector = { id: sectorId, name: 'Barrio Cívico' } as SectorEntity;
  const inspector = {
    id: inspectorId,
    firstName: 'Karen',
    lastName: 'Opazo',
    email: 'karen.opazo@goldfields.com',
  } as UserEntity;
  const inspectionType = {
    id: inspectionTypeId,
    code: 'environmental',
    name: 'Ambiental',
  } as InspectionTypeEntity;

  const inspectionsRepository = {
    find: async () => [inspection],
    findBy: async () => [inspection],
  } as unknown as Repository<InspectionEntity>;
  const findingsRepository = {
    find: async () => [],
  } as unknown as Repository<InspectionFindingEntity>;
  const legacyImportsRepository = {
    find: async () => [legacyImport],
    findBy: async () => [legacyImport],
  } as unknown as Repository<InspectionLegacyImportEntity>;
  const areasRepository = {
    find: async () => [area],
  } as unknown as Repository<AreaEntity>;
  const companiesRepository = {
    find: async () => [company],
  } as unknown as Repository<CompanyEntity>;
  const sectorsRepository = {
    find: async () => [sector],
  } as unknown as Repository<SectorEntity>;
  const usersRepository = {
    find: async () => [inspector],
  } as unknown as Repository<UserEntity>;
  const inspectionTypesRepository = {
    find: async () => [inspectionType],
  } as unknown as Repository<InspectionTypeEntity>;

  const historyService = new InspectionHistoryService(
    inspectionsRepository,
    findingsRepository,
    legacyImportsRepository,
    areasRepository,
    companiesRepository,
    sectorsRepository,
    usersRepository,
    inspectionTypesRepository,
  );
  const history = await historyService.getHistoryTable({
    count: '7',
    obs: 'closed',
    closure: '100',
  });
  const historyRow = history.rows[0];

  assert(history.total === 1, 'Legacy row should survive aggregate observation filters');
  assert(historyRow.observationsCount === 7, 'History should use findings_count before pagination');
  assert(historyRow.observations.closed === 7, 'History should derive closed legacy observations');
  assert(historyRow.closureRate === 100, 'History should calculate aggregate legacy closure rate');

  const kpis = await historyService.getHistoryKpis();
  assert(kpis.closedFindingsRate === 100, 'History KPI should include aggregate legacy observations');

  const projectionService = new InspectionLegacyTableProjectionService(
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
      date: closedAt.toISOString(),
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

  const projected = await projectionService.project(response);
  const projectedRow = projected.rows[0];

  assert(projectedRow.observationsCount === 7, 'Legacy total observations should come from findings_count');
  assert(projectedRow.observations.open === 0, 'Legacy open observations should come from open_findings_count');
  assert(projectedRow.observations.closed === 7, 'Legacy closed observations should be total minus open');
  assert(projectedRow.closureRate === 100, 'Legacy closure rate should be calculated from aggregate counters');
  assert(projectedRow.inspectionNumber === `${year}-042`, 'Legacy inspection number should preserve the historical key');
  assert(projectedRow.isLegacy === true, 'Projected row should be marked as legacy');
  assert(projectedRow.readOnly === true, 'Projected row should remain read-only');

  console.log('Legacy inspections table projection smoke test passed');
}

void main();
