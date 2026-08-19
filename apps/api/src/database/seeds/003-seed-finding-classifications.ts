import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource, QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';

config();

const severities = [
  {
    code: 'MENOR',
    name: 'Menor',
    description: 'Incumplimiento procedimental o documental con consecuencias menores. Sin afectación a componentes ambientales. Hallazgos evidenciados dentro del área inspeccionada',
    closureTimeLabel: '14 Días',
    sortOrder: 1,
  },
  {
    code: 'MODERADO',
    name: 'Moderado',
    description: 'Incumplimiento legal o procedimental con consecuencias moderadas. Potencial afectación a componentes ambientales. Hallazgos evidenciados dentro del área inspeccionada',
    closureTimeLabel: '5 Días',
    sortOrder: 2,
  },
  {
    code: 'GRAVE',
    name: 'Grave',
    description: 'Incumplimiento legal o procedimental con consecuencias graves, riesgo de sanciones externas o incumplimiento contractual. Afectación a componentes ambientales. Hallazgo evidenciado fuera del área o límite inspeccionado.',
    closureTimeLabel: '3 Días',
    sortOrder: 3,
  },
];

const findingTypes = [
  { code: 'DESVIACION_EMISIONES_ATMOSFERICAS', name: 'Desviación en emisiones atmosféricas', sortOrder: 1 },
  { code: 'DESVIACION_CONTENCION_SUSTANCIAS', name: 'Desviación en contención de sustancias', sortOrder: 2 },
  { code: 'DESVIACION_SUELO_SITIOS_PATRIMONIALES', name: 'Desviación sobre suelo o sitios patrimoniales', sortOrder: 3 },
  { code: 'DESVIACION_SEGUIMIENTO_VEGETACION_FLORA_FAUNA', name: 'Desviación en seguimiento de medidas de vegetación, flora y fauna', sortOrder: 4 },
  { code: 'DESVIACION_GESTION_ELIMINACION_RESIDUOS', name: 'Desviación en la gestión o eliminación de residuos', sortOrder: 5 },
  { code: 'DESVIACION_EQUIPOS_INFRAESTRUCTURA', name: 'Desviación en el funcionamiento de equipos e infraestructura', sortOrder: 6 },
  { code: 'DESVIACION_RECURSO_HIDRICO', name: 'Desviación en manejo de recurso hídrico', sortOrder: 7 },
];

const probabilities = [
  { code: 'MUY_IMPROBABLE', name: 'Muy improbable', description: 'Ocurrencia excepcional o altamente improbable.', score: 1, sortOrder: 1 },
  { code: 'IMPROBABLE', name: 'Improbable', description: 'Podría ocurrir, pero no se espera en condiciones normales.', score: 2, sortOrder: 2 },
  { code: 'POSIBLE', name: 'Posible', description: 'Puede ocurrir bajo condiciones operacionales habituales.', score: 3, sortOrder: 3 },
  { code: 'PROBABLE', name: 'Probable', description: 'Es esperable que ocurra si no se corrige la condición.', score: 4, sortOrder: 4 },
  { code: 'CASI_SEGURO', name: 'Casi seguro', description: 'Alta frecuencia esperada o condición recurrente.', score: 5, sortOrder: 5 },
];

const consequences = [
  { code: 'INSIGNIFICANTE', name: 'Insignificante', description: 'Impacto ambiental menor o sin afectación relevante.', score: 1, sortOrder: 1 },
  { code: 'MENOR', name: 'Menor', description: 'Impacto acotado, reversible y controlable en terreno.', score: 2, sortOrder: 2 },
  { code: 'MODERADO', name: 'Moderado', description: 'Impacto ambiental moderado que requiere gestión y seguimiento.', score: 3, sortOrder: 3 },
  { code: 'MAYOR', name: 'Mayor', description: 'Impacto relevante con potencial afectación operacional o regulatoria.', score: 4, sortOrder: 4 },
  { code: 'CATASTROFICO', name: 'Catastrófico', description: 'Impacto severo o crítico con alta exposición ambiental/regulatoria.', score: 5, sortOrder: 5 },
];

async function upsertSimple(qr: QueryRunner, table: string, item: { code: string; name: string; sortOrder: number }) {
  await qr.query(
    `INSERT INTO ${table} (code, name, sort_order, is_active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       sort_order = EXCLUDED.sort_order,
       is_active = true,
       updated_at = NOW()`,
    [item.code, item.name, item.sortOrder],
  );
}

async function upsertScored(qr: QueryRunner, table: string, item: { code: string; name: string; description: string; score: number; sortOrder: number }) {
  await qr.query(
    `INSERT INTO ${table} (code, name, description, score, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       score = EXCLUDED.score,
       sort_order = EXCLUDED.sort_order,
       is_active = true,
       updated_at = NOW()`,
    [item.code, item.name, item.description, item.score, item.sortOrder],
  );
}

export async function runFindingClassificationsSeed(ds: DataSource): Promise<void> {
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    for (const item of findingTypes) await upsertSimple(qr, 'inspection_finding_types', item);

    for (const item of severities) {
      await qr.query(
        `INSERT INTO inspection_finding_severities (code, name, description, closure_time_label, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           closure_time_label = EXCLUDED.closure_time_label,
           sort_order = EXCLUDED.sort_order,
           is_active = true,
           updated_at = NOW()`,
        [item.code, item.name, item.description, item.closureTimeLabel, item.sortOrder],
      );
    }

    for (const item of probabilities) await upsertScored(qr, 'inspection_risk_probabilities', item);
    for (const item of consequences) await upsertScored(qr, 'inspection_risk_consequences', item);

    await qr.commitTransaction();
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
  }
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runFindingClassificationsSeed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
