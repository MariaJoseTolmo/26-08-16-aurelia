import { Role } from '@aurelia/contracts';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../stores/session.store';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const user = useSessionStore((state) => state.user);
  const location = useLocation();
  const roles = user?.roles ?? [];

  if (!roles.includes(Role.ADMIN)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}
