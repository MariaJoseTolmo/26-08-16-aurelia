import 'reflect-metadata';
import { InspectionStatus, type InspectionManagementTableResponse } from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import {
  InspectionLegacyImportEntity,
  InspectionLegacyMode,
} from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyMilestoneEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-milestone.entity';
import { InspectionLegacyParticipantEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-participant.entity';
import { InspectionLegacySectorLinkEntity } from '../modules/inspection-legacy-import/entities/inspection-legacy-sector-link.entity';
import { AreaEntity } from '../modules/organization/entities/area.entity';
import { CompanyEntity } from '../modules/organization/entities/company.entity';
import { SectorEntity } from '../modules/organization/entities/sector.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { InspectionFindingEntity } from '../modules/inspections/entities/inspection-finding.entity';
import { InspectionTypeEntity } from '../modules/inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../modules/inspections/entities/inspection.entity';
import { InspectionHistoryService } from '../modules/inspections/inspection-history.service';
import { InspectionLegacyDetailProjectionService } from '../modules/inspections/inspection-legacy-detail-projection.service';
import { InspectionLegacyTableProjectionService } from '../modules/inspections/inspection-legacy-table-projection.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const year = new Date().getFullYear();
  const inspectionId = '11111111-1111-4111-8111-111111111111';
  const legacyImportId = '77777777-7777-4777-8777-777777777777';
  const companyId = '22222222-2222-4222-8222-222222222222';
  const areaId = '33333333-3333-4333-8333-333333333333';
  const sectorId = '44444444-4444-4444-8444-444444444444';
  const inspectorId = '55555555-5555-4555-8555-555555555555';
  const inspectionTypeId = '66666666-6666-4666-8666-666666666666';
  const startedAt = new Date(`${year}-01-01T12:00:00.000Z`);
  const closedAt = new Date(`${year}-01-15T12:00:00.000Z`);
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
    id: legacyImportId,
    inspectionId,
    sourceSystem: 'legacy_environmental_inspections_spreadsheet',
    legacyYear: year,
    legacyNumber: 42,
    legacyMode: InspectionLegacyMode.FINDING,
    legacyInspectorName: 'Karen Opazo S.',
    legacyAreaName: 'Servicios Generales',
    legacyCompanyName: 'AGGREKO',
    legacySectorName: 'Campamento',
    legacyDetail: 'Plataforma 17',
  } as InspectionLegacyImportEntity;
  const milestones = [
    {
      legacyImportId,
      sequenceNumber: 1,
      occurredAt: `${year}-01-08`,
      closedIncrement: 4,
      pendingAfter: 3,
      closedPercentage: '57.14',
      pendingPercentage: '42.86',
    },
    {
      legacyImportId,
      sequenceNumber: 2,
      occurredAt: `${year}-01-15`,
      closedIncrement: 3,
      pendingAfter: 0,
      closedPercentage: '100.00',
      pendingPercentage: '0.00',
    },
  ] as InspectionLegacyMilestoneEntity[];
  const legacyParticipants = [{
    legacyImportId,
    userId: inspectorId,
    sourceName: 'Karen Opazo S.',
    sequenceNumber: 1,
    isPrimary: true,
  }] as InspectionLegacyParticipantEntity[];
  const legacySectorLinks = [{
    legacyImportId,
    sectorId,
    sourceName: 'Campamento',
    sequenceNumber: 1,
    isPrimary: true,
  }] as InspectionLegacySectorLinkEntity[];
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
    findOneBy: async () => inspection,
  } as unknown as Repository<InspectionEntity>;
  const findingsRepository = {
    find: async () => [],
  } as unknown as Repository<InspectionFindingEntity>;
  const legacyImportsRepository = {
    find: async () => [legacyImport],
    findBy: async () => [legacyImport],
    findOneBy: async () => legacyImport,
  } as unknown as Repository<InspectionLegacyImportEntity>;
  const milestonesRepository = {
    find: async () => milestones,
  } as unknown as Repository<InspectionLegacyMilestoneEntity>;
  const participantsRepository = {
    find: async () => legacyParticipants,
  } as unknown as Repository<InspectionLegacyParticipantEntity>;
  const sectorLinksRepository = {
    find: async () => legacySectorLinks,
  } as unknown as Repository<InspectionLegacySectorLinkEntity>;
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

  const detailProjection = new InspectionLegacyDetailProjectionService(
    inspectionsRepository,
    legacyImportsRepository,
    milestonesRepository,
    participantsRepository,
    sectorLinksRepository,
  );
  const detail = await detailProjection.getSummary(inspectionId);

  assert(detail !== null, 'Legacy detail summary should be available');
  assert(detail.totalObservations === 7, 'Legacy detail should expose aggregate total observations');
  assert(detail.closedObservations === 7, 'Legacy detail should expose aggregate closed observations');
  assert(detail.openObservations === 0, 'Legacy detail should expose aggregate open observations');
  assert(detail.milestones.length === 2, 'Legacy detail should expose restored S1-S3 milestones');
  assert(detail.milestones[0]?.occurredAt === `${year}-01-08`, 'Legacy detail should preserve S1 date');
  assert(detail.milestones[0]?.closedIncrement === 4, 'Legacy detail should preserve S1 closed increment');
  assert(detail.milestones[0]?.pendingAfter === 3, 'Legacy detail should preserve S1 pending count');
  assert(detail.milestones[1]?.closedPercentage === 100, 'Legacy detail should preserve final closure percentage');
  assert(detail.originalAreaName === 'Servicios Generales', 'Legacy detail should preserve original area text');
  assert(detail.originalSectorName === 'Campamento', 'Legacy detail should preserve original sector text');
  assert(detail.dataAvailability.findingDetails === false, 'Legacy detail must not imply individual finding reconstruction');

  console.log('Legacy inspections table and detail projection smoke test passed');
}

void main();
