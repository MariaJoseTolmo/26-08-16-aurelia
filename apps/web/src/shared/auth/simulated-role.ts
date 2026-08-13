/**
 * Rol simulado en el front.
 *
 * `WASTE_WITHDRAWER` NO existe en el enum `Role` de `@aurelia/contracts` ni en
 * el backend: es una maqueta para recorrer las vistas del retirador de residuos
 * antes de que exista la infraestructura de roles. Por eso vive acá y no en
 * `utils/roles.ts`, que sólo habla de roles reales.
 *
 * Se activa por query param —`?role=WASTE_WITHDRAWER`— para poder alternar las
 * dos vistas en vivo, sin recompilar. El param se pierde en la primera
 * navegación interna, así que el valor se persiste en `sessionStorage`;
 * `?role=` (vacío) apaga la simulación sin cerrar sesión.
 */

export const SIMULATED_ROLE_QUERY_PARAM = 'role';

export const WASTE_WITHDRAWER_ROLE = 'WASTE_WITHDRAWER';

export type SimulatedRole = typeof WASTE_WITHDRAWER_ROLE;

const STORAGE_KEY = 'aurelia.simulated-role';

function isSimulatedRole(value: string): value is SimulatedRole {
  return value === WASTE_WITHDRAWER_ROLE;
}

function readPersistedSimulatedRole(): SimulatedRole | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored && isSimulatedRole(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistSimulatedRole(role: SimulatedRole | null) {
  if (typeof window === 'undefined') return;

  try {
    if (role) window.sessionStorage.setItem(STORAGE_KEY, role);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // La simulación no es crítica: si el navegador bloquea sessionStorage,
    // sigue valiendo lo que traiga el query param en cada navegación.
  }
}

/**
 * Resuelve el rol simulado para un `location.search` dado.
 *
 * Sin el param gana lo persistido; con el param gana la URL, y se persiste. Un
 * valor vacío o desconocido apaga la simulación.
 */
export function resolveSimulatedRole(search: string): SimulatedRole | null {
  const raw = new URLSearchParams(search).get(SIMULATED_ROLE_QUERY_PARAM);
  if (raw === null) return readPersistedSimulatedRole();

  const next = isSimulatedRole(raw.trim().toUpperCase()) ? WASTE_WITHDRAWER_ROLE : null;
  persistSimulatedRole(next);
  return next;
}
