import { InspectionStatus } from '@aurelia/contracts';
import { resolve } from 'node:path';
import { InspectionLegacyMode } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { InspectionLegacyNormalizerService } from '../modules/inspection-legacy-import/inspection-legacy-normalizer.service';
import { InspectionLegacySourceManifestService } from '../modules/inspection-legacy-import/inspection-legacy-source-manifest.service';
import { InspectionLegacyXlsxReaderService } from '../modules/inspection-legacy-import/inspection-legacy-xlsx-reader.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv.at(index + 1) ?? null : null;
}

async function main(): Promise<void> {
  const input = argumentValue('--file') ?? process.env.LEGACY_INSPECTIONS_XLSX ?? null;
  if (!input) {
    throw new Error('Indique --file <Planilla de inspecciones Medio Ambiente.xlsx> o LEGACY_INSPECTIONS_XLSX');
  }

  const sourceManifest = new InspectionLegacySourceManifestService();
  const reader = new InspectionLegacyXlsxReaderService(sourceManifest);
  const normalizer = new InspectionLegacyNormalizerService();
  const workbook = await reader.read(resolve(input));
  const rows = normalizer.normalizeMany(workbook.rows, workbook.firstDataRow);
  const manifest = sourceManifest.manifest;
  const legacyKeys = new Set(
    rows
      .filter((row) => row.legacyYear && row.legacyNumber)
      .map((row) => `${row.legacyYear}:${row.legacyNumber}`),
  );

  const totals = rows.reduce((summary, row) => {
    summary.findings += row.findingsCount ?? 0;
    summary.closed += row.closedFindingsCount ?? 0;
    summary.open += row.openFindingsCount ?? 0;
    summary.findingMode += row.mode === InspectionLegacyMode.FINDING ? 1 : 0;
    summary.checklistMode += row.mode === InspectionLegacyMode.CHECKLIST ? 1 : 0;
    summary.closedRows += row.status === InspectionStatus.CLOSED ? 1 : 0;
    summary.openRows += row.status === InspectionStatus.IN_PROGRESS ? 1 : 0;
    summary.quarantine += row.disposition === 'QUARANTINE' ? 1 : 0;
    row.milestones.forEach((milestone) => {
      if (milestone.sequenceNumber === 1) summary.s1 += 1;
      if (milestone.sequenceNumber === 2) summary.s2 += 1;
      if (milestone.sequenceNumber === 3) summary.s3 += 1;
    });
    return summary;
  }, {
    findings: 0,
    closed: 0,
    open: 0,
    findingMode: 0,
    checklistMode: 0,
    closedRows: 0,
    openRows: 0,
    quarantine: 0,
    s1: 0,
    s2: 0,
    s3: 0,
  });

  assert(rows.length === manifest.expectedRows, 'Cantidad de filas distinta al manifest');
  assert(legacyKeys.size === manifest.expectedUniqueLegacyKeys, 'Las claves AÑO + Nº no son únicas');
  assert(totals.findingMode === manifest.expectedTotals.findingsModeRows, 'Cantidad Hallazgo incorrecta');
  assert(totals.checklistMode === manifest.expectedTotals.checklistModeRows, 'Cantidad Checklist incorrecta');
  assert(totals.closedRows === manifest.expectedTotals.closedRows, 'Cantidad Cerrado incorrecta');
  assert(totals.openRows === manifest.expectedTotals.openRows, 'Cantidad Abierto incorrecta');
  assert(totals.findings === manifest.expectedTotals.findingsCount, 'Total de observaciones incorrecto');
  assert(totals.closed === manifest.expectedTotals.closedFindingsCount, 'Total de observaciones cerradas incorrecto');
  assert(totals.open === manifest.expectedTotals.openFindingsCount, 'Total de observaciones pendientes incorrecto');
  assert(totals.s1 === manifest.expectedTotals.followupS1RowsAfterDiscarding1900Date, 'Cantidad S1 incorrecta');
  assert(totals.s2 === manifest.expectedTotals.followupS2SourceRows, 'Cantidad S2 incorrecta');
  assert(totals.s3 === manifest.expectedTotals.followupS3SourceRows, 'Cantidad S3 incorrecta');
  assert(totals.quarantine === manifest.knownQuarantine.length, 'Cantidad de cuarentena conocida incorrecta');

  console.log(JSON.stringify({
    source: input,
    rows: rows.length,
    uniqueLegacyKeys: legacyKeys.size,
    totals,
  }, null, 2));
  console.log('Legacy inspections source smoke test passed');
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
