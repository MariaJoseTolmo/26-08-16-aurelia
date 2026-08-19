import { useQuery } from '@tanstack/react-query';
import { getInspectionHistoryTable, type InspectionManagementTableParams } from '../services/inspections.service';

export function useInspectionHistoryTable(params: InspectionManagementTableParams) {
  return useQuery({
    queryKey: ['inspections', 'history', 'table', params],
    queryFn: () => getInspectionHistoryTable(params),
  });
}
