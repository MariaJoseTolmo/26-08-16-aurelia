import type { SprSignerPersonResponse } from '@aurelia/contracts';

export const SPR_SPECIALIST_ROLE_LABEL = 'Especialista de Sustentabilidad';
export const SPR_MANAGER_ROLE_LABEL = 'Gerente MA o Gerente de Sustentabilidad';
export const SPR_SPECIALIST_ROLE_SHORT = 'Esp. Sust.';
export const SPR_MANAGER_ROLE_SHORT = 'Gte. MA';

type SignerNameSource = Pick<SprSignerPersonResponse, 'firstName' | 'fullName'>;

/** Compacto: firstName unidos por `/`. Vacío → fallback de rol. */
export function formatSignerSlashNames(
  people: readonly SignerNameSource[],
  emptyFallback: string,
): string {
  const names = people.map((person) => person.firstName.trim()).filter(Boolean);
  return names.length > 0 ? names.join('/') : emptyFallback;
}

/**
 * Lista prosa ES: `A` / `A o B` / `A, B o C`.
 * Vacío → fallback de rol.
 */
export function formatSignerProseList(
  people: readonly SignerNameSource[],
  emptyFallback: string,
  useFirstName = true,
): string {
  const names = people
    .map((person) => (useFirstName ? person.firstName : person.fullName).trim())
    .filter(Boolean);
  if (names.length === 0) return emptyFallback;
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} o ${names[1]}`;
  const head = names.slice(0, -1).join(', ');
  return `${head} o ${names[names.length - 1]}`;
}

export function formatSignerFullNameList(
  people: readonly SignerNameSource[],
  emptyFallback: string,
): string {
  return formatSignerProseList(people, emptyFallback, false);
}

/** Título fila Dashboard: Orden: Tania → Gabriel */
export function buildFirmaOrderTitle(
  specialists: readonly SignerNameSource[],
  managers: readonly SignerNameSource[],
): string {
  const left = formatSignerSlashNames(specialists, SPR_SPECIALIST_ROLE_SHORT);
  const right = formatSignerSlashNames(managers, SPR_MANAGER_ROLE_SHORT);
  return `Firma del reporte oficial — Orden: ${left} → ${right}`;
}

/** Descripción timeline Dashboard. */
export function buildFirmaTimelineDescription(
  specialists: readonly SignerNameSource[],
  managers: readonly SignerNameSource[],
): string {
  const left = formatSignerSlashNames(specialists, SPR_SPECIALIST_ROLE_SHORT);
  const right = formatSignerSlashNames(managers, SPR_MANAGER_ROLE_SHORT);
  return `${left} firman primero · ${right} dan el alta oficial.`;
}

/** Banner info tab Firma (prosa con firstName). */
export function buildFirmaInfoAfter(
  specialists: readonly SignerNameSource[],
  managers: readonly SignerNameSource[],
): string {
  const specialistList = formatSignerProseList(specialists, 'un Especialista de Sustentabilidad');
  const managerClause =
    managers.length > 0
      ? `queda habilitada la firma del Gerente MA o Gerente de Sustentabilidad (${formatSignerProseList(managers, SPR_MANAGER_ROLE_LABEL)}) para dar el alta oficial.`
      : 'queda habilitada la firma del Gerente MA o Gerente de Sustentabilidad para dar el alta oficial.';
  return `: primero debe firmar un Especialista de Sustentabilidad (${specialistList}), y una vez completada esa firma, ${managerClause}`;
}

export type SprFirmaPersonCard = {
  id: string;
  initials: string;
  name: string;
  role: string;
  active?: boolean;
};

function initialsFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

/** Cards de la lista de especialistas / gerentes en tab Firma. */
export function buildFirmaPersonCards(
  people: readonly SprSignerPersonResponse[],
  roleLabel: string,
  options?: { highlightUserId?: string | null; activeSessionLabel?: string },
): SprFirmaPersonCard[] {
  return people.map((person) => {
    const isActive = Boolean(options?.highlightUserId && person.id === options.highlightUserId);
    return {
      id: person.id,
      initials: initialsFromFullName(person.fullName),
      name: person.fullName,
      role: isActive
        ? `${roleLabel} · ${options?.activeSessionLabel ?? 'Sesión activa'}`
        : person.position?.trim() || roleLabel,
      active: isActive,
    };
  });
}

/** Label para modal SOX / “enviar a …”. Preferir lista fullName; si uno solo, ese nombre. */
export function buildSpecialistRecipientLabel(
  specialists: readonly SignerNameSource[],
  emptyFallback = SPR_SPECIALIST_ROLE_LABEL,
): string {
  return formatSignerFullNameList(specialists, emptyFallback);
}

/** Hint “Inicia sesión como … (Nombre)”. */
export function buildSignInAsHint(
  roleTitle: string,
  people: readonly SignerNameSource[],
): string {
  const example = people[0]?.fullName?.trim();
  if (example) {
    return `Inicia sesión como ${roleTitle} (${example}) para firmar este paso.`;
  }
  return `Inicia sesión como ${roleTitle} para firmar este paso.`;
}
