/**
 * Modelo del filtro "Período" del módulo de residuos.
 *
 * El valor es un mes ISO `yyyy-mm`. Se eligió ese formato por lo mismo que
 * `entryDate` usa `yyyy-mm-dd` en `wasteIntakeFilters`: es el único que ordena
 * bien como string y el único que no depende de la zona horaria del navegador.
 * La etiqueta chilena ("Mayo 2026") se deriva al mostrar, nunca se guarda.
 */

/**
 * Abreviaturas de las celdas del nodo `4068:75846`, en el orden de la grilla.
 *
 * El módulo `spr` tiene un arreglo idéntico (`SPR_KPI_MONITORING_MONTHS`), pero
 * importarlo acá acoplaría dos módulos de negocio por doce strings. La copia es
 * más barata que la dependencia cruzada.
 */
export const WASTE_MONTH_SHORT_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

/** Nombres largos para el encabezado del selector ("Mayo 2026"). */
const WASTE_MONTH_LONG_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Cuántos años ofrece el selector, contando el actual. El nodo muestra 2026 a 2023. */
export const WASTE_MONTH_PICKER_YEAR_COUNT = 4;

const ISO_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/**
 * Mes ISO `yyyy-mm` de una fecha, en horario LOCAL.
 *
 * `toISOString()` convierte a UTC y en Chile (UTC-4/-3) adelanta el día, así que
 * el último día del mes cae en el mes siguiente. Es la misma trampa que evita
 * `toIsoDate` en `wasteIntakeFilters`.
 */
export function toIsoMonth(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

/** `{ year, monthIndex }` de un mes ISO, o `null` si no es un `yyyy-mm` válido. */
export function parseIsoMonth(value: string): { year: number; monthIndex: number } | null {
  const match = ISO_MONTH_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return { year, monthIndex };
}

/** Arma el mes ISO de un año y un índice de mes base 0. */
export function buildIsoMonth(year: number, monthIndex: number): string {
  return `${year}-${`${monthIndex + 1}`.padStart(2, '0')}`;
}

/**
 * Etiqueta larga del encabezado: `2026-05` → `Mayo 2026`, tal cual el nodo
 * `4068:75849`. Devuelve `null` si el valor no es un mes válido, para que quien
 * lo muestre decida el placeholder.
 */
export function formatIsoMonthLabel(value: string | null): string | null {
  if (!value) return null;
  const parsed = parseIsoMonth(value);
  if (!parsed) return null;

  return `${WASTE_MONTH_LONG_LABELS[parsed.monthIndex]} ${parsed.year}`;
}

/** Años del selector, del más reciente al más antiguo, terminando en el de `reference`. */
export function buildPickerYears(reference: Date, count = WASTE_MONTH_PICKER_YEAR_COUNT): number[] {
  const latest = reference.getFullYear();
  return Array.from({ length: count }, (_, index) => latest - index);
}

/** `true` si la fecha ISO `yyyy-mm-dd` cae dentro del mes ISO `yyyy-mm`. */
export function isoDateInMonth(isoDate: string, isoMonth: string): boolean {
  return isoDate.startsWith(`${isoMonth}-`);
}
