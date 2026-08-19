import type { CompanyResponse } from '@aurelia/contracts';

declare module '../../../../shared/services/inspections.service' {
  export function getResponsibleCompanies(): Promise<[CompanyResponse, ...CompanyResponse[]]>;
}
