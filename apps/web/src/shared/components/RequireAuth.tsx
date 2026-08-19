import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getMe } from '../services/auth.service';
import { useSessionStore } from '../stores/session.store';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const token = useSessionStore((state) => state.token);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      hydrateSession();
    }
  }, [hydrated, hydrateSession]);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      if (!hydrated) {
        return;
      }

      if (!token) {
        if (!cancelled) {
          setIsSessionValid(false);
          setIsChecking(false);
        }
        return;
      }

      if (!cancelled) {
        setIsChecking(true);
      }

      try {
        await getMe();
        if (!cancelled) {
          setIsSessionValid(true);
        }
      } catch {
        clearSession();
        if (!cancelled) {
          setIsSessionValid(false);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession, hydrated, token]);

  if (!hydrated || isChecking) {
    return null;
  }

  if (!isSessionValid) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}