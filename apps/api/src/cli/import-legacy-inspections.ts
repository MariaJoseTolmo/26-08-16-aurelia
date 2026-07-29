import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { resolve } from 'node:path';
import { AppModule } from '../app.module';
import { runInspectionsMasterDataSeed } from '../database/seeds/009-seed-inspections-master-data';
import { InspectionLegacyApplyService } from '../modules/inspection-legacy-import/inspection-legacy-apply.service';
import { InspectionLegacyDryRunReporterService } from '../modules/inspection-legacy-import/inspection-legacy-dry-run-reporter.service';
import { InspectionLegacyNormalizerService } from '../modules/inspection-legacy-import/inspection-legacy-normalizer.service';
import { InspectionLegacyReconciliationService } from '../modules/inspection-legacy-import/inspection-legacy-reconciliation.service';
import { InspectionLegacyResolverService } from '../modules/inspection-legacy-import/inspection-legacy-resolver.service';
import { InspectionLegacySourceManifestService } from '../modules/inspection-legacy-import/inspection-legacy-source-manifest.service';
import { InspectionLegacyValidatorService } from '../modules/inspection-legacy-import/inspection-legacy-validator.service';
import { InspectionLegacyXlsxReaderService } from '../modules/inspection-legacy-import/inspection-legacy-xlsx-reader.service';

interface CliOptions {
  filePath: string;
  outputDirectory: string;
  apply: boolean;
  prepareMaster: boolean;
  confirmedSha256: string | null;
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv.at(index + 1) ?? null : null;
}

function parseOptions(): CliOptions {
  const filePath = argumentValue('--file');
  if (!filePath) {
    throw new Error('Uso: --file <Planilla de inspecciones Medio Ambiente.xlsx> [--output <directorio>] [--prepare-master] [--apply --confirm-source-sha <sha256>]');
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    filePath: resolve(filePath),
    outputDirectory: resolve(argumentValue('--output') ?? `artifacts/legacy-inspections/${timestamp}`),
    apply: process.argv.includes('--apply'),
    prepareMaster: process.argv.includes('--prepare-master'),
    confirmedSha256: argumentValue('--confirm-source-sha'),
  };
}

async function main(): Promise<void> {
  const options = parseOptions();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const sourceManifest = app.get(InspectionLegacySourceManifestService);
    const reader = app.get(InspectionLegacyXlsxReaderService);
    const normalizer = app.get(InspectionLegacyNormalizerService);
    const resolver = app.get(InspectionLegacyResolverService);
    const validator = app.get(InspectionLegacyValidatorService);
    const reconciliation = app.get(InspectionLegacyReconciliationService);
    const reporter = app.get(InspectionLegacyDryRunReporterService);
    const applyService = app.get(InspectionLegacyApplyService);

    const verification = await sourceManifest.assertValid(options.filePath);
    console.log(`Fuente verificada: ${verification.actual.fileName}`);
    console.log(`SHA-256: ${verification.actual.sha256}`);

    if (options.prepareMaster) {
      console.log('Preparando catálogos maestros activos…');
      await runInspectionsMasterDataSeed(dataSource);
    }

    const workbook = await reader.read(options.filePath);
    const normalized = normalizer.normalizeMany(workbook.rows, workbook.firstDataRow);
    const resolved = await resolver.resolveMany(normalized);
    const validated = validator.validateMany(resolved);
    const summary = reconciliation.summarize(validated);
    const artifacts = await reporter.write(validated, options.outputDirectory);

    console.log(JSON.stringify({
      mode: options.apply ? 'apply' : 'dry-run',
      outputDirectory: options.outputDirectory,
      totalRows: summary.totalRows,
      dispositions: summary.dispositions,
      totals: summary.totals,
      artifacts,
    }, null, 2));

    if (!options.apply) {
      if (summary.dispositions.BLOCKED > 0 || summary.dispositions.QUARANTINE > 0) {
        process.exitCode = 2;
      }
      return;
    }

    if (options.confirmedSha256 !== sourceManifest.manifest.sha256) {
      throw new Error(
        `El apply requiere --confirm-source-sha ${sourceManifest.manifest.sha256}`,
      );
    }
    if (summary.dispositions.BLOCKED > 0 || summary.dispositions.QUARANTINE > 0) {
      throw new Error(
        `Apply rechazado: BLOCKED=${summary.dispositions.BLOCKED}, QUARANTINE=${summary.dispositions.QUARANTINE}`,
      );
    }

    const result = await applyService.apply(validated);
    console.log(JSON.stringify({ applyResult: result }, null, 2));
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
