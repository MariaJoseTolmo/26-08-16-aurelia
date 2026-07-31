import { resolve } from 'node:path';
import { InspectionLegacySourceManifestService } from '../modules/inspection-legacy-import/inspection-legacy-source-manifest.service';
import { InspectionLegacyXlsxReaderService } from '../modules/inspection-legacy-import/inspection-legacy-xlsx-reader.service';
import { InspectionLegacyNormalizerService } from '../modules/inspection-legacy-import/inspection-legacy-normalizer.service';

async function main(): Promise<void> {
  const input = process.argv[2];

  if (!input) {
    throw new Error('Debe indicar la ruta del archivo XLSX');
  }

  const manifest = new InspectionLegacySourceManifestService();
  const reader = new InspectionLegacyXlsxReaderService(manifest);
  const normalizer = new InspectionLegacyNormalizerService();

  const workbook = await reader.read(resolve(input));
  const rows = normalizer.normalizeMany(
    workbook.rows,
    workbook.firstDataRow,
  );

  const row = rows.find(
    (candidate) =>
      candidate.legacyYear === 2026
      && candidate.legacyNumber === 120,
  );

  console.dir(
    {
      sourceRow: row?.sourceRow,
      legacyYear: row?.legacyYear,
      legacyNumber: row?.legacyNumber,
      findingsRaw: row?.rawPayload['Nº Observaciones'],
      findingsCount: row?.findingsCount,
      disposition: row?.disposition,
      warnings: row?.warnings,
      rawPayload: row?.rawPayload,
    },
    { depth: null },
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
