export const InspectionConstraints = {
  title: { minLength: 3, maxLength: 180 },
  description: { maxLength: 4000 },
  notes: { maxLength: 2000 },
  code: { minLength: 2, maxLength: 80 },
  checklistQuestion: { minLength: 3, maxLength: 500 },
  findingTitle: { minLength: 3, maxLength: 200 },
  followupDescription: { minLength: 3, maxLength: 4000 },
} as const;
