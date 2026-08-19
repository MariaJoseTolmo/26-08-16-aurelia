import 'reflect-metadata';
import { config } from 'dotenv';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { runPhase1Seed } from './001-seed-phase1';
import { runDemoSeed } from './002-seed-demo-data';
import { runFindingClassificationsSeed } from './003-seed-finding-classifications';
import { runResponsiblesSeed } from './004-seed-responsibles';
import { runDevPasswordResetSeed } from './005-seed-dev-password-reset';
import { runNotificationsPermissionsSeed } from './006-seed-notifications-permissions';

config();

export async function runBootstrapSeed(ds: DataSource): Promise<void> {
  await runPhase1Seed(ds);
  await runDemoSeed(ds);
  await runFindingClassificationsSeed(ds);
  await runResponsiblesSeed(ds);
  await runDevPasswordResetSeed(ds);
  await runNotificationsPermissionsSeed(ds);
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runBootstrapSeed(ds);
    console.log('Bootstrap seed completed successfully.');
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Bootstrap seed failed:', error);
    process.exit(1);
  });
}