import { SprApprovalStatus } from '@aurelia/contracts';
import { useQueries } from '@tanstack/react-query';
import { getSprRecordApprovals } from '../services/spr.service';

export function useSprCycleCorrectionHistory(recordIds: string[], enabled: boolean) {
  const queries = useQueries({
    queries: recordIds.map((recordId) => ({
      queryKey: ['spr', 'record-approvals', recordId],
      queryFn: () => getSprRecordApprovals(recordId),
      enabled: enabled && Boolean(recordId),
    })),
  });

  const isLoading = queries.some((query) => query.isLoading);
  const hasCorrectionHistory = queries.some((query) =>
    (query.data ?? []).some((approval) => approval.status === SprApprovalStatus.REJECTED),
  );

  return { hasCorrectionHistory, isLoading };
}
