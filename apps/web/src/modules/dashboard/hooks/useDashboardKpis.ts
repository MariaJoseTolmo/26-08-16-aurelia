import { useMemo } from 'react';
import { useInspectionDashboardSummary } from '../../../shared/hooks/useInspectionDashboardSummary';
import { useInspectionsList } from '../../../shared/hooks/useInspectionsList';
import { buildDashboardRuntimeModel } from '../dashboardRuntime';

export function useDashboardKpis() {
  const summaryQuery = useInspectionDashboardSummary();
  const inspectionsQuery = useInspectionsList();

  const runtimeModel = useMemo(
    () => buildDashboardRuntimeModel(summaryQuery.data, inspectionsQuery.data),
    [inspectionsQuery.data, summaryQuery.data],
  );

  return {
    runtimeModel,
    isLoading: summaryQuery.isLoading || inspectionsQuery.isLoading,
    isError: summaryQuery.isError || inspectionsQuery.isError,
  };
}
