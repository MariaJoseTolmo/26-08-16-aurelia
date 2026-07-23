import { Outlet } from 'react-router-dom';
import { PendingNotificationRedirect } from '../shared/components/PendingNotificationRedirect';

const RouterOutlet = Outlet as unknown as () => JSX.Element | null;

export function App() {
  return (
    <>
      <PendingNotificationRedirect />
      <RouterOutlet />
    </>
  );
}
