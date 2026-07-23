import { useQueries } from '@tanstack/react-query';
import { getSprRecordApprovals } from '../services/spr.service';
import { findLatestRejectedApproval } from '../../modules/spr/sprRejectedContext';
import type { SprRecordApprovalResponse } from '@aurelia/contracts';

/** Último rechazo del ciclo (cualquier record) — para banner 1672:8997. */
export function useSprLatestCycleRejection(recordIds: string[], enabled: boolean) {
  const queries = useQueries({
    queries: recordIds.map((recordId) => ({
      queryKey: ['spr', 'record-approvals', recordId],
      queryFn: () => getSprRecordApprovals(recordId),
      enabled: enabled && Boolean(recordId),
    })),
  });

  const isLoading = enabled && recordIds.length > 0 && queries.some((query) => query.isLoading || query.isPending);
  const allApprovals = queries.flatMap((query) => (query.data ?? []) as SprRecordApprovalResponse[]);
  const rejection = enabled ? findLatestRejectedApproval(allApprovals) : null;

  return { rejection, isLoading };
}
