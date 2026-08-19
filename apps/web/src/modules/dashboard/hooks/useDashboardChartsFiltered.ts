import { useMemo } from 'react';
import type { InspectionDashboardChartsResponse } from '@aurelia/contracts';
import { useInspectionDashboardCharts } from '../../../shared/hooks/useInspectionDashboardCharts';
import type { InspectionDashboardQueryParams } from '../../../shared/services/inspections.service';
import type { DashboardAreaObservationRow, DashboardMonthlySeriesRow } from '../dashboardRuntime';

function buildMonthlySeriesRowsFromCharts(data: InspectionDashboardChartsResponse | undefined): DashboardMonthlySeriesRow[] {
  if (!data) {
    return Array.from({ length: 12 }, (_, index) => ({
      month: new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(new Date(new Date().getFullYear(), index, 1)).replace('.', ''),
      inspections: 0,
      findings: 0,
      closedFindings: 0,
      openFindings: 0,
    }));
  }

  return data.monthlyFindings.map((row) => ({
    month: row.label,
    inspections: 0,
    findings: row.closed + row.open,
    closedFindings: row.closed,
    openFindings: row.open,
  }));
}

function buildAreaObservationRowsFromCharts(data: InspectionDashboardChartsResponse | undefined): DashboardAreaObservationRow[] {
  return data?.areaObservations?.map((row) => ({
    area: row.area,
    closedFindings: row.closed,
    openFindings: row.open,
  })) ?? [];
}

export function useDashboardChartsFiltered(input: InspectionDashboardQueryParams) {
  const chartsQuery = useInspectionDashboardCharts(input);

  const annualInspectionRows = useMemo(
    () => chartsQuery.data?.annualInspections ?? [],
    [chartsQuery.data],
  );

  const monthlySeriesRows = useMemo(
    () => buildMonthlySeriesRowsFromCharts(chartsQuery.data),
    [chartsQuery.data],
  );

  const areaObservationRows = useMemo(
    () => buildAreaObservationRowsFromCharts(chartsQuery.data),
    [chartsQuery.data],
  );

  const closureMetrics = useMemo(
    () => ({
      historicalClosureRate: chartsQuery.data?.closure.historicalRate ?? 0,
      periodClosureRate: chartsQuery.data?.closure.periodRate ?? 0,
      periodLabel: chartsQuery.data?.closure.periodLabel ?? new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date()),
    }),
    [chartsQuery.data],
  );

  return {
    annualInspectionRows,
    monthlySeriesRows,
    areaObservationRows,
    closureMetrics,
    isLoading: chartsQuery.isLoading,
    isError: chartsQuery.isError,
  };
}
