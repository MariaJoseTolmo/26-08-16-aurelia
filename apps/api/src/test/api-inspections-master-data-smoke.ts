import masterData from '../modules/inspection-legacy-import/config/inspection-master-data.json';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function main(): void {
  assert(masterData.version === 2, 'Master data version must be 2');
  assert(masterData.source.totalRows === 2308, 'Source row count is wrong');
  assert(masterData.rules.onlyInspectionsAreLegacy, 'Only inspections must be marked as legacy');
  assert(masterData.rules.catalogStatus === 'active', 'Catalogs must be active');

  assert(masterData.areas.length === 14, 'Expected 14 active areas');
  assert(masterData.sectors.length === 78, 'Expected 78 active sector relations');
  assert(masterData.companies.length === 76, 'Expected 76 active companies');
  assert(masterData.users.length === 11, 'Expected 11 active inspectors');
  assert(masterData.inspectorGroups.length === 2, 'Expected two multi-inspector groups');

  assert(unique(masterData.areas.map((area) => area.code)), 'Area codes must be unique');
  assert(unique(masterData.sectors.map((sector) => sector.code)), 'Sector codes must be unique');
  assert(unique(masterData.companies.map((company) => company.code)), 'Company codes must be unique');
  assert(unique(masterData.users.map((user) => user.email.toLocaleLowerCase('es'))), 'User emails must be unique');

  assert(
    masterData.areas.reduce((total, area) => total + area.sourceRows, 0) === 2308,
    'Area source coverage must equal 2308 rows',
  );
  assert(
    masterData.companies.reduce((total, company) => total + company.sourceRows, 0) === 2308,
    'Company source coverage must equal 2308 rows',
  );

  const areaCodes = new Set(masterData.areas.map((area) => area.code));
  masterData.sectors.forEach((sector) => {
    assert(areaCodes.has(sector.areaCode), `Sector ${sector.code} references unknown area ${sector.areaCode}`);
    assert(sector.status === 'active', `Sector ${sector.code} must be active`);
  });
  masterData.areas.forEach((area) => assert(area.status === 'active', `Area ${area.code} must be active`));
  masterData.companies.forEach((company) => assert(company.status === 'active', `Company ${company.code} must be active`));
  masterData.users.forEach((user) => assert(user.isActive, `User ${user.email} must be active`));

  const corp = masterData.companies.find((company) => company.code === 'CORP');
  assert(Boolean(corp), 'CORP company is missing');
  assert(corp?.isContractor === false, 'Gold Fields must not be a contractor');

  const normalizedAreaSources = masterData.areas.flatMap((area) => area.sourceValues.map(normalize));
  const normalizedCompanySources = masterData.companies.flatMap((company) => company.sourceValues.map(normalize));
  assert(unique(normalizedAreaSources), 'Area source aliases must resolve to exactly one master');
  assert(unique(normalizedCompanySources), 'Company source aliases must resolve to exactly one master');

  const userEmails = new Set(masterData.users.map((user) => user.email.toLocaleLowerCase('es')));
  masterData.inspectorGroups.forEach((group) => {
    assert(group.members.length > 1, `Group ${group.sourceValue} must contain multiple users`);
    group.members.forEach((email) => {
      assert(userEmails.has(email.toLocaleLowerCase('es')), `Group ${group.sourceValue} references unknown user ${email}`);
    });
  });

  const placeholderUsers = masterData.users.filter((user) => user.emailSource === 'placeholder');
  assert(placeholderUsers.length === 10, 'Expected ten users pending corporate directory confirmation');
  placeholderUsers.forEach((user) => {
    assert(user.email.endsWith('@pending-directory.aurelia.local'), `Placeholder email is invalid: ${user.email}`);
    assert(user.passwordMode === 'none', `Placeholder user ${user.email} must not receive a password`);
  });

  console.log('Inspection master data smoke test passed');
}

main();
