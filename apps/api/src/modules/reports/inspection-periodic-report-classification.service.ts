import { Injectable } from '@nestjs/common';
import type {
  InspectionPeriodicReportDistributionRowResponse,
  InspectionPeriodicReportInspectionRowResponse,
  InspectionPeriodicReportResponse,
} from '@aurelia/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InspectionEntity } from '../inspections/entities/inspection.entity';

@Injectable()
export class InspectionPeriodicReportClassificationService {
  constructor(
    @InjectRepository(InspectionEntity)
    private readonly inspections: Repository<InspectionEntity>,
  ) {}

  async normalize(report: InspectionPeriodicReportResponse): Promise<InspectionPeriodicReportResponse> {
    const inspectionIds = report.inspections.rows.map((row) => row.inspectionId);
    if (inspectionIds.length === 0) return report;

    const inspections = await this.inspections.find({
      where: { id: In(inspectionIds) },
      select: {
        id: true,
        templateId: true,
      },
    });
    const typeByInspectionId = new Map(
      inspections.map((inspection) => [
        inspection.id,
        inspection.templateId ? 'Checklist' : 'Hallazgo',
      ]),
    );

    const rows = report.inspections.rows.map((row) => this.normalizeRow(row, typeByInspectionId));
    const normalizedRowById = new Map(rows.map((row) => [row.inspectionId, row]));
    const attentionRows = report.attention.rows.map((row) => (
      normalizedRowById.get(row.inspectionId) ?? this.normalizeRow(row, typeByInspectionId)
    ));

    return {
      ...report,
      inspectionsByType: this.buildDistribution(rows.map((row) => row.type)),
      inspections: {
        ...report.inspections,
        rows,
      },
      attention: {
        ...report.attention,
        rows: attentionRows.map((row) => ({ ...row, requiresImmediateAttention: true })),
      },
    };
  }

  private normalizeRow(
    row: InspectionPeriodicReportInspectionRowResponse,
    typeByInspectionId: Map<string, string>,
  ): InspectionPeriodicReportInspectionRowResponse {
    return {
      ...row,
      type: typeByInspectionId.get(row.inspectionId) ?? row.type,
    };
  }

  private buildDistribution(values: string[]): InspectionPeriodicReportDistributionRowResponse[] {
    const counts = values.reduce<Map<string, number>>(
      (map, value) => map.set(value, (map.get(value) ?? 0) + 1),
      new Map(),
    );
    const order = new Map([
      ['Hallazgo', 0],
      ['Checklist', 1],
    ]);

    return Array.from(counts.entries())
      .map(([label, count]) => ({
        key: label.toLowerCase(),
        label,
        count,
        percentage: values.length > 0 ? Number(((count / values.length) * 100).toFixed(2)) : 0,
      }))
      .sort((left, right) => (
        (order.get(left.label) ?? 99) - (order.get(right.label) ?? 99)
        || right.count - left.count
      ));
  }
}
