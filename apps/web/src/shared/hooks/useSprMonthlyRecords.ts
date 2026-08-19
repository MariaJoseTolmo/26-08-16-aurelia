import { useQuery } from '@tanstack/react-query';
import { getSprMonthlyRecords, type SprMonthlyRecordsQuery } from '../services/spr.service';

export function useSprMonthlyRecords(query?: SprMonthlyRecordsQuery) {
  return useQuery({
    queryKey: ['spr', 'monthly-records', query],
    queryFn: () => getSprMonthlyRecords(query),
  });
}
