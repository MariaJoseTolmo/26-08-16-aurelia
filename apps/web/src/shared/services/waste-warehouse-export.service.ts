import type { WarehouseControlExportRequest } from '@aurelia/contracts';
import { httpDownloadPost } from './http-client';

/**
 * Exportación de la vista "Control de bodega" a PDF y Excel.
 *
 * El renderizado ocurre en la API (`POST /waste/warehouse-control/export/*`),
 * igual que los informes de inspecciones: acá solo se envía lo que está en
 * pantalla y se dispara la descarga del blob.
 */

export type WarehouseControlExportFormat = 'pdf' | 'xlsx';

const ENDPOINTS: Record<WarehouseControlExportFormat, string> = {
  pdf: '/waste/warehouse-control/export/pdf',
  xlsx: '/waste/warehouse-control/export/xlsx',
};

const FALLBACK_FILENAMES: Record<WarehouseControlExportFormat, string> = {
  pdf: 'residuos-control-bodega.pdf',
  xlsx: 'residuos-control-bodega.xlsx',
};

export async function downloadWarehouseControlExport(
  format: WarehouseControlExportFormat,
  payload: WarehouseControlExportRequest,
): Promise<void> {
  const result = await httpDownloadPost(ENDPOINTS[format], payload);
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename ?? FALLBACK_FILENAMES[format];
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
