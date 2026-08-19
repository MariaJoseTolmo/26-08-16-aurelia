import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SprMonthlyRecordResponse, SprRecordActionRequest } from '@aurelia/contracts';
import { approveSprMonthlyRecord } from '../services/spr.service';

export interface ApproveSprMonthlyRecordInput {
  recordId: string;
  payload?: SprRecordActionRequest;
}

export function useApproveSprMonthlyRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveSprMonthlyRecordInput): Promise<SprMonthlyRecordResponse> =>
      approveSprMonthlyRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['spr', 'monthly-records'] });
      await queryClient.invalidateQueries({ queryKey: ['spr', 'record-approvals'] });
    },
  });
}
