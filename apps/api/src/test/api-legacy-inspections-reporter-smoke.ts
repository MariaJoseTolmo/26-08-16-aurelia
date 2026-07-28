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

  const row: ValidatedLegacyInspection = {
    sourceSystem: 'legacy_environmental_inspections_spreadsheet',
    alreadyImportedInspectionId: null,
    finalDisposition: 'WARNING',
    validationMessages: ['Área requiere crear catálogo archivado'],
    normalized: {
      sourceRow: 5,
      legacyYear: 2023,
      legacyNumber: 1,
      inspectionDate: '2023-01-01',
      inspectorName: 'Karen Opazo S.',
      areaName: 'Construcción',
      companyName: 'Gold fields',
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
    area: {
      status: 'CREATE_ARCHIVED',
      sourceValue: 'Construcción',
      entityId: null,
      entityName: 'Construcción',
      proposedCode: 'HIST-AREA-CONSTRUCCION',
    },
    company: {
      status: 'DIRECT_MATCH',
      sourceValue: 'Gold fields',
      entityId: '3252bece-a2df-4471-a270-da9ca8decd9d',
      entityName: 'Gold fields',
    },
    inspector: {
      status: 'ALIAS_MATCH',
      sourceValue: 'Karen Opazo S.',
      entityId: 'd1e87725-1a0a-4006-8336-f8138ee7f29e',
      entityName: 'Karen Opazo',
    },
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
    };
    const reconciliationJson = JSON.parse(reconciliation) as {
      invariant: { allRowsClassified: boolean };
    };

    assert(summaryJson.totalRows === 1, 'Summary should contain one row');
    assert(summaryJson.dispositions.WARNING === 1, 'Warning count is wrong');
    assert(reconciliationJson.invariant.allRowsClassified, 'Reconciliation invariant failed');
    assert(warningsCsv.includes('HIST-AREA-CONSTRUCCION'), 'Warning CSV lost catalog action');
    assert(warningsCsv.includes('""comillas""'), 'CSV quotes were not escaped');
    assert(readyCsv.startsWith('"source_row"'), 'Empty READY file must preserve headers');
    assert(catalogCsv.includes('"CREATE_ARCHIVED"'), 'Catalog CSV lost archived action');

    console.log('Legacy inspections reporter smoke test passed');
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
}

void main();
