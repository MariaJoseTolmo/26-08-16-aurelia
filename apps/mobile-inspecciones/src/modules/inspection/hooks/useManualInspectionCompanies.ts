import { useMobileBootstrap } from '../../../shared/hooks/useMobileBootstrap';
import { useMobileInspectionAssignmentScope } from '../../../shared/stores/mobileInspectionAssignmentScope.store';

export function useManualInspectionCompanies() {
  const bootstrapQuery = useMobileBootstrap();
  const canSelectCompany = useMobileInspectionAssignmentScope((state) => state.canSelectCompany);
  const assignedCompanyId = useMobileInspectionAssignmentScope((state) => state.companyId);
  const companies = bootstrapQuery.data?.catalogs.companies.filter((company) => company.isContractor) ?? [];

  return {
    ...bootstrapQuery,
    data: canSelectCompany || !assignedCompanyId ? companies : companies.filter((company) => company.id === assignedCompanyId),
  };
}
