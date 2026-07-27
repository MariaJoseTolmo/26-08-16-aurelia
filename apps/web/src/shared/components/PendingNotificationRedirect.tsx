import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  consumePendingNotificationRoute,
  safeApplicationRoute,
} from '../services/notification-deep-link.service';

export function PendingNotificationRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const route = safeApplicationRoute(consumePendingNotificationRoute());
    if (!route || route === location.pathname + location.search) return;
    navigate(route, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return null;
}
