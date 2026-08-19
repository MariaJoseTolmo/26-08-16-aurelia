import { Controller, Get } from '@nestjs/common';
import type { InspectionRiskConsequenceResponse, InspectionRiskProbabilityResponse } from '@aurelia/contracts';
import { DataSource } from 'typeorm';
import { RequirePermissions } from '../auth/require-permissions.decorator';

type CatalogRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  score: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

@RequirePermissions('inspections:read')
@Controller('inspections/finding-catalogs')
export class InspectionCriticalityCatalogController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('risk-probabilities')
  async findProbabilities(): Promise<InspectionRiskProbabilityResponse[]> {
    const rows = (await this.dataSource.query(`
      SELECT id, code, name, description, score, sort_order AS "sortOrder", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM inspection_risk_probabilities
      WHERE is_active = true
      ORDER BY sort_order ASC, score ASC
    `)) as CatalogRow[];
    return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() }));
  }

  @Get('risk-consequences')
  async findConsequences(): Promise<InspectionRiskConsequenceResponse[]> {
    const rows = (await this.dataSource.query(`
      SELECT id, code, name, description, score, sort_order AS "sortOrder", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM inspection_risk_consequences
      WHERE is_active = true
      ORDER BY sort_order ASC, score ASC
    `)) as CatalogRow[];
    return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() }));
  }
}
