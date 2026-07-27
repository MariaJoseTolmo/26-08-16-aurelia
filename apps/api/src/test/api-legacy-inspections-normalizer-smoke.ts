import { InspectionStatus } from '@aurelia/contracts';
import { InspectionLegacyMode } from '../modules/inspection-legacy-import/entities/inspection-legacy-import.entity';
import { LegacyInspectionWarningCode } from '../modules/inspection-legacy-import/inspection-legacy-import.types';
import { InspectionLegacyNormalizerService } from '../modules/inspection-legacy-import/inspection-legacy-normalizer.service';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  const normalizer = new InspectionLegacyNormalizerService();

  const closedAtInspection = normalizer.normalize({
    Nº: 1,
    Fecha: 44927,
    'Realizada por': 'Francisco Báez A.',
    Área: 'Construcción',
    Empresa: 'SK',
    Tipo: 'Hallazgo',
    Sector: 'Planta Procesos',
    Detalle: 'Chancado',
    'Nº Observaciones': 1,
    'Nº Obs Cerradas': 1,
    'Nº Obs  Pendientes': 0,
    AÑO: 2023,
    Estado: 'Cerrado',
  }, 5);

  assert(closedAtInspection.disposition === 'READY', 'Simple closed row should be READY');
  assert(closedAtInspection.mode === InspectionLegacyMode.FINDING, 'Hallazgo mode was not resolved');
  assert(closedAtInspection.status === InspectionStatus.CLOSED, 'Closed status was not resolved');
  assert(closedAtInspection.inspectionDate === '2023-01-01', 'Excel serial date was not normalized');
  assert(closedAtInspection.closedAt === '2023-01-01', 'Initial closure date was not assigned');
  assert(closedAtInspection.openFindingsCount === 0, 'Initial pending count is wrong');

  const incremental = normalizer.normalize({
    Nº: 2,
    Fecha: '01-01-2024',
    'Realizada por': 'Karen Opazo S.',
    Área: 'Exploraciones',
    Empresa: 'Gold Fields',
    Tipo: 'Checklist',
    Sector: 'Plataformas EECC',
    Detalle: 'SUSPEL',
    'Nº Observaciones': 6,
    'Nº Obs Cerradas': 1,
    'Nº Obs Pendientes': 5,
    'Fecha S1': '05-01-2024',
    'Nº Obs Cerradas S1': 3,
    'Nº Obs Pendientes S1': 2,
    'Fecha S2': '10-01-2024',
    'Nº Obs Cerradas S2': 2,
    'Nº Obs Pendientes S2': 0,
    AÑO: 2024,
    Estado: 'Cerrado',
  }, 6);

  assert(incremental.mode === InspectionLegacyMode.CHECKLIST, 'Checklist mode was not resolved');
  assert(incremental.milestones.length === 2, 'Valid S1/S2 milestones were not retained');
  assert(incremental.closedFindingsCount === 6, 'Incremental closed total is wrong');
  assert(incremental.openFindingsCount === 0, 'Final pending count is wrong');
  assert(incremental.closedAt === '2024-01-10', 'Closure should use first milestone reaching zero');
  assert(incremental.disposition === 'READY', 'Reconciled incremental row should be READY');

  const invalid1900 = normalizer.normalize({
    Nº: 15,
    Fecha: '18-07-2025',
    'Realizada por': 'Karen Opazo S.',
    Área: 'Medio Ambiente',
    Empresa: 'Gold Fields',
    Tipo: 'Hallazgo',
    Sector: 'Planta Procesos',
    Detalle: 'Caso cronológico',
    'Nº Observaciones': 2,
    'Nº Obs Cerradas': 0,
    'Nº Obs Pendientes': 2,
    'Fecha S1': 20,
    'Nº Obs Cerradas S1': 1,
    'Nº Obs Pendientes S1': 1,
    'Fecha S2': '24-07-2025',
    'Nº Obs Cerradas S2': 2,
    'Nº Obs Pendientes S2': 0,
    AÑO: 2025,
    Estado: 'Cerrado',
  }, 1808);

  assert(invalid1900.milestones.length === 1, 'Invalid 1900 milestone should be discarded');
  assert(invalid1900.milestones[0]?.sequenceNumber === 2, 'Valid S2 milestone should be retained');
  assert(
    invalid1900.warnings.some((warning) => warning.code === LegacyInspectionWarningCode.MILESTONE_BEFORE_INSPECTION),
    'Invalid 1900 date warning is missing',
  );
  assert(invalid1900.disposition === 'WARNING', 'Chronological anomaly should remain importable with warning');

  const missingTotal = normalizer.normalize({
    Nº: 120,
    Fecha: '19-02-2026',
    'Realizada por': 'Karen Opazo S.',
    Área: 'Medio Ambiente',
    Empresa: 'MKL',
    Tipo: 'Hallazgo',
    Sector: 'Plataformas EECC',
    Detalle: 'Registro sin total',
    'Nº Observaciones': null,
    AÑO: 2026,
    Estado: 'Abierto',
  }, 2312);

  assert(missingTotal.disposition === 'QUARANTINE', 'Missing total must be quarantined');
  assert(
    missingTotal.warnings.some((warning) => warning.code === LegacyInspectionWarningCode.MISSING_TOTAL_FINDINGS),
    'Missing total warning is absent',
  );

  assert(
    normalizer.normalizeCatalogText('  Scaf Logística ') === 'scaf logistica',
    'Catalog normalization should remove accents and normalize whitespace',
  );

  console.log('Legacy inspections normalizer smoke test passed');
}

main();
