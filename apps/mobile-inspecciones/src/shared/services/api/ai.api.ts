import { AiSuggestType, type AiSuggestRequest, type AiSuggestResponse } from '@aurelia/contracts';
import { useMobileInspectionAssignmentScope } from '../../stores/mobileInspectionAssignmentScope.store';
import { httpPost } from '../http-client';

export function suggestCorrectiveMeasure(params: {
  area: string;
  sector: string;
  description: string;
}): Promise<AiSuggestResponse> {
  return httpPost<AiSuggestRequest, AiSuggestResponse>('/ai/suggest', {
    type: AiSuggestType.CORRECTIVE_MEASURE,
    context: params,
  });
}

export function suggestCompany(params: {
  area: string;
  sector: string;
  availableCompanies: string[];
}): Promise<AiSuggestResponse> {
  const scope = useMobileInspectionAssignmentScope.getState();
  if (!scope.canSelectCompany && scope.companyName) {
    return Promise.resolve({
      suggestion: scope.companyName,
      type: AiSuggestType.COMPANY_SUGGESTION,
      fallback: false,
    });
  }
  return httpPost<AiSuggestRequest, AiSuggestResponse>('/ai/suggest', {
    type: AiSuggestType.COMPANY_SUGGESTION,
    context: params,
  });
}
