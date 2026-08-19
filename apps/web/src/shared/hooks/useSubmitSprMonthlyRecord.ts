import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SprMonthlyRecordResponse, SprRecordActionRequest } from '@aurelia/contracts';
import { submitSprMonthlyRecord } from '../services/spr.service';

export interface SubmitSprMonthlyRecordInput {
  recordId: string;
  payload?: SprRecordActionRequest;
}

export function useSubmitSprMonthlyRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitSprMonthlyRecordInput): Promise<SprMonthlyRecordResponse> =>
      submitSprMonthlyRecord(input.recordId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['spr', 'monthly-records'] });
    },
  });
}
