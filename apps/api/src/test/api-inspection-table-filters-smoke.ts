import {
  normalizeInspectionTableDateFilter,
  normalizeInspectionTableQuery,
  normalizeInspectionTableTypeFilter,
} from '../modules/inspections/inspection-table-query-normalizer';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  assert(
    normalizeInspectionTableDateFilter('27-07-2026') === '27-07-26',
    'Full year date must match the short date representation used by inspection tables',
  );
  assert(
    normalizeInspectionTableDateFilter('27/7/2026') === '27-07-26',
    'Slash-separated date must be normalized',
  );
  assert(
    normalizeInspectionTableDateFilter('2026-07-27') === '27-07-26',
    'ISO-like date must be normalized',
  );
  assert(
    normalizeInspectionTableDateFilter('27-07-26') === '27-07-26',
    'Short year date must remain compatible',
  );
  assert(
    normalizeInspectionTableTypeFilter('Checklist') === 'Checklist normativo',
    'Checklist filter must match checklist rows identified by template',
  );
  assert(
    normalizeInspectionTableTypeFilter('Checklist normativo') === 'Checklist normativo',
    'Internal checklist label must remain stable',
  );
  assert(
    normalizeInspectionTableTypeFilter('Hallazgo') === 'Hallazgo',
    'Finding filter must remain stable',
  );

  const query = normalizeInspectionTableQuery({
    page: '1',
    pageSize: '10',
    date: '27-07-2026',
    type: 'Checklist',
  });

  assert(query.date === '27-07-26', 'Management and history queries must normalize the date');
  assert(query.type === 'Checklist normativo', 'Management and history queries must normalize the type');

  console.log('Inspection table date and type filter smoke test passed');
}

main();
