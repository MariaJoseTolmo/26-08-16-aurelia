import { InspectionStatus } from '@aurelia/contracts';
import { InspectionLegacyMode } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { NormalizedLegacyInspection } from '../modules/inspection-legacy-import/inspection-legacy-import.types';
import { InspectionLegacyReconciliationService } from '../modules/inspection-legacy-import/inspection-legacy-reconciliation.service';
import {
  LegacyCatalogResolution,
  ResolvedLegacyInspection,
} from '../modules/inspection-legacy-import/inspection-legacy-resolution.types';
import { InspectionLegacyValidatorService } from '../modules/inspection-legacy-import/inspection-legacy-validator.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function normalized(overrides: Partial<NormalizedLegacyInspection> = {}): NormalizedLegacyInspection {
  return {
    sourceRow: 5,
    legacyYear: 2023,
    legacyNumber: 1,
    inspectionDate: '2023-01-01',
    inspectorName: 'Karen Opazo S.',
    areaName: 'Exploraciones',
    companyName: 'Gold Fields',
    sectorName: 'Plataformas EECC',
    detail: 'Inspección histórica',
    mode: InspectionLegacyMode.FINDING,
    status: InspectionStatus.CLOSED,
    findingsCount: 2,
    openFindingsCount: 0,
    closedFindingsCount: 2,
    completedAt: '2023-01-01',
    closedAt: '2023-01-01',
    milestones: [],
    warnings: [],
    disposition: 'READY',
    rawPayload: {},
    ...overrides,
  };
}

function resolution(
  status: LegacyCatalogResolution['status'],
  sourceValue: string,
  entityId: string | null = '11111111-1111-4111-8111-111111111111',
): LegacyCatalogResolution {
  return {
    status,
    sourceValue,
    entityId,
    entityName: sourceValue,
    proposedCode: status === 'CREATE_ACTIVE' ? `MASTER_${sourceValue.toUpperCase()}` : undefined,
    message: status === 'BLOCKED' || status === 'MANUAL_REVIEW'
      ? `${sourceValue} requiere revisión`
      : undefined,
  };
}

function resolved(
  inspection: NormalizedLegacyInspection,
  options: {
    alreadyImportedInspectionId?: string | null;
    area?: LegacyCatalogResolution;
    company?: LegacyCatalogResolution;
    sector?: LegacyCatalogResolution;
    sectors?: LegacyCatalogResolution[];
    inspector?: LegacyCatalogResolution;
    inspectors?: LegacyCatalogResolution[];
  } = {},
): ResolvedLegacyInspection {
  const sector = options.sector ?? resolution('DIRECT_MATCH', inspection.sectorName ?? 'Sector');
  const inspector = options.inspector ?? resolution('ALIAS_MATCH', inspection.inspectorName ?? 'Inspector');
  return {
    normalized: inspection,
    sourceSystem: 'legacy_environmental_inspections_spreadsheet',
    alreadyImportedInspectionId: options.alreadyImportedInspectionId ?? null,
    area: options.area ?? resolution('DIRECT_MATCH', inspection.areaName ?? 'Área'),
    company: options.company ?? resolution('DIRECT_MATCH', inspection.companyName ?? 'Empresa'),
    sector,
    sectors: options.sectors ?? [sector],
    inspector,
    inspectors: options.inspectors ?? [inspector],
  };
}

function main(): void {
  const validator = new InspectionLegacyValidatorService();
  const reconciliation = new InspectionLegacyReconciliationService();

  const ready = validator.validate(resolved(normalized()));
  assert(ready.finalDisposition === 'READY', 'Directly resolved row should be READY');

  const warning = validator.validate(resolved(normalized({
    sourceRow: 6,
    legacyNumber: 2,
    mode: InspectionLegacyMode.CHECKLIST,
    milestones: [{
      sequenceNumber: 1,
      occurredAt: '2023-01-05',
      closedIncrement: 2,
      pendingAfter: 0,
      closedPercentage: 100,
      pendingPercentage: 0,
      rawPayload: {},
    }],
  }), {
    area: resolution('CREATE_ACTIVE', 'Construcción', null),
  }));
  assert(warning.finalDisposition === 'WARNING', 'Active catalog action should produce WARNING');
  assert(
    warning.validationMessages.some((message) => message.includes('catálogo activo')),
    'Active catalog warning should be explicit',
  );

  const multiRelationWarning = validator.validate(resolved(normalized({
    sourceRow: 7,
    legacyNumber: 3,
    inspectorName: 'Daniel Martinez; Camila Zapata',
    sectorName: 'Campamento, Plataformas EECC',
  }), {
    sector: resolution('CREATE_ACTIVE', 'Campamento, Plataformas EECC', null),
    sectors: [
      resolution('DIRECT_MATCH', 'Campamento'),
      resolution('CREATE_ACTIVE', 'Plataformas EECC', null),
    ],
    inspector: resolution('CREATE_ACTIVE', 'Daniel Martinez; Camila Zapata', null),
    inspectors: [
      { ...resolution('CREATE_ACTIVE', 'Daniel Martinez', null), proposedEmail: 'daniel@pending.local' },
      { ...resolution('CREATE_ACTIVE', 'Camila Zapata', null), proposedEmail: 'camila@pending.local' },
    ],
  }));
  assert(multiRelationWarning.finalDisposition === 'WARNING', 'Multiple active relations should remain importable');
  assert(
    multiRelationWarning.validationMessages.length === 3,
    'Each distinct active relation should produce one warning',
  );

  const quarantine = validator.validate(resolved(normalized({
    sourceRow: 8,
    legacyNumber: 4,
    disposition: 'QUARANTINE',
    findingsCount: null,
    closedFindingsCount: null,
    openFindingsCount: null,
  })));
  assert(quarantine.finalDisposition === 'QUARANTINE', 'Invalid source row should remain QUARANTINE');

  const manualReview = validator.validate(resolved(normalized({
    sourceRow: 9,
    legacyNumber: 5,
  }), {
    company: resolution('MANUAL_REVIEW', 'Empresa ambigua', null),
  }));
  assert(manualReview.finalDisposition === 'QUARANTINE', 'Manual review should quarantine the row');

  const blocked = validator.validate(resolved(normalized({
    sourceRow: 10,
    legacyNumber: 6,
  }), {
    company: resolution('BLOCKED', 'Empresa desconocida', null),
  }));
  assert(blocked.finalDisposition === 'BLOCKED', 'Unresolved catalog should block the row');

  const alreadyImported = validator.validate(resolved(normalized({
    sourceRow: 11,
    legacyNumber: 7,
  }), {
    alreadyImportedInspectionId: '22222222-2222-4222-8222-222222222222',
  }));
  assert(alreadyImported.finalDisposition === 'ALREADY_IMPORTED', 'Existing legacy key should be idempotent');

  const summary = reconciliation.summarize([
    ready,
    warning,
    multiRelationWarning,
    quarantine,
    manualReview,
    blocked,
    alreadyImported,
  ]);

  assert(summary.totalRows === 7, 'Reconciliation row count is wrong');
  assert(summary.dispositions.READY === 1, 'READY count is wrong');
  assert(summary.dispositions.WARNING === 2, 'WARNING count is wrong');
  assert(summary.dispositions.QUARANTINE === 2, 'QUARANTINE count is wrong');
  assert(summary.dispositions.BLOCKED === 1, 'BLOCKED count is wrong');
  assert(summary.dispositions.ALREADY_IMPORTED === 1, 'ALREADY_IMPORTED count is wrong');
  assert(summary.modes.finding === 6 && summary.modes.checklist === 1, 'Mode distribution is wrong');
  assert(summary.totals.milestoneS1 === 1, 'Milestone count is wrong');
  assert(summary.invariant.allRowsClassified, 'All rows must be classified exactly once');

  console.log('Legacy inspections dry-run smoke test passed');
}

main();
