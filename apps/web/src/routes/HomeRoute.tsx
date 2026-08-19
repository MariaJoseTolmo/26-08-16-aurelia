import { Navigate } from 'react-router-dom';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { useIsWasteEnvApprover, useIsWasteWithdrawer } from '../shared/stores/simulated-role.store';

/**
 * Landing de `/` según el rol.
 *
 * Ni el retirador ni el aprobador de Medio Ambiente ven el dashboard general: su
 * página principal es la del módulo de residuos —el histórico de retiros (nodo
 * `2999:4882`) y el Dashboard Residuos (nodo `3086:13957`), respectivamente—. Se
 * redirige en lugar de renderizar la vista acá para que la URL sea la real del
 * módulo y el sidebar contextual resuelva Residuos como módulo activo.
 */
export function HomeRoute() {
  const isWasteWithdrawer = useIsWasteWithdrawer();
  const isWasteEnvApprover = useIsWasteEnvApprover();

  if (isWasteWithdrawer) return <Navigate to="/waste/solicitud-retiro" replace />;
  if (isWasteEnvApprover) return <Navigate to="/waste/dashboard" replace />;

  return <DashboardPage />;
}
