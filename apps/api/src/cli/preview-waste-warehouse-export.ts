import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { resolveWasteAccumulationDeviation, type WarehouseControlExportRequest } from '@aurelia/contracts';
import { ReportPdfService } from '../modules/reports/report-pdf.service';
import { XlsxWorkbookService } from '../modules/reports/xlsx-workbook.service';
import { WasteWarehouseExportPdfService } from '../modules/waste/waste-warehouse-export-pdf.service';
import { WasteWarehouseExportXlsxService } from '../modules/waste/waste-warehouse-export-xlsx.service';
import { warehouseExportBaseFilename } from '../modules/waste/waste-warehouse-export.theme';

/**
 * Genera el PDF y el Excel de "Control de bodega" sin levantar la API ni la BD.
 *
 * Sirve para iterar el layout del reporte —que es la parte más difícil de
 * revisar por código— y para verificar el corte de página con distinta cantidad
 * de lotes.
 *
 *   pnpm --filter api preview:waste-export -- --out=/tmp/preview --lots=60
 */

const LOT_ROWS: WarehouseControlExportRequest['lots'] = [
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '6,1 meses', status: 'overdue' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '5,2 meses', status: 'near_limit' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '5,0 meses', status: 'near_limit' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,6 meses', status: 'normal' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,4 meses', status: 'normal' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: true, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
  { hazardous: false, category: 'Categoría del residuo', wasteType: 'Detalle del residuo', quantity: 'XXXX', unit: 'Tambores, M3,etc', elapsedLabel: '0,3 meses', status: 'normal' },
];

/**
 * Réplica de la etiqueta que arma el front (`formatAccumulationDeviation`).
 *
 * En producción la API NO calcula esta cadena: la recibe dentro del payload. Acá
 * se recalcula solo porque este script genera el payload de prueba, y usa la
 * misma regla de `@aurelia/contracts` para que la vista previa no mienta.
 */
function deviationLabel(percentage: number, elapsedPercentage: number): string {
  const words: Record<string, string> = { safe: 'Normal', warning: 'Adelantado', critical: 'Crítico' };
  const { tone, deltaPercentagePoints } = resolveWasteAccumulationDeviation(percentage, elapsedPercentage);
  return `${words[tone]} ${deltaPercentagePoints > 0 ? '+' : ''}${deltaPercentagePoints}pp`;
}

function buildPayload(lotCount: number, elapsedPercentage: number): WarehouseControlExportRequest {
  const lots = Array.from({ length: lotCount }, (_, index) => {
    const source = LOT_ROWS[index % LOT_ROWS.length];
    if (!source) throw new Error('LOT_ROWS no puede estar vacío');
    return { ...source };
  });

  return {
    title: 'Bodega de acopio - Plataforma 18',
    description:
      'Gestiona los lotes de residuos almacenados transitoriamente. Los residuos peligrosos tienen un plazo máximo de 6 meses de almacenamiento.',
    // La frase se deriva de `--elapsed` en vez de ir fija: con un texto
    // hardcodeado, el recuadro decía "día 16 de 31 (52%)" mientras la línea del
    // gráfico se dibujaba en otro punto, y la vista previa se contradecía sola.
    monthProgressLabel: `Hoy es el día ${Math.max(1, Math.round((elapsedPercentage / 100) * 31))} de 31 del mes (${elapsedPercentage}% transcurrido). Si una barra va muy adelantada, considera diferir retiros o usar el margen de 6 meses de almacenaje.`,
    // Posición de la barra de día del mes. Se puede mover con `--elapsed=` para
    // ver cómo cambian los tonos sin esperar a que pase el mes.
    monthElapsedPercentage: elapsedPercentage,
    kpis: [
      { label: 'Lotes en bodega', value: String(lotCount) },
      { label: 'Cerca del límite (5 meses)', value: '2', note: 'requieren retiro pronto' },
      { label: 'Vencidos (6 meses)', value: '1', note: 'acción inmediata' },
      { label: 'Ingresos vs. retiros (mes)', value: '9', secondaryValue: '7', note: '+2 acumulando' },
    ],
    bars: [
      { label: 'Residuos peligrosos', percentage: 70, valueLabel: '98 / 140 ton (70%)' },
      { label: 'Industriales no peligrosos', percentage: 86, valueLabel: '112 / 130 ton (86%)' },
      { label: 'Domésticos', percentage: 10, valueLabel: '5 / 51 ton (10%)' },
    ].map((bar) => ({ ...bar, deviationLabel: deviationLabel(bar.percentage, elapsedPercentage) })),
    expirations: [
      { wasteName: 'Aceite lubricante usado', intakeDate: '18 ene 2026', detail: '6,1 meses en bodega · vencido, requiere retiro inmediato', overdue: true },
      { wasteName: 'Baterías de plomo-ácido', intakeDate: '22 feb 2026', detail: '5,2 meses en bodega · quedan ~24 días', overdue: false },
      { wasteName: 'Envases contaminados', intakeDate: '25 feb 2026', detail: '5,0 meses en bodega · quedan ~30 días', overdue: false },
    ],
    lots,
  };
}

function readArg(name: string, fallback: string): string {
  const match = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
}

async function main(): Promise<void> {
  const outDir = resolve(readArg('out', 'tmp/waste-export-preview'));
  const lotCount = Math.max(1, Number.parseInt(readArg('lots', '15'), 10) || 15);
  const suffix = readArg('suffix', '');
  const elapsedPercentage = Math.min(100, Math.max(0, Number.parseInt(readArg('elapsed', '52'), 10) || 0));

  mkdirSync(outDir, { recursive: true });

  const payload = buildPayload(lotCount, elapsedPercentage);
  const generatedAt = new Date();
  const meta = { generatedAt, author: 'preview@aurelia.local' };

  const pdfService = new WasteWarehouseExportPdfService(new ReportPdfService());
  const xlsxService = new WasteWarehouseExportXlsxService(new XlsxWorkbookService());

  const base = `${warehouseExportBaseFilename(generatedAt)}${suffix}`;
  const pdfPath = join(outDir, `${base}.pdf`);
  const xlsxPath = join(outDir, `${base}.xlsx`);

  writeFileSync(pdfPath, await pdfService.render(payload, meta));
  writeFileSync(xlsxPath, xlsxService.build(payload, meta));

  process.stdout.write(
    `lotes: ${lotCount} · barra de día del mes: ${elapsedPercentage}%\nPDF:   ${pdfPath}\nXLSX:  ${xlsxPath}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
