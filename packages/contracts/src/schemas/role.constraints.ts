export const RoleConstraints = {
  code: { maxLength: 80 },
  permissionCode: { minLength: 3, maxLength: 120 },
  name: { minLength: 2, maxLength: 160 },
  module: { minLength: 2, maxLength: 80 },
  action: { minLength: 2, maxLength: 80 },
  description: { maxLength: 2000 },
} as const;
