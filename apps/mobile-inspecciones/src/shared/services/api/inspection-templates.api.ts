import type { InspectionChecklistTemplateResponse } from '@aurelia/contracts';
import { httpGet } from '../http-client';

export function fetchInspectionChecklistTemplates(): Promise<InspectionChecklistTemplateResponse[]> {
  return httpGet<InspectionChecklistTemplateResponse[]>('/inspections/templates');
}
