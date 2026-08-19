import type { InspectionAssignmentScopeResponse } from '@aurelia/contracts';
import { httpGet } from './http-client';

export function getInspectionAssignmentScope(): Promise<InspectionAssignmentScopeResponse> {
  return httpGet<InspectionAssignmentScopeResponse>('/inspections/assignment-scope');
}
