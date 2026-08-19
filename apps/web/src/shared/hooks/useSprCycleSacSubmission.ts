import { useQuery } from '@tanstack/react-query';
import type { SprCycleSacSubmissionResponse } from '@aurelia/contracts';
import { getSprCycleSacSubmissionOrNull } from '../services/spr.service';

/**
 * Submission SAC del ciclo (Fase 2).
 * 404 / sin fila → submission null (honesto: no hay envío registrado).
 */
export function useSprCycleSacSubmission(cycleId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['spr', 'cycles', cycleId, 'sac'],
    queryFn: () => getSprCycleSacSubmissionOrNull(cycleId as string),
    enabled: Boolean(cycleId),
    staleTime: 30_000,
    retry: false,
  });

  const submission: SprCycleSacSubmissionResponse | null =
    query.isLoading || query.isError ? null : (query.data ?? null);

  return {
    isLoading: Boolean(cycleId) && query.isLoading,
    isError: query.isError,
    submission,
    /** true cuando el GET terminó y no hay fila (404). */
    isMissing: Boolean(cycleId) && !query.isLoading && !query.isError && query.data === null,
  };
}
