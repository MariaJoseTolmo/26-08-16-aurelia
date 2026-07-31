import { useQuery } from '@tanstack/react-query';
import type { SprSignerPersonResponse, SprSignersResponse } from '@aurelia/contracts';
import { getSprSigners } from '../services/spr.service';

const EMPTY_SIGNERS: SprSignersResponse = { specialists: [], managers: [] };

/**
 * Roster real de firmantes SPR (GET /spr/signers).
 * specialists → SPR_SUSTAINABILITY_SPECIALIST
 * managers → SPR_ENVIRONMENT_MANAGER
 */
export function useSprSigners() {
  const query = useQuery({
    queryKey: ['spr', 'signers'],
    queryFn: getSprSigners,
    staleTime: 60_000,
  });

  const signers: SprSignersResponse =
    query.isLoading || query.isError ? EMPTY_SIGNERS : (query.data ?? EMPTY_SIGNERS);

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    specialists: signers.specialists as SprSignerPersonResponse[],
    managers: signers.managers as SprSignerPersonResponse[],
    signers,
  };
}
