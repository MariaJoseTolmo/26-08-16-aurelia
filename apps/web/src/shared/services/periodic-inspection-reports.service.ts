import type { InspectionPeriodicReportRequest } from '@aurelia/contracts';
import { httpDownload } from './http-client';

export type InspectionPeriodicExportFormat = 'pdf' | 'xlsx';

export async function downloadInspectionPeriodicReport(
  format: InspectionPeriodicExportFormat,
  request: InspectionPeriodicReportRequest,
): Promise<void> {
  const params = new URLSearchParams();
  if (request.year !== undefined) params.set('year', String(request.year));
  if (request.period) params.set('period', String(request.period));
  if (request.inspectionState) params.set('inspectionState', String(request.inspectionState));
  if (request.companyId) params.set('companyId', request.companyId);

  const suffix = params.toString();
  const path = `/reports/inspections/periodic/${format}${suffix ? `?${suffix}` : ''}`;
  const result = await httpDownload(path);
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename ?? `inspecciones-${request.year ?? 'periodo'}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
