import { resolve } from 'node:path';
import { availableSeedNames } from '../database/seeds/seed-registry';
import { resolveLegacyInspectionsImportSeedConfig } from '../database/seeds/010-seed-legacy-inspections-import';
import { InspectionLegacySourceManifestService } from '../modules/inspection-legacy-import/inspection-legacy-source-manifest.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectFailure(run: () => unknown, expectedMessage: string): void {
  let failure: unknown = null;
  try {
    run();
  } catch (error) {
    failure = error;
  }

  assert(failure !== null, `Se esperaba un error que incluyera: ${expectedMessage}`);
  const message = failure instanceof Error ? failure.message : String(failure);
  assert(message.includes(expectedMessage), `Mensaje inesperado: ${message}`);
}

function main(): void {
  const manifest = new InspectionLegacySourceManifestService().manifest;

  assert(
    availableSeedNames.includes('inspections-legacy-import'),
    'El seed inspections-legacy-import debe estar disponible en /migrations',
  );

  expectFailure(
    () => resolveLegacyInspectionsImportSeedConfig({}),
    'LEGACY_INSPECTIONS_IMPORT_ENABLED=true',
  );

  expectFailure(
    () => resolveLegacyInspectionsImportSeedConfig({
      LEGACY_INSPECTIONS_IMPORT_ENABLED: 'true',
    }),
    'LEGACY_INSPECTIONS_XLSX',
  );

  expectFailure(
    () => resolveLegacyInspectionsImportSeedConfig({
      LEGACY_INSPECTIONS_IMPORT_ENABLED: 'true',
      LEGACY_INSPECTIONS_XLSX: manifest.fileName,
      LEGACY_INSPECTIONS_CONFIRM_SOURCE_SHA: 'sha-incorrecto',
    }),
    manifest.sha256,
  );

  const seedConfig = resolveLegacyInspectionsImportSeedConfig({
    LEGACY_INSPECTIONS_IMPORT_ENABLED: 'true',
    LEGACY_INSPECTIONS_XLSX: manifest.fileName,
    LEGACY_INSPECTIONS_CONFIRM_SOURCE_SHA: manifest.sha256,
  });

  assert(seedConfig.filePath === resolve(manifest.fileName), 'La ruta del XLSX debe resolverse de forma absoluta');
  assert(seedConfig.confirmedSha256 === manifest.sha256, 'El SHA confirmado debe conservarse');

  console.log('Legacy inspections web seed config smoke test passed');
}

main();
