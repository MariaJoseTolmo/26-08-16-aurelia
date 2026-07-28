import 'reflect-metadata';
import { config } from 'dotenv';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { runInspectionsMasterDataSeed } from './009-seed-inspections-master-data';

config();

/**
 * Alias conservado por compatibilidad con comandos y automatizaciones anteriores.
 *
 * El antiguo seed mantenía una lista demo de empresas y marcaba incluso a Gold
 * Fields como contratista. La fuente vigente para responsables, empresas,
 * áreas, sectores e inspectores es ahora inspection-master-data.json.
 */
export async function runResponsiblesSeed(ds: DataSource): Promise<void> {
  await runInspectionsMasterDataSeed(ds);
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runResponsiblesSeed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((error) => {
    console.error('Inspection responsibles master seed failed:', error);
    process.exit(1);
  });
}
