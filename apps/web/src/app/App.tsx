import { Outlet } from 'react-router-dom';
import { PendingNotificationRedirect } from '../shared/components/PendingNotificationRedirect';
import { SimulatedRoleSync } from '../shared/components/SimulatedRoleSync';

const RouterOutlet = Outlet as unknown as () => JSX.Element | null;

export function App() {
  return (
    <>
      <SimulatedRoleSync />
      <PendingNotificationRedirect />
      <RouterOutlet />
    </>
  );
}
