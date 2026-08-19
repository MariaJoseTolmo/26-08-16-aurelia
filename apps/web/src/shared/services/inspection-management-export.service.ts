import { httpDownload } from './http-client';

export interface InspectionManagementExportFilters {
  id?: string;
  date?: string;
  inspector?: string;
  area?: string;
  company?: string;
  type?: string;
  urgency?: string;
  count?: string;
  obs?: string;
  daysMin?: string;
  daysMax?: string;
  closure?: string;
}

export async function downloadInspectionManagementXlsx(filters: InspectionManagementExportFilters): Promise<void> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim().length > 0) params.set(key, value.trim());
  });

  const suffix = params.toString();
  const result = await httpDownload(`/inspections/dashboard/management-table/xlsx${suffix ? `?${suffix}` : ''}`);
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename ?? 'inspecciones-filtradas.xlsx';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
