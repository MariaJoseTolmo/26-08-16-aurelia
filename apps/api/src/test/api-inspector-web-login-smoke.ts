import assert from 'node:assert/strict';
import { INSPECTION_CAPABILITIES, Role } from '@aurelia/contracts';
import type { Repository } from 'typeorm';
import { AuthService, type LoginRequest } from '../modules/auth/auth.service';
import type { CredentialHashService } from '../modules/auth/credential-hash.service';
import type { JwtTokenService } from '../modules/auth/jwt-token.service';
import type { SessionRegistryService } from '../modules/auth/session-registry.service';
import type { UserEntity } from '../modules/users/entities/user.entity';

async function main(): Promise<void> {
  const inspector = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'inspector@goldfields.com',
    firstName: 'Usuario',
    lastName: 'Inspector',
    position: 'Inspector',
    companyId: null,
    company: null,
    areaId: null,
    area: null,
    isActive: true,
    passwordHash: 'stored-hash',
    failedLoginAttempts: 0,
    lockedUntil: null,
    userRoles: [
      {
        role: {
          code: Role.INSPECTOR,
          isActive: true,
          rolePermissions: [],
        },
      },
    ],
  } as unknown as UserEntity;

  const updates: Array<{ criteria: unknown; partial: unknown }> = [];
  const usersRepository = {
    findOne: async () => inspector,
    update: async (criteria: unknown, partial: unknown) => {
      updates.push({ criteria, partial });
      return { affected: 1, generatedMaps: [], raw: [] };
    },
  } as unknown as Repository<UserEntity>;

  const jwtTokenService = {
    sign: () => 'signed-access-token',
  } as unknown as JwtTokenService;

  const credentialHashService = {
    matches: async (secret: string, stored: string | null) => secret === 'AureliaDemo123!' && stored === 'stored-hash',
  } as unknown as CredentialHashService;

  const sessionRegistryService = {
    issue: async () => ({
      key: 'refresh-token',
      session: { id: '22222222-2222-4222-8222-222222222222' },
    }),
  } as unknown as SessionRegistryService;

  const service = new AuthService(
    usersRepository,
    jwtTokenService,
    credentialHashService,
    sessionRegistryService,
  );

  const payload: LoginRequest = {
    email: inspector.email,
    password: 'AureliaDemo123!',
    client: 'web',
  };

  const response = await service.login(payload, {
    userAgent: 'smoke-test',
    ipAddress: '127.0.0.1',
  });

  assert.equal(response.token, 'signed-access-token');
  assert.equal(response.refreshToken, 'refresh-token');
  assert.equal(response.user.email, inspector.email);
  assert.deepEqual(response.user.roles, [Role.INSPECTOR]);
  assert.equal(response.user.permissions.includes(INSPECTION_CAPABILITIES.create), true);
  assert.equal(updates.length, 1);

  console.log('Inspector web login smoke test passed.');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
