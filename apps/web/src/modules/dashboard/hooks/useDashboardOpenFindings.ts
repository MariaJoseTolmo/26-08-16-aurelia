import { useMemo } from 'react';
import { useInspectionDashboardOpenFindings } from '../../../shared/hooks/useInspectionDashboardOpenFindings';

const integerFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

function formatInteger(value: number | undefined) {
  return integerFormatter.format(value ?? 0);
}

export function useDashboardOpenFindings() {
  const query = useInspectionDashboardOpenFindings();

  const rows = useMemo(() => query.data?.rows ?? [], [query.data]);

  return {
    rows,
    severeOpenFindings: query.data?.severeOpenFindings ?? 0,
    openInspections: formatInteger(query.data?.openInspections),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
