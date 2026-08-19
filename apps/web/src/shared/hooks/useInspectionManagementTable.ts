import { useQuery } from '@tanstack/react-query';
import { getInspectionManagementTable, type InspectionManagementTableParams } from '../services/inspections.service';

export function useInspectionManagementTable(params: InspectionManagementTableParams) {
  return useQuery({
    queryKey: ['inspections', 'management', 'table', params],
    queryFn: () => getInspectionManagementTable(params),
  });
}
