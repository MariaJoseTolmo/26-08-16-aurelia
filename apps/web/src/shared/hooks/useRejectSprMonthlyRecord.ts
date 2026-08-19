import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SprMonthlyRecordResponse, SprRecordActionRequest } from '@aurelia/contracts';
import { rejectSprMonthlyRecord } from '../services/spr.service';

export interface RejectSprMonthlyRecordInput {
  recordId: string;
  payload?: SprRecordActionRequest;
}

export function useRejectSprMonthlyRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RejectSprMonthlyRecordInput): Promise<SprMonthlyRecordResponse> =>
      rejectSprMonthlyRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['spr', 'monthly-records'] });
      await queryClient.invalidateQueries({ queryKey: ['spr', 'record-approvals'] });
    },
  });
}
