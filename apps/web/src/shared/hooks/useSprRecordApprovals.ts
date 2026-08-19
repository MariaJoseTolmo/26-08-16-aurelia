import { useQuery } from '@tanstack/react-query';
import { getSprRecordApprovals } from '../services/spr.service';

export function useSprRecordApprovals(recordId: string | null) {
  return useQuery({
    queryKey: ['spr', 'record-approvals', recordId],
    queryFn: () => getSprRecordApprovals(recordId as string),
    enabled: Boolean(recordId),
  });
}
