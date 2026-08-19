import { Role } from '@aurelia/contracts';

const roleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.VIEWER]: 'Visualizador',

  [Role.INSPECTOR]: 'Inspector',
  [Role.INSPECTION_RESPONSIBLE]: 'Responsable de observación',
  [Role.INSPECTION_CLOSURE_VERIFIER]: 'Verificador de cierre de inspecciones',

  [Role.SPR_RESPONSIBLE]: 'Responsable SPR',
  [Role.SPR_AREA_MANAGER]: 'Gerente de área SPR',
  [Role.SPR_SUSTAINABILITY_SPECIALIST]: 'Especialista de Sustentabilidad SPR',
  [Role.SPR_ENVIRONMENT_MANAGER]: 'Gerente de Medio Ambiente SPR',

  [Role.INCIDENT_GENERATOR]: 'Generador de incidentes',
  [Role.INCIDENT_ENV_VALIDATOR]: 'Validador de Medio Ambiente',
  [Role.INCIDENT_ENV_COORDINATOR]: 'Coordinador de Medio Ambiente',
  [Role.INCIDENT_SUPERINTENDENT]: 'Superintendente de Medio Ambiente',
  [Role.INCIDENT_ICAM_LEAD]: 'Líder ICAM',

  [Role.CONTROL_VERIFIER]: 'Verificador de control crítico',
  [Role.CONTROL_OWNER]: 'Responsable de control crítico',
  [Role.CONTROL_SUPERINTENDENT]: 'Superintendente de control crítico',
  [Role.CONTROL_MANAGER]: 'Gerente de control crítico',
  [Role.CONTROL_CORPORATE_APPROVER]: 'Aprobador corporativo de control crítico',

  [Role.SUPERVISOR]: 'Supervisor (legado)',
  [Role.APPROVER]: 'Aprobador (legado)',
};

const approvingRoles = new Set<Role>([
  Role.ADMIN,
  Role.INSPECTION_CLOSURE_VERIFIER,
  Role.SPR_AREA_MANAGER,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_ENVIRONMENT_MANAGER,
  Role.INCIDENT_ENV_VALIDATOR,
  Role.INCIDENT_ENV_COORDINATOR,
  Role.INCIDENT_SUPERINTENDENT,
  Role.CONTROL_SUPERINTENDENT,
  Role.CONTROL_MANAGER,
  Role.CONTROL_CORPORATE_APPROVER,
]);

export function roleLabel(role: Role): string {
  return roleLabels[role];
}

export function formatUserInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstPart = parts[0];
  const lastPart = parts[parts.length - 1];

  if (!firstPart) return '?';
  if (parts.length === 1 || !lastPart) return firstPart.slice(0, 2).toUpperCase();

  const first = firstPart[0] ?? '';
  const last = lastPart[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function formatPrimaryRoleLabel(roles: Role[]): string {
  const primary = roles[0];
  return primary ? roleLabel(primary) : 'Sin rol';
}

export function canApprove(role: Role): boolean {
  return approvingRoles.has(role);
}
