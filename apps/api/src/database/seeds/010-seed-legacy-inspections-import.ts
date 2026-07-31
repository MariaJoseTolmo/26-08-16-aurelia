import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { AreaEntity } from '../../modules/organization/entities/area.entity';
import { CompanyEntity } from '../../modules/organization/entities/company.entity';
import { SectorEntity } from '../../modules/organization/entities/sector.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { InspectionLegacyImportEntity } from '../../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyApplyService } from '../../modules/inspection-legacy-import/inspection-legacy-apply.service';
import { InspectionLegacyNormalizerService } from '../../modules/inspection-legacy-import/inspection-legacy-normalizer.service';
import { InspectionLegacyResolverService } from '../../modules/inspection-legacy-import/inspection-legacy-resolver.service';
import { InspectionLegacySourceManifestService } from '../../modules/inspection-legacy-import/inspection-legacy-source-manifest.service';
import { InspectionLegacyValidatorService } from '../../modules/inspection-legacy-import/inspection-legacy-validator.service';
import { InspectionLegacyXlsxReaderService } from '../../modules/inspection-legacy-import/inspection-legacy-xlsx-reader.service';
import { runInspectionsMasterDataSeed } from './009-seed-inspections-master-data';

config();

const ENABLE_ENV = 'LEGACY_INSPECTIONS_IMPORT_ENABLED';
const SOURCE_PATH_ENV = 'LEGACY_INSPECTIONS_XLSX';
const CONFIRM_SHA_ENV = 'LEGACY_INSPECTIONS_CONFIRM_SOURCE_SHA';

export interface LegacyInspectionsImportSeedConfig {
  filePath: string;
  confirmedSha256: string;
}

export function resolveLegacyInspectionsImportSeedConfig(
  env: NodeJS.ProcessEnv = process.env,
): LegacyInspectionsImportSeedConfig {
  if (env[ENABLE_ENV]?.trim().toLocaleLowerCase('en') !== 'true') {
    throw new Error(
      `El seed de inspecciones legacy está deshabilitado. Configure ${ENABLE_ENV}=true sólo durante la ventana de importación.`,
    );
  }

  const sourcePath = env[SOURCE_PATH_ENV]?.trim();
  if (!sourcePath) {
    throw new Error(
      `El seed de inspecciones legacy requiere ${SOURCE_PATH_ENV} con la ruta local del XLSX montado en el servidor.`,
    );
  }

  const sourceManifest = new InspectionLegacySourceManifestService();
  const expectedSha256 = sourceManifest.manifest.sha256;
  const confirmedSha256 = env[CONFIRM_SHA_ENV]?.trim() ?? '';
  if (confirmedSha256 !== expectedSha256) {
    throw new Error(
      `El seed de inspecciones legacy requiere ${CONFIRM_SHA_ENV}=${expectedSha256}`,
    );
  }

  return {
    filePath: resolve(sourcePath),
    confirmedSha256,
  };
}

export async function runLegacyInspectionsImportSeed(
  dataSource: DataSource,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const seedConfig = resolveLegacyInspectionsImportSeedConfig(env);
  const sourceManifest = new InspectionLegacySourceManifestService();
  const verification = await sourceManifest.assertValid(seedConfig.filePath);

  console.log(`Legacy inspections source verified: ${verification.actual.fileName}`);
  console.log(`Legacy inspections source SHA-256: ${verification.actual.sha256}`);

  await runInspectionsMasterDataSeed(dataSource);

  const reader = new InspectionLegacyXlsxReaderService(sourceManifest);
  const normalizer = new InspectionLegacyNormalizerService();
  const resolver = new InspectionLegacyResolverService(
    dataSource.getRepository(AreaEntity),
    dataSource.getRepository(CompanyEntity),
    dataSource.getRepository(SectorEntity),
    dataSource.getRepository(UserEntity),
    dataSource.getRepository(InspectionLegacyImportEntity),
    normalizer,
  );
  const validator = new InspectionLegacyValidatorService();
  const applyService = new InspectionLegacyApplyService(dataSource);

  const workbook = await reader.read(seedConfig.filePath);
  const normalized = normalizer.normalizeMany(workbook.rows, workbook.firstDataRow);
  const resolved = await resolver.resolveMany(normalized);
  const validated = validator.validateMany(resolved);

  const blockedRows = validated.filter((row) => row.finalDisposition === 'BLOCKED').length;
  const quarantineRows = validated.filter((row) => row.finalDisposition === 'QUARANTINE').length;
  if (blockedRows > 0 || quarantineRows > 0) {
    throw new Error(
      `Import legacy rechazado: BLOCKED=${blockedRows}, QUARANTINE=${quarantineRows}`,
    );
  }

  const result = await applyService.apply(validated);
  console.log('Legacy inspections import completed successfully.');
  console.log(`  → ${result.receivedRows} filas recibidas`);
  console.log(`  → ${result.importedRows} inspecciones importadas`);
  console.log(`  → ${result.alreadyImportedRows} inspecciones ya importadas`);
}

async function main(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    await runLegacyInspectionsImportSeed(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void main().catch((error) => {
    console.error('Legacy inspections import seed failed:', error);
    process.exit(1);
  });
}
