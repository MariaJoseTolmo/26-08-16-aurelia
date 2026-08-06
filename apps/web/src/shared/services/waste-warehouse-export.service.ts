import type { WarehouseControlExportRequest, WarehouseIntakeExportRequest } from '@aurelia/contracts';
import { httpDownloadPost } from './http-client';

/**
 * Exportación de las vistas del módulo de residuos a PDF y Excel.
 *
 * El renderizado ocurre en la API —`POST /waste/warehouse-control/export/pdf`,
 * `.../export/xlsx` y `POST /waste/warehouse-intake/export/xlsx`—, igual que los
 * informes de inspecciones: acá solo se envía lo que está en pantalla y se
 * dispara la descarga del blob.
 */

/** Formatos de exportación del módulo. "Ingresos a bodega" solo ofrece `xlsx`. */
export type WasteExportFormat = 'pdf' | 'xlsx';

/** Alias histórico de `WasteExportFormat`, usado por "Control de bodega". */
export type WarehouseControlExportFormat = WasteExportFormat;

const ENDPOINTS: Record<WarehouseControlExportFormat, string> = {
  pdf: '/waste/warehouse-control/export/pdf',
  xlsx: '/waste/warehouse-control/export/xlsx',
};

const FALLBACK_FILENAMES: Record<WarehouseControlExportFormat, string> = {
  pdf: 'residuos-control-bodega.pdf',
  xlsx: 'residuos-control-bodega.xlsx',
};

const INTAKE_XLSX_ENDPOINT = '/waste/warehouse-intake/export/xlsx';
const INTAKE_XLSX_FALLBACK_FILENAME = 'residuos-ingresos-bodega.xlsx';

export async function downloadWarehouseControlExport(
  format: WarehouseControlExportFormat,
  payload: WarehouseControlExportRequest,
): Promise<void> {
  await downloadExport(ENDPOINTS[format], payload, FALLBACK_FILENAMES[format]);
}

/**
 * Exporta "Ingresos a bodega" a Excel. Solo `xlsx`: la vista no tiene versión
 * PDF todavía, así que un parámetro de formato mentiría sobre lo que ofrece.
 */
export async function downloadWarehouseIntakeExport(payload: WarehouseIntakeExportRequest): Promise<void> {
  await downloadExport(INTAKE_XLSX_ENDPOINT, payload, INTAKE_XLSX_FALLBACK_FILENAME);
}

async function downloadExport(endpoint: string, payload: unknown, fallbackFilename: string): Promise<void> {
  const result = await httpDownloadPost(endpoint, payload);
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename ?? fallbackFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
