import { useQuery } from '@tanstack/react-query';
import { getSprUnits } from '../services/spr.service';

export function useSprUnits() {
  return useQuery({
    queryKey: ['spr', 'units'],
    queryFn: getSprUnits,
  });
}
