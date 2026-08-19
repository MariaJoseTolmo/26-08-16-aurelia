import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function main(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const migrations = await AppDataSource.runMigrations();
    if (migrations.length === 0) {
      console.log('[migrations] no pending migrations');
    } else {
      console.log(`[migrations] applied ${migrations.length} migration(s)`);
    }
  } catch (error) {
    console.error('[migrations] failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void main();
