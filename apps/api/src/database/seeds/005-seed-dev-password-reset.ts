import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { promisify } from 'util';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

config();

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const DEV_PASSWORD = 'AureliaDemo123!';

const demoEmails = [
  'admin@aurelia.local',
  'karen.opazo@goldfields.com',
  'pedro.silva@goldfields.com',
  'laura.mendez@goldfields.com',
  'sofia.reyes@goldfields.com',
  'miguel.castro@goldfields.com',
  'tania.galarce@goldfields.com',
  'carlos.aguirre@goldfields.com',
  'miguel.pizarro@somacor.com',
  'roberto.gonzalez@somacor.com',
  'carlos.lopez@somacor.com',
  'patricia.soto@somacor.com',
  'jorge.rojas@stracon.com',
  'ana.morales@stracon.com',
  'rodrigo.mendez@gardecorps.com',
  'luis.vargas@gardecorps.com',
  'carlos.rojas@aggreko.com',
  'maria.fuentes@aggreko.com',
  'diego.perez@resiter.com',
  'veronica.luna@resiter.com',
] as const;

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function runDevPasswordResetSeed(ds: DataSource): Promise<void> {
  const passwordHash = await createPasswordHash(DEV_PASSWORD);

  await ds.query(
    `UPDATE users
     SET password_hash = $2,
         password_changed_at = NOW(),
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE email = ANY($1::text[])`,
    [demoEmails, passwordHash],
  );
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runDevPasswordResetSeed(ds);
    console.log(`Dev demo password reset completed for ${demoEmails.length} users.`);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((err) => {
    console.error('Dev password reset seed failed:', err);
    process.exit(1);
  });
}
