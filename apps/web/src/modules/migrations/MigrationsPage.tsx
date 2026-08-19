import { useEffect, useMemo, useState } from 'react';
import {
  getDatabaseMaintenancePlan,
  runDatabaseMaintenance,
  type DatabaseMaintenancePlanResponse,
  type DatabaseMaintenanceRunResponse,
} from '../../shared/services/database-maintenance.service';

/** Etiquetas legibles para la lista de seeds en /migrations. */
const SEED_CATALOG: Record<string, { label: string; description: string }> = {
  bootstrap: {
    label: 'bootstrap',
    description: 'Cadena completa de seeds base (phase1 → demo → … → notificaciones).',
  },
  phase1: {
    label: 'phase1',
    description: 'Roles, permisos y datos estructurales iniciales.',
  },
  demo: {
    label: 'demo',
    description: 'Usuarios y áreas demo Gold Fields / contratistas.',
  },
  'finding-classifications': {
    label: 'finding-classifications',
    description: 'Clasificaciones de hallazgos de inspección.',
  },
  responsibles: {
    label: 'responsibles',
    description: 'Responsables de hallazgos / follow-ups.',
  },
  'dev-password-reset': {
    label: 'dev-password-reset',
    description: 'Reset de password demo (AureliaDemo123!) en usuarios conocidos.',
  },
  'notifications-permissions': {
    label: 'notifications-permissions',
    description: 'Permisos de notificaciones por rol.',
  },
  'inspections-master': {
    label: 'inspections-master',
    description: 'Master data de inspecciones.',
  },
  'spr-homology': {
    label: 'spr-homology',
    description:
      'Homologación SPR: usuarios reales (matriz de negocio), áreas, factores y assignments. Password AureliaDemo123!.',
  },
};

function seedMeta(seed: string): { label: string; description: string } {
  return (
    SEED_CATALOG[seed] ?? {
      label: seed,
      description: 'Seed registrado en el backend.',
    }
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ready':
      return 'Listo para ejecutar';
    case 'applied':
      return 'Aplicado';
    case 'failed':
      return 'Falló';
    case 'review_required':
      return 'Requiere revisión';
    case 'noop':
      return 'Sin cambios';
    default:
      return status;
  }
}

function statusTone(status: string): string {
  switch (status) {
    case 'ready':
    case 'applied':
      return '#00b398';
    case 'failed':
      return '#c4365a';
    case 'review_required':
      return '#c8a064';
    case 'noop':
      return '#6e87a7';
    default:
      return '#6e87a7';
  }
}

export function MigrationsPage() {
  const [plan, setPlan] = useState<DatabaseMaintenancePlanResponse | null>(null);
  const [runResult, setRunResult] = useState<DatabaseMaintenanceRunResponse | null>(null);
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setLoadingPlan(true);
      setError(null);

      try {
        const response = await getDatabaseMaintenancePlan();
        if (!cancelled) {
          setPlan(response);
          setSelectedSeeds((current) => {
            if (current.length > 0) {
              return current.filter((seed) => response.availableSeeds.includes(seed));
            }
            return current;
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el plan');
        }
      } finally {
        if (!cancelled) {
          setLoadingPlan(false);
        }
      }
    }

    void loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  const activePlan = runResult ?? plan;

  const summaryCards = useMemo(() => [
    {
      label: 'Estado',
      value: activePlan ? statusLabel(activePlan.migration.status) : 'Sin análisis',
      tone: activePlan ? statusTone(activePlan.migration.status) : '#6e87a7',
    },
    {
      label: 'Migraciones detectadas',
      value: activePlan ? String(activePlan.migration.upQueries) : '0',
      tone: '#c8a064',
    },
    {
      label: 'Consultas de riesgo',
      value: activePlan ? String(activePlan.migration.riskyQueries.length) : '0',
      tone: '#c4365a',
    },
    {
      label: 'Seeds disponibles',
      value: activePlan ? String(activePlan.availableSeeds.length) : '0',
      tone: '#24588b',
    },
  ], [activePlan]);

  async function handleRunMaintenance() {
    await executeMaintenance(false);
  }

  async function handleForceRunMaintenance() {
    await executeMaintenance(true);
  }

  async function handleRunSeedsOnly() {
    await executeMaintenance(false, {
      runSeedsOnly: true,
    });
  }

  async function handleResetAndRunMaintenance() {
    const confirmation = window.prompt('Esto borrara TODO el esquema public de DEV. Escribe RESET_DEV_SCHEMA para confirmar.');
    if (confirmation !== 'RESET_DEV_SCHEMA') {
      setError('Confirmacion invalida. No se ejecuto el reset.');
      return;
    }

    await executeMaintenance(false, {
      resetSchema: true,
      resetConfirmation: confirmation,
    });
  }

  async function executeMaintenance(
    allowRisky: boolean,
    extraPayload?: { resetSchema?: boolean; resetConfirmation?: string; runSeedsOnly?: boolean },
  ) {
    setLoadingRun(true);
    setError(null);

    try {
      const response = await runDatabaseMaintenance({ seeds: selectedSeeds, allowRisky, ...extraPayload });
      setRunResult(response);

      if (response.migration.status !== 'failed') {
        setPlan({
          migration: {
            status: response.migration.status === 'applied' ? 'noop' : response.migration.status,
            filePath: response.migration.filePath,
            migrationName: response.migration.migrationName,
            upQueries: response.migration.upQueries,
            downQueries: response.migration.downQueries,
            riskyQueries: response.migration.riskyQueries,
          },
          availableSeeds: response.availableSeeds,
        });
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'No se pudo ejecutar la mantenimiento');
    } finally {
      setLoadingRun(false);
    }
  }

  async function handleRefreshPlan() {
    setLoadingPlan(true);
    setError(null);

    try {
      const response = await getDatabaseMaintenancePlan();
      setPlan(response);
      setRunResult(null);
      setSelectedSeeds((current) => current.filter((seed) => response.availableSeeds.includes(seed)));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'No se pudo refrescar el plan');
    } finally {
      setLoadingPlan(false);
    }
  }

  function toggleSeed(seed: string) {
    setSelectedSeeds((current) => (
      current.includes(seed)
        ? current.filter((item) => item !== seed)
        : [...current, seed]
    ));
  }

  function selectAllSeeds() {
    setSelectedSeeds(plan?.availableSeeds ?? []);
  }

  function clearSeeds() {
    setSelectedSeeds([]);
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, background: 'linear-gradient(180deg, #f6faff 0%, #eef4fb 100%)' }}>
      <section style={{ borderRadius: 24, padding: 24, background: 'linear-gradient(135deg, #012659 0%, #004a3a 100%)', color: '#ffffff', boxShadow: '0 20px 50px rgba(1, 38, 89, 0.18)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>Mantenimiento de BD</p>
            <h1 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1.05 }}>Migraciones y seeds</h1>
            <p style={{ margin: 0, maxWidth: 760, fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)' }}>
              Ruta oculta para operar el plan de esquema, generar la migration automática y ejecutar seeds controlados sin salir de la app.
            </p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: statusTone(activePlan?.migration.status ?? 'noop') }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{activePlan ? statusLabel(activePlan.migration.status) : 'Cargando estado'}</span>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 16, marginTop: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {summaryCards.map((card) => (
          <article key={card.label} style={{ borderRadius: 20, background: '#ffffff', border: '1px solid rgba(12, 31, 56, 0.08)', boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)', padding: 18 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6a7f95' }}>{card.label}</p>
            <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1, fontWeight: 800, color: card.tone }}>{card.value}</div>
          </article>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, marginTop: 18, gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)' }}>
        <section style={{ borderRadius: 20, background: '#ffffff', border: '1px solid rgba(12, 31, 56, 0.08)', boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, color: '#001e39' }}>Plan detectado</h2>
              <p style={{ margin: '6px 0 0', color: '#617183', fontSize: 14 }}>Vista previa antes de aplicar. Si el diff es seguro, el backend lo ejecuta; si detecta algo raro, solo devuelve el plan.</p>
            </div>
            <button type="button" onClick={handleRefreshPlan} disabled={loadingPlan} style={{ height: 42, padding: '0 16px', borderRadius: 12, border: '1px solid rgba(36, 88, 139, 0.18)', background: '#f4f8fc', color: '#24588b', fontWeight: 700, cursor: 'pointer' }}>
              {loadingPlan ? 'Analizando...' : 'Refrescar plan'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <InfoRow label="Estado" value={activePlan ? statusLabel(activePlan.migration.status) : 'Sin análisis'} tone={activePlan ? statusTone(activePlan.migration.status) : '#6e87a7'} />
            <InfoRow label="Migration name" value={activePlan?.migration.migrationName ?? 'N/A'} />
            <InfoRow label="Archivo generado" value={activePlan?.migration.filePath ?? 'N/A'} mono />
            <InfoRow label="Up queries" value={activePlan ? String(activePlan.migration.upQueries) : '0'} />
            <InfoRow label="Down queries" value={activePlan ? String(activePlan.migration.downQueries) : '0'} />
          </div>

          <div style={{ marginTop: 18 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#001e39' }}>Consultas de riesgo</p>
            <div style={{ minHeight: 76, borderRadius: 16, background: '#f7fbff', border: '1px dashed rgba(12, 31, 56, 0.14)', padding: 14, color: '#5e7388', fontSize: 14, lineHeight: 1.6 }}>
              {activePlan?.migration.riskyQueries.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {activePlan.migration.riskyQueries.map((query) => <li key={query} style={{ marginBottom: 8 }}>{query}</li>)}
                </ul>
              ) : (
                <span>{loadingPlan ? 'Cargando...' : 'No hay consultas marcadas como riesgosas.'}</span>
              )}
            </div>
          </div>

          {error ? <p style={{ margin: '14px 0 0', color: '#c4365a', fontSize: 14 }}>{error}</p> : null}
        </section>

        <aside style={{ borderRadius: 20, background: '#ffffff', border: '1px solid rgba(12, 31, 56, 0.08)', boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)', padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#001e39' }}>Seeds</h2>
          <p style={{ margin: '6px 0 16px', color: '#617183', fontSize: 14 }}>Selecciona los seeds que quieres ejecutar junto con la migration.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <button type="button" onClick={selectAllSeeds} style={seedActionButtonStyle}>Seleccionar todos</button>
            <button type="button" onClick={clearSeeds} style={seedActionButtonStyle}>Limpiar</button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {plan?.availableSeeds.length ? plan.availableSeeds.map((seed) => {
              const checked = selectedSeeds.includes(seed);
              const meta = seedMeta(seed);
              const isHomology = seed === 'spr-homology';
              return (
                <label
                  key={seed}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    borderRadius: 14,
                    border: isHomology
                      ? '1.5px solid rgba(0, 179, 152, 0.45)'
                      : '1px solid rgba(12, 31, 56, 0.08)',
                    padding: '12px 14px',
                    background: checked
                      ? 'rgba(0,179,152,0.08)'
                      : isHomology
                        ? 'rgba(0,179,152,0.04)'
                        : '#fbfdff',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSeed(seed)}
                      style={{ marginTop: 3 }}
                    />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, color: '#001e39' }}>
                        {meta.label}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          marginTop: 4,
                          fontSize: 12,
                          lineHeight: 1.45,
                          color: '#617183',
                        }}
                      >
                        {meta.description}
                      </span>
                    </span>
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      color: checked ? '#00b398' : '#7c8da1',
                      paddingTop: 2,
                    }}
                  >
                    {checked ? 'Seleccionado' : 'Disponible'}
                  </span>
                </label>
              );
            }) : <p style={{ color: '#617183', fontSize: 14 }}>No hay seeds listados todavía.</p>}
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            <button type="button" onClick={handleRunMaintenance} disabled={loadingRun} style={{ height: 46, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #00b398 0%, #24588b 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 24px rgba(0, 179, 152, 0.2)' }}>
              {loadingRun ? 'Ejecutando...' : 'Ejecutar mantenimiento'}
            </button>
            <button
              type="button"
              onClick={handleRunSeedsOnly}
              disabled={loadingRun}
              style={{ height: 44, borderRadius: 14, border: '1px solid rgba(36, 88, 139, 0.2)', background: '#f4f8fc', color: '#24588b', fontWeight: 800, cursor: 'pointer' }}
            >
              {loadingRun ? 'Ejecutando seeds...' : 'Ejecutar solo seeds'}
            </button>
            <button
              type="button"
              onClick={handleResetAndRunMaintenance}
              disabled={loadingRun}
              style={{ height: 44, borderRadius: 14, border: '1px solid rgba(196, 54, 90, 0.25)', background: '#fff6f8', color: '#c4365a', fontWeight: 800, cursor: 'pointer' }}
            >
              {loadingRun ? 'Reseteando schema...' : 'Reset DEV + migrar + seeds'}
            </button>
            {activePlan?.migration.status === 'review_required' ? (
              <button
                type="button"
                onClick={handleForceRunMaintenance}
                disabled={loadingRun}
                style={{ height: 44, borderRadius: 14, border: '1px solid rgba(196, 54, 90, 0.25)', background: '#fff6f8', color: '#c4365a', fontWeight: 800, cursor: 'pointer' }}
              >
                {loadingRun ? 'Ejecutando plan riesgoso...' : 'Forzar ejecución revisada'}
              </button>
            ) : null}
            <p style={{ margin: 0, color: '#617183', fontSize: 12, lineHeight: 1.55 }}>
              Si el backend detecta cambios seguros, aplicará la migration y luego correrá los seeds seleccionados.
            </p>
            <p style={{ margin: 0, color: '#24588b', fontSize: 12, lineHeight: 1.55 }}>
              "Ejecutar solo seeds" ignora el plan de esquema y ejecuta unicamente los seeds seleccionados.
            </p>
            <p style={{ margin: 0, color: '#c4365a', fontSize: 12, lineHeight: 1.55 }}>
              El boton de reset esta pensado solo para DEV cuando el esquema quedo en estado parcial. Borra todo el schema public y vuelve a reconstruirlo.
            </p>
            {activePlan?.migration.status === 'review_required' ? (
              <p style={{ margin: 0, color: '#c4365a', fontSize: 12, lineHeight: 1.55 }}>
                El botón de forzado ejecuta también planes con `DROP`, cambios de constraints o ajustes destructivos una vez revisados manualmente.
              </p>
            ) : null}
          </div>

          {runResult ? (
            <div style={{ marginTop: 18, borderRadius: 16, background: '#f7fbff', border: '1px solid rgba(12, 31, 56, 0.08)', padding: 14 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#001e39' }}>Última ejecución</p>
              <p style={{ margin: 0, fontSize: 13, color: '#617183', lineHeight: 1.6 }}>{statusLabel(runResult.migration.status)}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#617183' }}>{runResult.seeds.filter((seed) => seed.status === 'applied').length} seeds aplicados</p>
              {runResult.error ? (
                <div style={{ marginTop: 12, borderRadius: 12, border: '1px solid rgba(196, 54, 90, 0.18)', background: '#fff5f7', padding: 12, color: '#a42f4e' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>Error detectado</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 700 }}>{runResult.error.phase}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5 }}>{runResult.error.message}</p>
                  {runResult.error.details ? <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.5, overflowX: 'auto' }}>{runResult.error.details}</pre> : null}
                  {runResult.error.stack ? <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.45, overflowX: 'auto', opacity: 0.9 }}>{runResult.error.stack}</pre> : null}
                </div>
              ) : null}
              {runResult.seeds.some((seed) => seed.status === 'failed') ? (
                <div style={{ marginTop: 12, borderRadius: 12, border: '1px solid rgba(196, 54, 90, 0.18)', background: '#fff5f7', padding: 12, color: '#a42f4e' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>Seed fallido</p>
                  {runResult.seeds.filter((seed) => seed.status === 'failed').map((seed) => (
                    <div key={seed.seed} style={{ marginTop: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{seed.seed}</p>
                      {seed.error ? <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5 }}>{seed.error}</p> : null}
                      {seed.details ? <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.45, overflowX: 'auto' }}>{seed.details}</pre> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value, tone, mono = false }: { label: string; value: string; tone?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', borderRadius: 14, background: '#f7fbff', border: '1px solid rgba(12, 31, 56, 0.06)' }}>
      <span style={{ minWidth: 130, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6a7f95' }}>{label}</span>
      <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 700, color: tone ?? '#001e39', fontFamily: mono ? 'Consolas, monospace' : 'inherit', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const seedActionButtonStyle = {
  height: 34,
  padding: '0 12px',
  borderRadius: 999,
  border: '1px solid rgba(36, 88, 139, 0.18)',
  background: '#f4f8fc',
  color: '#24588b',
  fontWeight: 700 as const,
  cursor: 'pointer',
};
