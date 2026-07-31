import type { ManagementTableQuery } from './inspection-dashboard.service';

export function normalizeInspectionTableQuery(query: ManagementTableQuery = {}): ManagementTableQuery {
  return {
    ...query,
    date: normalizeInspectionTableDateFilter(query.date),
    type: normalizeInspectionTableTypeFilter(query.type),
  };
}

export function normalizeInspectionTableDateFilter(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return value;

  const normalized = trimmed.replace(/[/.]/g, '-');
  const dayFirst = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year.slice(-2)}`;
  }

  const isoLike = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoLike) {
    const [, year, month, day] = isoLike;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year.slice(-2)}`;
  }

  return trimmed;
}

export function normalizeInspectionTableTypeFilter(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return value;

  const normalized = normalizeSearch(trimmed);
  if (normalized.includes('check')) return 'Checklist normativo';
  if (normalized.includes('hallazgo') || normalized.includes('finding')) return 'Hallazgo';
  return trimmed;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
