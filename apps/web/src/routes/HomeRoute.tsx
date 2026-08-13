import { Navigate } from 'react-router-dom';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { useIsWasteWithdrawer } from '../shared/stores/simulated-role.store';

/**
 * Landing de `/` según el rol.
 *
 * El retirador de residuos no ve el dashboard general: su página principal es
 * el histórico de retiros (nodo Figma `2999:4882`). Se redirige en lugar de
 * renderizar la vista acá para que la URL sea la real del módulo y el sidebar
 * contextual resuelva Residuos como módulo activo.
 */
export function HomeRoute() {
  const isWasteWithdrawer = useIsWasteWithdrawer();

  if (isWasteWithdrawer) return <Navigate to="/waste/solicitud-retiro" replace />;

  return <DashboardPage />;
}
