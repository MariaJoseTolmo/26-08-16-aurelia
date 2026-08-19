import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSimulatedRoleStore } from '../stores/simulated-role.store';

/**
 * Mantiene el rol simulado en sincronía con el query param mientras se navega.
 *
 * El store ya se inicializa con la URL de entrada; esto cubre los cambios
 * posteriores —pegar `?role=WASTE_WITHDRAWER` o `?role=` sin recargar—.
 */
export function SimulatedRoleSync() {
  const location = useLocation();
  const syncFromSearch = useSimulatedRoleStore((state) => state.syncFromSearch);

  useEffect(() => {
    syncFromSearch(location.search);
  }, [location.search, syncFromSearch]);

  return null;
}
