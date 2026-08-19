export const OrganizationConstraints = {
  code: { minLength: 2, maxLength: 50 },
  name: { minLength: 2, maxLength: 250 },
  description: { maxLength: 2000 },
  taxId: { maxLength: 50 },
  companyType: { maxLength: 80 },
  macrozone: { maxLength: 100 },
} as const;
