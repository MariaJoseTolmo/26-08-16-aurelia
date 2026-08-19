import { httpDownload } from './http-client';

export async function downloadInspectionPdf(inspectionId: string): Promise<void> {
  const path = `/inspections/${encodeURIComponent(inspectionId)}/export/pdf`;
  const result = await httpDownload(path);
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename ?? `inspection-${inspectionId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
