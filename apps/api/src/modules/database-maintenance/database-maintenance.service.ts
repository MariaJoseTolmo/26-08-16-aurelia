import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource, Migration, MigrationExecutor, QueryRunner } from 'typeorm';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { availableSeedNames, isSeedName, runSeedByName } from '../../database/seeds/seed-registry';
import { RunDatabaseMaintenanceDto } from './dto/run-database-maintenance.dto';

type SqlQuery = {
  query: string;
  parameters?: unknown[];
};

type MaintenancePhase =
  | 'connect'
  | 'lock'
  | 'reset'
  | 'prerequisites'
  | 'plan'
  | 'review'
  | 'artifact'
  | 'migration'
  | 'seed';

type MigrationStatus = 'applied' | 'noop' | 'review_required';
type PlanStatus = 'ready' | 'noop' | 'review_required';
type SeedStatus = 'applied' | 'skipped' | 'failed';

export interface DatabaseMaintenanceErrorInfo {
  phase: MaintenancePhase;
  message: string;
  details?: string;
  stack?: string;
}

export interface DatabaseMaintenanceSeedResult {
  seed: string;
  status: SeedStatus;
  error?: string;
  details?: string;
}

export interface DatabaseMaintenanceMigrationResult {
  status: MigrationStatus | 'failed';
  filePath: string | null;
  migrationName: string | null;
  upQueries: number;
  downQueries: number;
  riskyQueries: string[];
}

export interface DatabaseMaintenanceResult {
  migration: DatabaseMaintenanceMigrationResult;
  seeds: DatabaseMaintenanceSeedResult[];
  availableSeeds: string[];
  error: DatabaseMaintenanceErrorInfo | null;
}

export interface DatabaseMaintenancePlanResult {
  migration: {
    status: PlanStatus;
    filePath: string | null;
    migrationName: string | null;
    upQueries: number;
    downQueries: number;
    riskyQueries: string[];
  };
  availableSeeds: string[];
}

@Injectable()
export class DatabaseMaintenanceService {
  private readonly logger = new Logger(DatabaseMaintenanceService.name);
  private static readonly RESET_CONFIRMATION = 'RESET_DEV_SCHEMA';

  constructor(private readonly dataSource: DataSource) {}

  async plan(): Promise<DatabaseMaintenancePlanResult> {
    this.logger.log('Planning database maintenance');
    const pendingMigrations = await this.resolvePendingMigrations();
    this.logger.log(`Plan generated with ${pendingMigrations.length} pending versioned migration(s)`);

    if (pendingMigrations.length === 0) {
      return {
        migration: {
          status: 'noop',
          filePath: null,
          migrationName: null,
          upQueries: 0,
          downQueries: 0,
          riskyQueries: [],
        },
        availableSeeds: availableSeedNames,
      };
    }

    const lastPendingMigration = pendingMigrations[pendingMigrations.length - 1]?.name ?? null;

    return {
      migration: {
        status: 'ready',
        filePath: null,
        migrationName: lastPendingMigration,
        upQueries: pendingMigrations.length,
        downQueries: 0,
        riskyQueries: [],
      },
      availableSeeds: availableSeedNames,
    };
  }

  async run(dto: RunDatabaseMaintenanceDto): Promise<DatabaseMaintenanceResult> {
    const requestedSeeds = this.normalizeSeeds(dto.seeds ?? []);
    const allowRisky = dto.allowRisky === true;
    const resetSchema = dto.resetSchema === true;
    const runSeedsOnly = dto.runSeedsOnly === true;
    this.logger.log(`Running database maintenance with seeds=[${requestedSeeds.join(', ')}], allowRisky=${allowRisky}, resetSchema=${resetSchema}, runSeedsOnly=${runSeedsOnly}`);

    if (resetSchema && dto.resetConfirmation !== DatabaseMaintenanceService.RESET_CONFIRMATION) {
      return {
        migration: {
          status: 'failed',
          filePath: null,
          migrationName: null,
          upQueries: 0,
          downQueries: 0,
          riskyQueries: [],
        },
        seeds: requestedSeeds.map((seed) => ({ seed, status: 'skipped' })),
        availableSeeds: availableSeedNames,
        error: {
          phase: 'reset',
          message: `Reset confirmation mismatch. Send resetConfirmation="${DatabaseMaintenanceService.RESET_CONFIRMATION}" to continue.`,
        },
      };
    }

    const maintenanceRunner = this.dataSource.createQueryRunner();
    let lockAcquired = false;
    let appliedMigrationsCount = 0;
    let lastAppliedMigration: string | null = null;
    let phase: MaintenancePhase = 'connect';

    try {
      await maintenanceRunner.connect();
      phase = 'lock';
      this.logger.log('Acquiring maintenance advisory lock');
      await maintenanceRunner.query(`SELECT pg_advisory_lock(hashtext('aurelia_database_maintenance'))`);
      lockAcquired = true;

      phase = 'prerequisites';
      await this.ensureDatabasePrerequisites(maintenanceRunner);

      if (runSeedsOnly) {
        phase = 'seed';
        this.logger.log('runSeedsOnly enabled, skipping schema plan and migration execution');
        const seeds = await this.runSeeds(requestedSeeds);
        return {
          migration: {
            status: 'noop',
            filePath: null,
            migrationName: null,
            upQueries: 0,
            downQueries: 0,
            riskyQueries: [],
          },
          seeds,
          availableSeeds: availableSeedNames,
          error: null,
        };
      }

      if (resetSchema) {
        phase = 'reset';
        this.logger.warn('Reset schema requested. Dropping and recreating public schema.');
        await this.resetPublicSchema(maintenanceRunner);

        phase = 'prerequisites';
        await this.ensureDatabasePrerequisites(maintenanceRunner);

        phase = 'migration';
        const appliedMigrations = await this.dataSource.runMigrations({ transaction: 'all' });
        appliedMigrationsCount = appliedMigrations.length;
        lastAppliedMigration = appliedMigrations.length > 0 ? appliedMigrations[appliedMigrations.length - 1].name : null;
        this.logger.log(`Versioned migrations applied after reset: ${appliedMigrationsCount}`);

        phase = 'seed';
        const seeds = await this.runSeeds(requestedSeeds);

        return {
          migration: {
            status: 'applied',
            filePath: null,
            migrationName: lastAppliedMigration,
            upQueries: appliedMigrationsCount,
            downQueries: 0,
            riskyQueries: [],
          },
          seeds,
          availableSeeds: availableSeedNames,
          error: null,
        };
      }

      phase = 'migration';
      this.logger.log('Running pending versioned migrations');
      const appliedMigrations = await this.dataSource.runMigrations({ transaction: 'all' });
      appliedMigrationsCount = appliedMigrations.length;
      lastAppliedMigration = appliedMigrations.length > 0 ? appliedMigrations[appliedMigrations.length - 1].name : null;
      this.logger.log(`Versioned migrations applied: ${appliedMigrationsCount}`);

      if (appliedMigrationsCount === 0) {
        phase = 'seed';
        this.logger.log('No pending migrations, running requested seeds only');
        const seeds = await this.runSeeds(requestedSeeds);
        return {
          migration: {
            status: 'noop',
            filePath: null,
            migrationName: null,
            upQueries: 0,
            downQueries: 0,
            riskyQueries: [],
          },
          seeds,
          availableSeeds: availableSeedNames,
          error: null,
        };
      }

      phase = 'seed';
      this.logger.log(`Running ${requestedSeeds.length} selected seed(s)`);
      const seeds = await this.runSeeds(requestedSeeds);
      this.logger.log(`Selected seeds completed: ${seeds.map((seed) => `${seed.seed}:${seed.status}`).join(', ') || 'none'}`);

      return {
        migration: {
          status: 'applied',
          filePath: null,
          migrationName: lastAppliedMigration,
          upQueries: appliedMigrationsCount,
          downQueries: 0,
          riskyQueries: [],
        },
        seeds,
        availableSeeds: availableSeedNames,
        error: null,
      };
    } catch (error) {
      const failure = this.buildFailureInfo(phase, error);
      this.logger.error(`Database maintenance failed at phase ${phase}: ${failure.message}`, failure.stack);

      const seeds = requestedSeeds.map((seed, index) => ({
        seed,
        status: index === 0 ? 'skipped' : 'skipped',
      })) satisfies DatabaseMaintenanceSeedResult[];

      return {
        migration: {
          status: 'failed',
          filePath: null,
          migrationName: lastAppliedMigration,
          upQueries: appliedMigrationsCount,
          downQueries: 0,
          riskyQueries: [],
        },
        seeds,
        availableSeeds: availableSeedNames,
        error: failure,
      };
    } finally {
      try {
        if (lockAcquired) {
          this.logger.log('Releasing maintenance advisory lock');
          await maintenanceRunner.query(`SELECT pg_advisory_unlock(hashtext('aurelia_database_maintenance'))`);
        }
      } finally {
        await maintenanceRunner.release();
      }
    }
  }

  private async resolvePendingMigrations(): Promise<Migration[]> {
    const executor = new MigrationExecutor(this.dataSource);
    return executor.getPendingMigrations();
  }

  private async createSchemaPlan(): Promise<{ upQueries: SqlQuery[]; downQueries: SqlQuery[] }> {
    const schemaBuilder = this.dataSource.driver.createSchemaBuilder();
    const sql = await schemaBuilder.log();
    return {
      upQueries: sql.upQueries,
      downQueries: sql.downQueries,
    };
  }

  private async ensureDatabasePrerequisites(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Ensuring required database extensions');
    await this.ensureCitextSupport(queryRunner);

    // Azure Database for PostgreSQL may block uuid-ossp. Provide a local RFC4122 v4 compatible function instead.
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
        RETURNS uuid
        LANGUAGE sql
        VOLATILE
        AS $fn$
          SELECT (
            lpad(to_hex((random() * 4294967295)::bigint), 8, '0') || '-' ||
            lpad(to_hex((random() * 65535)::bigint), 4, '0') || '-' ||
            '4' || substr(lpad(to_hex((random() * 4095)::bigint), 3, '0'), 1, 3) || '-' ||
            substr('89ab', floor(random() * 4)::int + 1, 1) ||
            substr(lpad(to_hex((random() * 4095)::bigint), 3, '0'), 1, 3) || '-' ||
            lpad(to_hex((random() * 281474976710655)::bigint), 12, '0')
          )::uuid;
        $fn$;
      END
      $$;
    `);
  }

  private async ensureCitextSupport(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "citext"');
      return;
    } catch (error) {
      this.logger.warn('citext extension not available, creating fallback domain in public schema');
      this.logger.warn(this.describeError(error));
    }

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'citext'
        ) THEN
          CREATE DOMAIN public.citext AS text;
        END IF;
      END
      $$;
    `);
  }

  private async resetPublicSchema(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP SCHEMA IF EXISTS public CASCADE');
    await queryRunner.query('CREATE SCHEMA public');
    await queryRunner.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
    await queryRunner.query('GRANT ALL ON SCHEMA public TO public');
  }

  private buildMigrationArtifact(): { migrationName: string; filePath: string } {
    const timestamp = Date.now();
    const migrationName = `AutoSchemaSync${timestamp}`;
    const migrationFolder = join(tmpdir(), 'aurelia-database-maintenance', 'generated');
    const filePath = join(migrationFolder, `${timestamp}-auto-schema-sync.ts`);

    return { migrationName, filePath };
  }

  private writeMigrationArtifact(upQueries: SqlQuery[], downQueries: SqlQuery[]): { migrationName: string; filePath: string } {
    const artifact = this.buildMigrationArtifact();

    const migrationFolder = join(tmpdir(), 'aurelia-database-maintenance', 'generated');
    mkdirSync(migrationFolder, { recursive: true });
    writeFileSync(artifact.filePath, this.renderMigrationFile(artifact.migrationName, upQueries, downQueries), 'utf8');

    return artifact;
  }

  private renderMigrationFile(migrationName: string, upQueries: SqlQuery[], downQueries: SqlQuery[]): string {
    return [
      "import { MigrationInterface, QueryRunner } from 'typeorm';",
      '',
      `export class ${migrationName} implements MigrationInterface {`,
      `  name = '${migrationName}';`,
      '',
      '  public async up(queryRunner: QueryRunner): Promise<void> {',
      this.renderQueryBlock(upQueries),
      '  }',
      '',
      '  public async down(queryRunner: QueryRunner): Promise<void> {',
      this.renderQueryBlock(downQueries),
      '  }',
      '}',
      '',
    ].join('\n');
  }

  private renderQueryBlock(queries: SqlQuery[]): string {
    if (queries.length === 0) {
      return '    return;';
    }

    return queries
      .map((query) => {
        const parameters = query.parameters && query.parameters.length > 0
          ? `, ${JSON.stringify(query.parameters)}`
          : '';
        return `    await queryRunner.query(${JSON.stringify(query.query)}${parameters});`;
      })
      .join('\n');
  }

  private async executeGeneratedMigration(
    queryRunner: QueryRunner,
    migrationName: string,
    upQueries: SqlQuery[],
    downQueries: SqlQuery[],
  ): Promise<void> {
    const migrationTimestamp = Number(migrationName.replace(/^AutoSchemaSync/, ''));
    const migration = new Migration(
      undefined,
      migrationTimestamp,
      migrationName,
      {
        name: migrationName,
        async up(runner) {
          for (const query of upQueries) {
            await runner.query(query.query, query.parameters);
          }
        },
        async down(runner) {
          for (const query of downQueries) {
            await runner.query(query.query, query.parameters);
          }
        },
      },
      true,
    );

    const executor = new MigrationExecutor(this.dataSource, queryRunner);
    executor.transaction = 'all';
    await executor.executeMigration(migration);
  }

  private async runSeeds(seedNames: string[]): Promise<DatabaseMaintenanceSeedResult[]> {
    if (seedNames.length === 0) {
      this.logger.log('No seeds requested');
      return [];
    }

    const results: DatabaseMaintenanceSeedResult[] = [];

    for (const seedName of seedNames) {
      if (!isSeedName(seedName)) {
        throw new BadRequestException(`Unknown seed "${seedName}". Available seeds: ${availableSeedNames.join(', ')}`);
      }

      try {
        this.logger.log(`Running seed ${seedName}`);
        await runSeedByName(seedName, this.dataSource);
        this.logger.log(`Seed ${seedName} applied successfully`);
        results.push({ seed: seedName, status: 'applied' });
      } catch (error) {
        this.logger.error(`Seed ${seedName} failed`, error instanceof Error ? error.stack : undefined);
        results.push({
          seed: seedName,
          status: 'failed',
          error: this.describeError(error),
          details: error instanceof Error ? error.stack : undefined,
        });

        const remainingSeeds = seedNames.slice(results.length);
        for (const skippedSeed of remainingSeeds) {
          results.push({ seed: skippedSeed, status: 'skipped' });
        }
        break;
      }
    }

    return results;
  }

  private normalizeSeeds(seedNames: string[]): string[] {
    return Array.from(new Set(seedNames.map((seedName) => seedName.trim()).filter(Boolean)));
  }

  private detectRiskyQueries(queries: SqlQuery[]): string[] {
    return queries
      .map((query) => query.query)
      .filter((query) => this.isRiskyQuery(query));
  }

  private isRiskyQuery(query: string): boolean {
    const normalized = query.replace(/\s+/g, ' ').trim().toUpperCase();
    return [
      /\bDROP\b/,
      /\bTRUNCATE\b/,
      /\bRENAME\b/,
      /ALTER TABLE .* DROP COLUMN/i,
      /ALTER TABLE .* ALTER COLUMN .* TYPE/i,
      /DROP CONSTRAINT/i,
    ].some((pattern) => pattern.test(normalized));
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown seed error';
  }

  private buildFailureInfo(phase: MaintenancePhase, error: unknown): DatabaseMaintenanceErrorInfo {
    if (error instanceof Error) {
      return {
        phase,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      phase,
      message: 'Unknown maintenance error',
    };
  }
}
