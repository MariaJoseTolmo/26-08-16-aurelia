import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSprCycleValidationRequest,
  ReopenSprCycleValidationRequest,
  SprCycleValidationResponse,
} from '@aurelia/contracts';
import {
  createSprCycleValidation,
  getSprCycleValidations,
  reopenSprCycleValidation,
} from '../services/spr.service';

/**
 * Validaciones SOX del ciclo (Fase 5).
 * Sin filas → [] (honesto: nadie ha decidido aún).
 */
export function useSprCycleValidations(cycleId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['spr', 'cycles', cycleId, 'validations'],
    queryFn: () => getSprCycleValidations(cycleId as string),
    enabled: Boolean(cycleId),
    staleTime: 30_000,
  });

  const validations: SprCycleValidationResponse[] =
    query.isLoading || query.isError ? [] : (query.data ?? []);

  return {
    isLoading: Boolean(cycleId) && query.isLoading,
    isError: query.isError,
    validations,
  };
}

export function useCreateSprCycleValidation(cycleId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSprCycleValidationRequest): Promise<SprCycleValidationResponse> => {
      if (!cycleId) throw new Error('Cycle id is required to create a validation');
      return createSprCycleValidation(cycleId, payload);
    },
    onSuccess: async () => {
      if (!cycleId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles', cycleId, 'validations'] }),
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles'] }),
      ]);
    },
  });
}

export function useReopenSprCycleValidation(cycleId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      areaId: string;
      payload?: ReopenSprCycleValidationRequest;
    }): Promise<SprCycleValidationResponse> => {
      if (!cycleId) throw new Error('Cycle id is required to reopen a validation');
      return reopenSprCycleValidation(cycleId, args.areaId, args.payload ?? {});
    },
    onSuccess: async () => {
      if (!cycleId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles', cycleId, 'validations'] }),
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles', cycleId, 'signatures'] }),
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles'] }),
        queryClient.invalidateQueries({ queryKey: ['spr', 'monthly-records'] }),
      ]);
    },
  });
}
