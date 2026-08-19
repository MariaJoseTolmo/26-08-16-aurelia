import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginResponse } from '@aurelia/contracts';
import svgPaths from './svg-login';
import loginBg from './login-bg.png';
import { useLoginMutation } from '../../shared/hooks/useLoginMutation';
import { getMe } from '../../shared/services/auth.service';
import { useSessionStore } from '../../shared/stores/session.store';

function AureliaLogo() {
  const pieces = [
    { path: svgPaths.p2e0f7480, w: 58.312, h: 59, ml: 0, mt: 0, vb: '0 0 58.3117 59' },
    { path: svgPaths.p20c0fe00, w: 8.131, h: 5.792, ml: 37.14, mt: 11.2, vb: '0 0 8.13112 5.792' },
    { path: svgPaths.pe6b6f00, w: 5.16, h: 4.775, ml: 39.86, mt: 19.77, vb: '0 0 5.16027 4.77549' },
    { path: svgPaths.p3c258ef0, w: 4.102, h: 7.666, ml: 40.8, mt: 26.82, vb: '0 0 4.10242 7.66619' },
    { path: svgPaths.p12fc9500, w: 21.071, h: 13.903, ml: 19.66, mt: 16.76, vb: '0 0 21.0714 13.9029' },
    { path: svgPaths.p180c3880, w: 5.686, h: 3.531, ml: 33.2, mt: 11.85, vb: '0 0 5.68611 3.53053' },
    { path: svgPaths.p1b437e80, w: 6.608, h: 6.396, ml: 22.7, mt: 29.51, vb: '0 0 6.60772 6.39555' },
    { path: svgPaths.p197b6d40, w: 3.058, h: 7.497, ml: 30.56, mt: 40.39, vb: '0 0 3.05808 7.49677' },
    { path: svgPaths.p10691c00, w: 3.777, h: 10.324, ml: 33.87, mt: 36.83, vb: '0 0 3.7774 10.3239' },
    { path: svgPaths.p2d539d00, w: 3.058, h: 7.486, ml: 26.77, mt: 40.38, vb: '0 0 3.05754 7.48618' },
    { path: svgPaths.p39c31410, w: 4.269, h: 11.425, ml: 18.7, mt: 34.14, vb: '0 0 4.26894 11.4252' },
    { path: svgPaths.p289d3e0, w: 4.264, h: 11.425, ml: 37.41, mt: 34.13, vb: '0 0 4.26386 11.4252' },
    { path: svgPaths.p18adb880, w: 4.961, h: 10.853, ml: 16.18, mt: 30.19, vb: '0 0 4.96066 10.8534' },
    { path: svgPaths.p296a8500, w: 3.788, h: 10.324, ml: 22.75, mt: 36.83, vb: '0 0 3.78758 10.3239' },
    { path: svgPaths.p3d489780, w: 3.833, h: 3.494, ml: 30.67, mt: 11.89, vb: '0 0 3.8331 3.49428' },
    { path: svgPaths.p73a0480, w: 3.05, h: 5.58, ml: 41.79, mt: 23.54, vb: '0 0 3.04953 5.58022' },
    { path: svgPaths.p2d8280, w: 7.1, h: 3.407, ml: 37.77, mt: 16.5, vb: '0 0 7.09998 3.4075' },
    { path: svgPaths.p2ad93cf0, w: 5.177, h: 4.786, ml: 15.37, mt: 19.77, vb: '0 0 5.17698 4.78607' },
    { path: svgPaths.pe69e800, w: 8.144, h: 5.792, ml: 15.11, mt: 11.2, vb: '0 0 8.14384 5.792' },
    { path: svgPaths.p2150b900, w: 3.05, h: 5.591, ml: 15.55, mt: 23.55, vb: '0 0 3.04953 5.59081' },
    { path: svgPaths.p3a41ff80, w: 4.116, h: 7.666, ml: 15.47, mt: 26.81, vb: '0 0 4.11571 7.66619' },
    { path: svgPaths.p1ed60900, w: 8.27, h: 5.898, ml: 26.02, mt: 33.83, vb: '0 0 8.26974 5.89788' },
    { path: svgPaths.p27ee9100, w: 6.608, h: 6.396, ml: 30.99, mt: 29.51, vb: '0 0 6.60754 6.39555' },
    { path: svgPaths.p1f62b000, w: 5.665, h: 3.541, ml: 21.52, mt: 11.85, vb: '0 0 5.66493 3.54098' },
    { path: svgPaths.p2537b780, w: 4.954, h: 10.853, ml: 39.25, mt: 30.19, vb: '0 0 4.95388 10.8534' },
    { path: svgPaths.p2cd59800, w: 7.099, h: 3.418, ml: 15.53, mt: 16.5, vb: '0 0 7.099 3.41809' },
    { path: svgPaths.p3abd2000, w: 3.833, h: 3.494, ml: 25.87, mt: 11.89, vb: '0 0 3.83309 3.49428' },
    { path: svgPaths.p1441b400, w: 2.647, h: 5.644, ml: 137.67, mt: 17.5, vb: '0 0 2.64716 5.64376' },
    { path: svgPaths.p31c27e00, w: 6.819, h: 6.184, ml: 143.05, mt: 17.21, vb: '0 0 6.8191 6.18378' },
    { path: svgPaths.p281a4100, w: 7.137, h: 5.93, ml: 152.18, mt: 17.5, vb: '0 0 7.13674 5.92965' },
    { path: svgPaths.pf1ea800, w: 7.751, h: 5.644, ml: 161.29, mt: 17.52, vb: '0 0 7.75091 5.64375' },
    { path: svgPaths.p301c9a00, w: 7.454, h: 5.771, ml: 170.57, mt: 17.43, vb: '0 0 7.45442 5.77082' },
    { path: svgPaths.p33f62540, w: 3.579, h: 3.113, ml: 108.32, mt: 18.52, vb: '0 0 3.57896 3.11307' },
    { path: svgPaths.p12caf900, w: 4.235, h: 3.155, ml: 88.57, mt: 18.5, vb: '0 0 4.23546 3.15542' },
    { path: svgPaths.p25a02580, w: 11.023, h: 9.371, ml: 124.27, mt: 13.8, vb: '0 0 11.0228 9.37097' },
    { path: svgPaths.p1f4f5900, w: 117.396, h: 14.676, ml: 65.02, mt: 10.89, vb: '0 0 117.396 14.6759' },
  ];

  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: 'max-content', gridTemplateRows: 'max-content', lineHeight: 0, placeItems: 'start', position: 'relative', flexShrink: 0 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'relative', gridColumn: '1', gridRow: '1', width: p.w, height: p.h, marginLeft: p.ml, marginTop: p.mt }}>
          <svg style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox={p.vb}>
            <path d={p.path} fill="#24588B" />
          </svg>
        </div>
      ))}
      <div style={{ gridColumn: '1', gridRow: '1', marginLeft: 64.09, marginTop: 29.12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 18.487, letterSpacing: 4.6217, textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: '18.487px' }}>
          <span style={{ color: '#6e87a7' }}>AUREL</span>
          <span style={{ color: '#c8a064' }}>IA</span>
        </p>
      </div>
    </div>
  );
}

function GoldFieldsLogo() {
  const paths = [
    svgPaths.p3cfdf80, svgPaths.p1d7acd00, svgPaths.p1c85e800, svgPaths.p1de69280,
    svgPaths.p5210a80, svgPaths.p1d300100, svgPaths.p1824dd00, svgPaths.p1960b600,
    svgPaths.p376f5b80, svgPaths.p23cac700, svgPaths.p3adece80, svgPaths.p1bcf4a00,
    svgPaths.p10eb2700, svgPaths.p36e5ce00, svgPaths.p347a6800, svgPaths.pabbf700,
    svgPaths.p1b2ae980, svgPaths.p2c12c900, svgPaths.p1f0e1d40, svgPaths.p121af080,
    svgPaths.p2e011100, svgPaths.p2b28ee00, svgPaths.p374a6600, svgPaths.p5dac100,
    svgPaths.p318de680, svgPaths.p3a615f00,
  ];

  return (
    <svg style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 85 85">
      {paths.map((d, i) => <path key={i} d={d} fill="white" />)}
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg style={{ display: 'block', width: '100%', height: '100%' }} fill="none" viewBox="0 0 18 14">
      {visible ? (
        <path d={svgPaths.p2c96d600} fill="#00B398" />
      ) : (
        <>
          <path d="M1 7C1 7 3.5 2 9 2C14.5 2 17 7 17 7C17 7 14.5 12 9 12C3.5 12 1 7 1 7Z" stroke="#00B398" strokeWidth="1.5" fill="none" />
          <line x1="2" y1="1" x2="16" y2="13" stroke="#00B398" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const token = useSessionStore((state) => state.token);
  const clearSession = useSessionStore((state) => state.clearSession);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    let cancelled = false;

    async function validateBeforeRedirect() {
      if (!token) {
        return;
      }

      try {
        await getMe();
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      } catch {
        clearSession();
      }
    }

    void validateBeforeRedirect();

    return () => {
      cancelled = true;
    };
  }, [clearSession, navigate, token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const response = await loginMutation.mutateAsync({ email: email.trim(), password });
      setSession(response as LoginResponse);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('401') || message.toLowerCase().includes('invalid credentials')) {
        setError('Credenciales incorrectas. Verifique su usuario y contraseña.');
      } else {
        setError('No se pudo conectar con la API de autenticación. Verifique que el backend esté levantado.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: CSSProperties = {
    height: 40,
    background: '#f6faff',
    border: '1px solid #d1d1d1',
    borderRadius: 8,
    padding: '0 8px',
    fontSize: 14,
    color: '#131313',
    letterSpacing: 0.28,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'Calibri, Inter, system-ui, sans-serif',
    lineHeight: '22.7px',
  };

  const labelStyle: CSSProperties = {
    fontFamily: 'Calibri, Inter, system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    color: '#131313',
    letterSpacing: 0.28,
    lineHeight: '22.7px',
  };

  const isPending = loading || loginMutation.isPending;

  return (
    <div style={{ display: 'grid', height: '100vh', minHeight: 640, gridTemplateColumns: 'minmax(0, 66.838%) minmax(360px, 33.162%)', background: '#fff', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <section style={{ position: 'relative', minWidth: 0, overflow: 'hidden', background: '#fff' }}>
        <div style={{ position: 'absolute', left: '50%', top: 69, transform: 'translateX(-50%)', width: 709, maxWidth: 'calc(100% - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
          <AureliaLogo />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', textAlign: 'center', color: '#131313' }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#131313', letterSpacing: 0.48, lineHeight: '29px', width: '100%' }}>
                Le damos la bienvenida a <span style={{ color: '#24588b' }}>AurelIA</span>
              </p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 400, color: '#131313', letterSpacing: 0.32, lineHeight: '25.9px', width: '100%' }}>
                Sistema de gestión ambiental
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ width: 449, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 16, width: '100%' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                  <span style={labelStyle}>Nombre de usuario</span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EsRiva"
                    autoComplete="username"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                  <span style={labelStyle}>Contraseña</span>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="************"
                      autoComplete="current-password"
                      required
                      style={{ ...inputStyle, paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <div style={{ width: 18, height: 14 }}>
                        <EyeIcon visible={showPassword} />
                      </div>
                    </button>
                  </div>
                  <span style={{ display: 'block', height: 23, width: '100%' }} />
                </label>

                <button
                  type="button"
                  style={{ height: 24, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Calibri, Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, color: '#c8a064', textDecoration: 'underline', letterSpacing: 0.28, lineHeight: '22.7px', textAlign: 'right' }}
                >
                  Recuperar contraseña
                </button>
              </div>

              {error ? (
                <p style={{ margin: 0, fontSize: 12, color: '#a14c4c', textAlign: 'center', background: '#fbefef', padding: '10px 12px', borderRadius: 8, lineHeight: 1.45 }}>
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                style={{ height: 39, background: isPending ? '#d4b07a' : '#c8a064', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Calibri, Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: 0.28, lineHeight: '22.7px', cursor: isPending ? 'not-allowed' : 'pointer', width: '100%', transition: 'background 0.15s' }}
              >
                {isPending ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button type="button" style={{ height: 32, background: '#fff', borderRadius: '8px 0 0 8px', border: '1px solid #d1d1d1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Montserrat, Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 14, color: '#131313', lineHeight: '22.7px' }}>
                EN
              </button>
              <button type="button" style={{ height: 32, background: '#c8a064', borderRadius: '0 8px 8px 0', border: '1px solid #c8a064', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Montserrat, Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: '22.7px' }}>
                ES
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside style={{ position: 'relative', overflow: 'hidden', minHeight: 320, background: '#001d39' }}>
        <img src={loginBg} alt="" style={{ position: 'absolute', left: 0, top: -2, width: '266.5%', height: 'calc(100% + 1px)', objectFit: 'cover', pointerEvents: 'none', maxWidth: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #001D39 0.02%, #00B398 129.83%)', mixBlendMode: 'overlay' }} />
        <div style={{ position: 'absolute', left: 'calc(50% + 4px)', top: '76.25%', transform: 'translateX(-50%)', width: 303, height: 85, background: 'rgba(0, 29, 57, 0.75)', borderRadius: 8, overflow: 'hidden' }}>
          <p style={{ position: 'absolute', left: 24.5, top: 22.75, width: 140, margin: 0, color: '#fff', fontFamily: 'Calibri, Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 700, lineHeight: '19.4px', letterSpacing: 0.24 }}>
            Una aplicación interna de Gold Fields
          </p>
          <div style={{ position: 'absolute', left: 200, top: 0, width: 85, height: 85 }}>
            <GoldFieldsLogo />
          </div>
        </div>
      </aside>
    </div>
  );
}