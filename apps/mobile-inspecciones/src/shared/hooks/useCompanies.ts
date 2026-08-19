import { useQuery } from '@tanstack/react-query';
import { fetchCompanies } from '../services/api/organization.api';

export const COMPANIES_QUERY_KEY = ['companies', 'contractors'] as const;

export function useContractorCompanies() {
  return useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: () => fetchCompanies(true),
  });
}
