export const IncidentConstraints = {
  title: { minLength: 3, maxLength: 160 },
  description: { minLength: 10, maxLength: 4000 },
} as const;
