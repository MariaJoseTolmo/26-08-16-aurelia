import 'reflect-metadata';
import { config } from 'dotenv';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

config();

export async function runFunctionalRolesSeed(dataSource: DataSource): Promise<void> {
  await dataSource.runMigrations({ transaction: 'all' });
}

async function main(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    await runFunctionalRolesSeed(dataSource);
    console.log('Functional roles sync completed using pending migrations.');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Functional roles seed failed:', error);
    process.exit(1);
  });
}
