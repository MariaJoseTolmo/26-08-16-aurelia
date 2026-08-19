import { useQuery } from '@tanstack/react-query';
import { fetchInspectionTypes } from '../services/api/inspection-types.api';

export const INSPECTION_TYPES_QUERY_KEY = ['inspection-types'] as const;

export function useInspectionTypes() {
  return useQuery({
    queryKey: INSPECTION_TYPES_QUERY_KEY,
    queryFn: fetchInspectionTypes,
  });
}
