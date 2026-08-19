import { useMemo } from 'react';
import { useInspectionDashboardSummary } from '../../../shared/hooks/useInspectionDashboardSummary';
import { useInspectionsList } from '../../../shared/hooks/useInspectionsList';
import type { InspectionDashboardQueryParams } from '../../../shared/services/inspections.service';
import { buildDashboardRuntimeModel } from '../dashboardRuntime';

export function useDashboardKpisFiltered(input: InspectionDashboardQueryParams) {
  const summaryQuery = useInspectionDashboardSummary(input);
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
