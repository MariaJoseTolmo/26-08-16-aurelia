/**
 * Roles simulados en el front.
 *
 * Ni `WASTE_WITHDRAWER` ni `WASTE_ENV_APPROVER` existen en el enum `Role` de
 * `@aurelia/contracts` ni en el backend: son maquetas para recorrer las vistas
 * del retirador de residuos y del aprobador de Medio Ambiente antes de que exista
 * la infraestructura de roles. Por eso viven acá y no en `utils/roles.ts`, que
 * sólo habla de roles reales.
 *
 * Se activan por query param —`?role=WASTE_WITHDRAWER`,
 * `?role=WASTE_ENV_APPROVER`— para poder alternar las vistas en vivo, sin
 * recompilar. El param se pierde en la primera navegación interna, así que el
 * valor se persiste en `sessionStorage`; `?role=` (vacío) apaga la simulación sin
 * cerrar sesión.
 *
 * AMBOS SON CANDIDATOS A `Role` EN CONTRACTS. Cuando el backend defina la matriz
 * de permisos de residuos, `WASTE_ENV_APPROVER` pasa a `enums/role.enum.ts` y
 * esta simulación se borra junto con las ramas que la consultan.
 */

export const SIMULATED_ROLE_QUERY_PARAM = 'role';

/**
 * Empresa contratista del rol simulado.
 *
 * El retirador retira POR una EECC, y el resumen del paso 1 de SIDREP muestra su
 * nombre donde el nodo `4085:77594` escribe "[Nombre de la EECC]". Ese dato sale
 * de la sesión (`companyId` / `companyName`), pero el usuario con el que se
 * demuestra la simulación puede no tener empresa asignada, y sin transportista la
 * validación de transporte no corre y "Continuar" no se habilita nunca.
 *
 * Vive ACÁ y no en el módulo de residuos a propósito: es dato inventado, y el dato
 * inventado va todo junto en el archivo de la simulación, donde se borra de una
 * cuando exista la infraestructura de roles. Solo se usa como ÚLTIMO recurso,
 * cuando la sesión no trae empresa.
 */
export const SIMULATED_WASTE_WITHDRAWER_COMPANY = {
  id: 'simulated-eecc',
  name: 'EECC simulada',
} as const;

export const WASTE_WITHDRAWER_ROLE = 'WASTE_WITHDRAWER';

/** Aprobador de Medio Ambiente: es el rol que entra al Dashboard Residuos (`3086:13957`). */
export const WASTE_ENV_APPROVER_ROLE = 'WASTE_ENV_APPROVER';

export type SimulatedRole = typeof WASTE_WITHDRAWER_ROLE | typeof WASTE_ENV_APPROVER_ROLE;

const STORAGE_KEY = 'aurelia.simulated-role';

const SIMULATED_ROLES: readonly SimulatedRole[] = [WASTE_WITHDRAWER_ROLE, WASTE_ENV_APPROVER_ROLE];

function isSimulatedRole(value: string): value is SimulatedRole {
  return SIMULATED_ROLES.includes(value as SimulatedRole);
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

  /*
   * Se devuelve el valor NORMALIZADO y no una constante fija: con más de un rol
   * simulado, cablear `WASTE_WITHDRAWER_ROLE` acá haría que `?role=` de cualquier
   * rol válido cayera siempre en el retirador.
   */
  const normalized = raw.trim().toUpperCase();
  const next = isSimulatedRole(normalized) ? normalized : null;
  persistSimulatedRole(next);
  return next;
}
