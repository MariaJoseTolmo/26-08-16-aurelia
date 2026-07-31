import { useQuery } from '@tanstack/react-query';
import type { SprCycleResponse } from '@aurelia/contracts';
import { getSprCycles } from '../services/spr.service';
import {
  buildSprReportDay9CountdownFromCycle,
  type SprReportDay9Countdown,
} from '../../modules/spr/sprReportDay9';

/**
 * Ciclo SPR real desde GET /spr/cycles?periodYear&periodMonth.
 * Countdown usa day9At del backend (no cálculo local por periodo).
 * Si no hay fila o falla el fetch: isError — no inventar fecha.
 */
export function useSprCycle(periodYear: number, periodMonth: number) {
  const query = useQuery({
    queryKey: ['spr', 'cycles', periodYear, periodMonth],
    queryFn: () => getSprCycles({ periodYear, periodMonth }),
    staleTime: 60_000,
  });

  const sprCycle: SprCycleResponse | null =
    !query.isLoading && !query.isError && query.data && query.data.length > 0 ? query.data[0] : null;

  const missingCycle = !query.isLoading && !query.isError && Array.isArray(query.data) && query.data.length === 0;

  let countdown: SprReportDay9Countdown | null = null;
  if (sprCycle) {
    try {
      countdown = buildSprReportDay9CountdownFromCycle(sprCycle.day9At, sprCycle.status);
    } catch {
      countdown = null;
    }
  }

  return {
    isLoading: query.isLoading,
    isError: query.isError || missingCycle || (Boolean(sprCycle) && !countdown),
    cycle: sprCycle,
    countdown,
  };
}
