import type {
  WarehouseControlExportRequest,
  WarehouseIntakeExportRequest,
  WasteFolioSupportExportRequest,
  WasteSinaderExportRequest,
} from '@aurelia/contracts';
import { httpDownloadPost } from './http-client';

/**
 * Exportación de las vistas del módulo de residuos a PDF y Excel.
 *
 * El renderizado ocurre en la API —`POST /waste/warehouse-control/export/pdf`,
 * `.../export/xlsx`, `POST /waste/warehouse-intake/export/xlsx`,
 * `POST /waste/sinader/export/{pdf,xlsx}` y
 * `POST /waste/sidrep/folios/export/pdf`—, igual que los informes de
 * inspecciones: acá solo se envía lo que está en pantalla y se dispara la
 * descarga del blob.
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

const SINADER_ENDPOINTS: Record<WasteExportFormat, string> = {
  pdf: '/waste/sinader/export/pdf',
  xlsx: '/waste/sinader/export/xlsx',
};

const SINADER_FALLBACK_FILENAMES: Record<WasteExportFormat, string> = {
  pdf: 'residuos-reporte-sinader.pdf',
  xlsx: 'residuos-reporte-sinader.xlsx',
};

const FOLIO_SUPPORT_PDF_ENDPOINT = '/waste/sidrep/folios/export/pdf';
const FOLIO_SUPPORT_PDF_FALLBACK_FILENAME = 'residuos-respaldo-sidrep.pdf';

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

/**
 * Exporta "Reporte SINADER" a PDF o Excel (nodos `3830:65724` y `4304:31205`).
 *
 * Es la única de las tres exportaciones del módulo que ofrece los DOS formatos
 * desde el mismo menú, porque el consolidado se usa para las dos cosas: el PDF se
 * archiva como respaldo de lo declarado y el Excel se filtra y se suma antes de
 * cargar la declaración.
 */
export async function downloadWasteSinaderExport(
  format: WasteExportFormat,
  payload: WasteSinaderExportRequest,
): Promise<void> {
  await downloadExport(SINADER_ENDPOINTS[format], payload, SINADER_FALLBACK_FILENAMES[format]);
}

/**
 * Descarga el "Respaldo de Traslado de Residuo Peligroso" de un folio SIDREP — nodo
 * `3084:11044`. Lo dispara el botón "Descargar PDF" del modal `3085:13254`.
 *
 * SÓLO PDF, al revés del consolidado SINADER: esto no es una tabla que alguien vaya a
 * filtrar y sumar, es un documento de respaldo que se archiva y se presenta. Un Excel del
 * mismo contenido no tendría a quién servirle.
 *
 * El nombre del archivo lo decide el SERVIDOR y lleva el folio
 * (`residuos-respaldo-2026-SD-04690.pdf`); el fallback de acá sólo cubre el caso de que la
 * respuesta llegue sin `Content-Disposition`.
 */
export async function downloadWasteFolioSupportExport(
  payload: WasteFolioSupportExportRequest,
): Promise<void> {
  await downloadExport(FOLIO_SUPPORT_PDF_ENDPOINT, payload, FOLIO_SUPPORT_PDF_FALLBACK_FILENAME);
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
