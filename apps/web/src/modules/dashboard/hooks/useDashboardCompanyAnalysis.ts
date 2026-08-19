import { useMemo } from 'react';
import { useInspectionDashboardCompanyAnalysis } from '../../../shared/hooks/useInspectionDashboardCompanyAnalysis';

const integerFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatInteger(value: number | undefined) {
  return integerFormatter.format(value ?? 0);
}

function formatDecimal(value: number | undefined) {
  return decimalFormatter.format(value ?? 0);
}

export function useDashboardCompanyAnalysis() {
  const query = useInspectionDashboardCompanyAnalysis();

  const runtimeModel = useMemo(
    () => ({
      companiesWithOpenFindings: formatInteger(query.data?.companiesWithOpenFindings),
      openFindings: formatInteger(query.data?.openFindings),
      openInspections: formatInteger(query.data?.openInspections),
      openDaysLabel: `${formatInteger(query.data?.openDays.max)} · ${formatDecimal(query.data?.openDays.average)}`,
      chartRows: query.data?.chartRows ?? [],
    }),
    [query.data],
  );

  return {
    runtimeModel,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
