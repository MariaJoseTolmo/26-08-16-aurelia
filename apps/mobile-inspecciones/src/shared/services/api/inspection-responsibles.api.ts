import type { CompanyResponse, UserResponse } from '@aurelia/contracts';
import { getMobileBootstrapLocalFirst } from '../../offline/local-catalogs';
import { useMobileInspectionAssignmentScope } from '../../stores/mobileInspectionAssignmentScope.store';
import { httpGet } from '../http-client';

export function fetchResponsibleCompanies(): Promise<CompanyResponse[]> {
  return httpGet<CompanyResponse[]>('/organization/companies?isContractor=true');
}

export function fetchResponsibleUsers(companyId: string): Promise<UserResponse[]> {
  return httpGet<UserResponse[]>(`/users?companyId=${encodeURIComponent(companyId)}`);
}

async function waitForAssignmentScope(): Promise<void> {
  const current = useMobileInspectionAssignmentScope.getState();
  if (current.loaded || !current.loading) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = useMobileInspectionAssignmentScope.subscribe((scope) => {
      if (!scope.loaded && scope.loading) return;
      unsubscribe();
      resolve();
    });
  });
}

function applyAssignmentScope(companies: CompanyResponse[]): CompanyResponse[] {
  const scope = useMobileInspectionAssignmentScope.getState();
  if (!scope.loaded || scope.canSelectCompany || !scope.companyId) return companies;
  return companies.filter((company) => company.id === scope.companyId);
}

export async function fetchResponsibleCompaniesLocalFirst(): Promise<CompanyResponse[]> {
  const remote = await fetchResponsibleCompanies().then(
    (items) => items,
    () => null,
  );
  await waitForAssignmentScope();

  if (remote) return applyAssignmentScope(remote);

  const bootstrap = await getMobileBootstrapLocalFirst();
  return applyAssignmentScope((bootstrap.catalogs.companies ?? []).filter((company) => company.isContractor));
}

export async function fetchResponsibleUsersLocalFirst(companyId: string): Promise<UserResponse[]> {
  await waitForAssignmentScope();
  const scope = useMobileInspectionAssignmentScope.getState();
  const resolvedCompanyId = !scope.canSelectCompany && scope.companyId ? scope.companyId : companyId;
  const remote = await fetchResponsibleUsers(resolvedCompanyId).then(
    (items) => items,
    () => null,
  );

  if (remote) return remote;

  const bootstrap = await getMobileBootstrapLocalFirst();
  return (bootstrap.catalogs.users ?? []).filter((user) => user.companyId === resolvedCompanyId || user.companies?.some((company) => company.id === resolvedCompanyId));
}
