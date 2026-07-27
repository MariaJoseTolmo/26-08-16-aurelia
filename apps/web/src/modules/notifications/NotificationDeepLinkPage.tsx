import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../../shared/stores/session.store';
import {
  resolveNotificationDeepLink,
  safeApplicationRoute,
  savePendingNotificationRoute,
} from '../../shared/services/notification-deep-link.service';

type ResolutionState = 'loading' | 'invalid' | 'expired' | 'error';

export function NotificationDeepLinkPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const sessionToken = useSessionStore((state) => state.token);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const [state, setState] = useState<ResolutionState>('loading');

  useEffect(() => {
    if (!hydrated) hydrateSession();
  }, [hydrateSession, hydrated]);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;

    async function resolveLink() {
      try {
        const result = await resolveNotificationDeepLink(token);
        if (cancelled) return;
        const route = safeApplicationRoute(result.route);
        if (result.status === 'expired') {
          setState('expired');
          return;
        }
        if (result.status !== 'valid' || !route) {
          setState('invalid');
          return;
        }

        if (!sessionToken && result.requiresLogin) {
          savePendingNotificationRoute(route);
          navigate('/login', { replace: true });
          return;
        }

        navigate(route, { replace: true });
      } catch {
        if (!cancelled) setState('error');
      }
    }

    void resolveLink();
    return () => {
      cancelled = true;
    };
  }, [hydrated, navigate, sessionToken, token]);

  const copy = state === 'expired'
    ? 'Este enlace expiró. Ingresa a AurelIA y abre la notificación desde la bandeja.'
    : state === 'invalid'
      ? 'El enlace de notificación no es válido.'
      : state === 'error'
        ? 'No fue posible abrir la notificación. Intenta nuevamente desde AurelIA.'
        : 'Abriendo notificación…';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-6">
      <section className="w-full max-w-[420px] rounded-2xl border border-[#e3e3e3] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#001e39]">Notificación AurelIA</h1>
        <p className="mt-3 text-sm leading-6 text-[#646464]">{copy}</p>
        {state !== 'loading' ? (
          <button
            type="button"
            className="mt-6 h-11 rounded-xl bg-[#c8a064] px-6 text-sm font-bold text-white"
            onClick={() => navigate(sessionToken ? '/' : '/login', { replace: true })}
          >
            Continuar
          </button>
        ) : null}
      </section>
    </main>
  );
}
