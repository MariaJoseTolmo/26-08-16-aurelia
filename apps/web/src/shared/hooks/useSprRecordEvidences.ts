import { useQuery } from '@tanstack/react-query';
import { getSprRecordEvidences } from '../services/spr.service';

export function useSprRecordEvidences(recordId: string | null) {
  return useQuery({
    queryKey: ['spr', 'record-evidences', recordId],
    queryFn: () => getSprRecordEvidences(recordId as string),
    enabled: Boolean(recordId),
  });
}
