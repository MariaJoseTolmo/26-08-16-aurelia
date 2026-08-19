export const UserConstraints = {
  email: { maxLength: 320 },
  firstName: { minLength: 1, maxLength: 120 },
  lastName: { minLength: 1, maxLength: 120 },
  position: { maxLength: 160 },
  phone: { maxLength: 50 },
} as const;
