import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSprMonthlyRecordRequest,
  SprMonthlyRecordResponse,
  UpdateSprMonthlyRecordRequest,
} from '@aurelia/contracts';
import { createSprMonthlyRecord, updateSprMonthlyRecord } from '../services/spr.service';

export type SaveSprMonthlyRecordInput =
  | { mode: 'create'; payload: CreateSprMonthlyRecordRequest }
  | { mode: 'update'; recordId: string; payload: UpdateSprMonthlyRecordRequest };

export function useSaveSprMonthlyRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveSprMonthlyRecordInput): Promise<SprMonthlyRecordResponse> => {
      if (input.mode === 'create') return createSprMonthlyRecord(input.payload);
      return updateSprMonthlyRecord(input.recordId, input.payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['spr', 'monthly-records'] });
    },
  });
}
