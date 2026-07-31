import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SprCycleSignatureLevel,
  SprCycleSignatureStatus,
  type CreateSprCycleSignatureRequest,
  type SprCycleSignatureResponse,
} from '@aurelia/contracts';
import { createSprCycleSignature, getSprCycleSignatures } from '../services/spr.service';

/**
 * Firmas del ciclo SPR (Fase 3).
 * Sin filas → [] (honesto: nadie ha firmado aún).
 */
export function useSprCycleSignatures(cycleId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['spr', 'cycles', cycleId, 'signatures'],
    queryFn: () => getSprCycleSignatures(cycleId as string),
    enabled: Boolean(cycleId),
    staleTime: 30_000,
  });

  const signatures: SprCycleSignatureResponse[] =
    query.isLoading || query.isError ? [] : (query.data ?? []);

  return {
    isLoading: Boolean(cycleId) && query.isLoading,
    isError: query.isError,
    signatures,
  };
}

export function useCreateSprCycleSignature(cycleId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSprCycleSignatureRequest): Promise<SprCycleSignatureResponse> => {
      if (!cycleId) throw new Error('Cycle id is required to create a signature');
      return createSprCycleSignature(cycleId, payload);
    },
    onSuccess: async () => {
      if (!cycleId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles', cycleId, 'signatures'] }),
        queryClient.invalidateQueries({ queryKey: ['spr', 'cycles'] }),
      ]);
    },
  });
}

export function isSignedSprLevel(
  signatures: SprCycleSignatureResponse[],
  level: SprCycleSignatureLevel,
): boolean {
  return signatures.some(
    (signature) =>
      signature.level === level && signature.status === SprCycleSignatureStatus.SIGNED,
  );
}
