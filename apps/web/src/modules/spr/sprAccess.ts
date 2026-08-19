import { Role, type LoginResponse } from '@aurelia/contracts';

type SessionUser = LoginResponse['user'];

export type SprDefaultRoute = '/spr' | '/spr/mi-area' | '/spr/reporte';

export function resolveSessionUserRoles(user: SessionUser | null | undefined): Role[] {
  return user?.roles ?? [];
}

const SPR_SIDEBAR_ROLE_PRIORITY: readonly Role[] = [
  Role.SPR_ENVIRONMENT_MANAGER,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_AREA_MANAGER,
  Role.SPR_RESPONSIBLE,
];

/**
 * Rol SPR a mostrar en el sidebar solo dentro de rutas /spr.
 * Fuera de SPR devolver null para que el sidebar use el rol primario habitual.
 */
export function resolveSprSidebarRole(roles: Role[], pathname: string): Role | null {
  if (pathname !== '/spr' && !pathname.startsWith('/spr/')) {
    return null;
  }

  if (pathname.startsWith('/spr/mi-area') && roles.includes(Role.SPR_AREA_MANAGER)) {
    return Role.SPR_AREA_MANAGER;
  }

  if (pathname.startsWith('/spr/reporte')) {
    if (roles.includes(Role.SPR_ENVIRONMENT_MANAGER)) return Role.SPR_ENVIRONMENT_MANAGER;
    if (roles.includes(Role.SPR_SUSTAINABILITY_SPECIALIST)) return Role.SPR_SUSTAINABILITY_SPECIALIST;
  }

  if (
    roles.includes(Role.SPR_RESPONSIBLE) &&
    (pathname === '/spr' || pathname.startsWith('/spr/')) &&
    !pathname.startsWith('/spr/mi-area') &&
    !pathname.startsWith('/spr/reporte')
  ) {
    return Role.SPR_RESPONSIBLE;
  }

  return SPR_SIDEBAR_ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

/** Responsable de área — Mi formulario SPR. */
export function canAccessSprForm(roles: Role[]): boolean {
  return roles.some((role) => role === Role.ADMIN || role === Role.SPR_RESPONSIBLE);
}

/** Gerente de área — Mi área SPR. */
export function canAccessSprArea(roles: Role[]): boolean {
  return roles.some((role) => role === Role.ADMIN || role === Role.SPR_AREA_MANAGER);
}

/** Especialista / Gerente MA — Dashboard y Reporte SPR consolidado. */
export function canAccessSprReport(roles: Role[]): boolean {
  return roles.some(
    (role) =>
      role === Role.SPR_SUSTAINABILITY_SPECIALIST || role === Role.SPR_ENVIRONMENT_MANAGER,
  );
}

/** Cualquier rol SPR (formulario, área o reporte) — trazabilidad del ciclo. */
export function canAccessSprTraceability(roles: Role[]): boolean {
  return canAccessSprForm(roles) || canAccessSprArea(roles) || canAccessSprReport(roles) || roles.includes(Role.ADMIN);
}

export function resolveSprDefaultRoute(roles: Role[]): SprDefaultRoute {
  if (canAccessSprReport(roles)) return '/spr/reporte';
  if (canAccessSprArea(roles)) return '/spr/mi-area';
  if (canAccessSprForm(roles)) return '/spr';
  return '/spr';
}
