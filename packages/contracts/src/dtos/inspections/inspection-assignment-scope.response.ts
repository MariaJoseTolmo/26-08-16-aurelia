import type { ID } from '../../types/common';

export interface InspectionAssignmentScopeResponse {
  canSelectCompany: boolean;
  companyId: ID | null;
  companyName: string | null;
}
