import { InspectionStatus } from '@aurelia/contracts';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InspectionLegacyMode } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyDryRunReporterService } from '../modules/inspection-legacy-import/inspection-legacy-dry-run-reporter.service';
import { InspectionLegacyReconciliationService } from '../modules/inspection-legacy-import/inspection-legacy-reconciliation.service';
import { ValidatedLegacyInspection } from '../modules/inspection-legacy-import/inspection-legacy-resolution.types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'aurelia-legacy-inspections-'));
  const reporter = new InspectionLegacyDryRunReporterService(
    new InspectionLegacyReconciliationService(),
  );

  const activeArea = {
    status: 'CREATE_ACTIVE' as const,
    sourceValue: 'Construcción',
    entityId: null,
    entityName: 'Construcción',
    proposedCode: 'AREA-CONSTRUCCION',
  };
  const activeSector = {
    status: 'CREATE_ACTIVE' as const,
    sourceValue: 'Plataformas EECC',
    entityId: null,
    entityName: 'Plataformas EECC',
    proposedCode: 'SECT-CONST-PLATAFORMAS-EECC',
  };
  const activeInspector = {
    status: 'CREATE_ACTIVE' as const,
    sourceValue: 'Janina Santander T.',
    entityId: null,
    entityName: 'Janina Santander',
    proposedEmail: 'janina.santander@pending-directory.aurelia.local',
    proposedCompanyCode: 'CORP',
    proposedRoleCode: 'INSPECTOR',
  };

  const row: ValidatedLegacyInspection = {
    sourceSystem: 'legacy_environmental_inspections_spreadsheet',
    alreadyImportedInspectionId: null,
    finalDisposition: 'WARNING',
    validationMessages: [
      'CEI Atacama requiere crear catálogo activo CEI_ATACAMA',
      'CEI atacama requiere crear catálogo activo CEI_ATACAMA',
    ],
    normalized: {
      sourceRow: 5,
      legacyYear: 2023,
      legacyNumber: 1,
      inspectionDate: '2023-01-01',
      inspectorName: 'Janina Santander T.',
      areaName: 'Construcción',
      companyName: 'Gold Fields',
      sectorName: 'Planta Procesos, Plataformas EECC',
      detail: 'Texto con "comillas", coma y salto\nde línea',
      mode: InspectionLegacyMode.FINDING,
      status: InspectionStatus.CLOSED,
      findingsCount: 1,
      openFindingsCount: 0,
      closedFindingsCount: 1,
      completedAt: '2023-01-01',
      closedAt: '2023-01-01',
      milestones: [],
      warnings: [],
      disposition: 'READY',
      rawPayload: {},
    },
    area: activeArea,
    company: {
      status: 'DIRECT_MATCH',
      sourceValue: 'Gold Fields',
      entityId: '3252bece-a2df-4471-a270-da9ca8decd9d',
      entityName: 'Gold Fields',
    },
    sector: {
      status: 'CREATE_ACTIVE',
      sourceValue: 'Planta Procesos, Plataformas EECC',
      entityId: null,
      entityName: 'Planta Procesos | Plataformas EECC',
    },
    sectors: [
      {
        status: 'DIRECT_MATCH',
        sourceValue: 'Planta Procesos',
        entityId: '33333333-3333-4333-8333-333333333333',
        entityName: 'Planta Procesos',
      },
      activeSector,
    ],
    inspector: activeInspector,
    inspectors: [activeInspector],
  };

  try {
    const artifacts = await reporter.write([row], outputDirectory);
    const [summary, warningsCsv, readyCsv, catalogCsv, reconciliation] = await Promise.all([
      readFile(artifacts.summaryJson, 'utf8'),
      readFile(artifacts.warningsCsv, 'utf8'),
      readFile(artifacts.readyCsv, 'utf8'),
      readFile(artifacts.catalogActionsCsv, 'utf8'),
      readFile(artifacts.reconciliationJson, 'utf8'),
    ]);

    const summaryJson = JSON.parse(summary) as {
      totalRows: number;
      dispositions: { WARNING: number };
      catalogPolicy: string;
      onlyInspectionsAreLegacy: boolean;
      validationMessages: Array<{ message: string; count: number }>;
    };
    const reconciliationJson = JSON.parse(reconciliation) as {
      invariant: { allRowsClassified: boolean };
    };

    assert(summaryJson.totalRows === 1, 'Summary should contain one row');
    assert(summaryJson.dispositions.WARNING === 1, 'Warning count is wrong');
    assert(summaryJson.catalogPolicy === 'ACTIVE_MASTER_DATA', 'Summary should declare active master data');
    assert(summaryJson.onlyInspectionsAreLegacy, 'Summary should declare only inspections as legacy');
    assert(summaryJson.validationMessages.length === 2, 'Summary should preserve case-sensitive messages as a list');
    assert(reconciliationJson.invariant.allRowsClassified, 'Reconciliation invariant failed');
    assert(warningsCsv.includes('AREA-CONSTRUCCION'), 'Warning CSV lost area action');
    assert(warningsCsv.includes('SECT-CONST-PLATAFORMAS-EECC'), 'Warning CSV lost sector action');
    assert(warningsCsv.includes('janina.santander@pending-directory.aurelia.local'), 'Warning CSV lost inspector action');
    assert(warningsCsv.includes('""comillas""'), 'CSV quotes were not escaped');
    assert(readyCsv.startsWith('"source_row"'), 'Empty READY file must preserve headers');
    assert(catalogCsv.includes('"CREATE_ACTIVE"'), 'Catalog CSV lost active action');
    assert(catalogCsv.includes('"sector"'), 'Catalog CSV lost sector catalog');
    assert(catalogCsv.includes('"inspector"'), 'Catalog CSV lost inspector catalog');

    console.log('Legacy inspections reporter smoke test passed');
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
}

void main();
