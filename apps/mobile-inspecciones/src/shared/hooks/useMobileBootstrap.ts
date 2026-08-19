import { useQuery } from '@tanstack/react-query';
import { getMobileBootstrapLocalFirst } from '../offline/local-catalogs';

export const mobileBootstrapKeys = {
  bootstrap: ['mobile-inspecciones', 'mobile-bootstrap'] as const,
};

export function useMobileBootstrap() {
  return useQuery({
    queryKey: mobileBootstrapKeys.bootstrap,
    queryFn: getMobileBootstrapLocalFirst,
  });
}
