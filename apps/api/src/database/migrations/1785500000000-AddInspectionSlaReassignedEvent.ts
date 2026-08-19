import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInspectionSlaReassignedEvent1785500000000 implements MigrationInterface {
  name = 'AddInspectionSlaReassignedEvent1785500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "inspection_sla_event_type" ADD VALUE IF NOT EXISTS 'reassigned'`);
  }

  async down(): Promise<void> {
    // PostgreSQL no permite eliminar de forma segura un valor enum sin recrear el tipo.
  }
}
