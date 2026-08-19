import { useMobileBootstrap } from '../../../shared/hooks/useMobileBootstrap';

export function useInspectionChecklistTemplates() {
  const bootstrapQuery = useMobileBootstrap();

  return {
    ...bootstrapQuery,
    data: bootstrapQuery.data?.catalogs.inspectionTemplates,
  };
}
