import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SchemaStatusResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  entitiesTracked: number;
  tablesFound: number;
  missingTables: string[];
}

interface ExpectedTable {
  schema: string;
  name: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async getSchemaStatus(): Promise<SchemaStatusResponse> {
    const expectedTables = this.collectExpectedTables();
    const schemas = Array.from(new Set(expectedTables.map((table) => table.schema)));

    const rows = (await this.dataSource.query(
      `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema = ANY($1)
      `,
      [schemas],
    )) as Array<{ table_schema: string; table_name: string }>;

    const existingTables = new Set(
      rows.map((row) => `${row.table_schema}.${row.table_name}`.toLowerCase()),
    );

    const missingTables = expectedTables
      .map((table) => `${table.schema}.${table.name}`)
      .filter((qualifiedName) => !existingTables.has(qualifiedName.toLowerCase()))
      .sort((left, right) => left.localeCompare(right));

    return {
      status: missingTables.length === 0 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      entitiesTracked: expectedTables.length,
      tablesFound: expectedTables.length - missingTables.length,
      missingTables,
    };
  }

  private collectExpectedTables(): ExpectedTable[] {
    const deduped = new Map<string, ExpectedTable>();

    for (const metadata of this.dataSource.entityMetadatas) {
      const schema = metadata.schema ?? 'public';
      const key = `${schema}.${metadata.tableName}`.toLowerCase();

      if (!deduped.has(key)) {
        deduped.set(key, {
          schema,
          name: metadata.tableName,
        });
      }
    }

    return Array.from(deduped.values()).sort((left, right) => {
      const leftName = `${left.schema}.${left.name}`;
      const rightName = `${right.schema}.${right.name}`;
      return leftName.localeCompare(rightName);
    });
  }
}
