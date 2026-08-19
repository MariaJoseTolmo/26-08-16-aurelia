import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { InspectionFindingSeverityResponse, InspectionFindingTypeResponse } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { InspectionFindingSeverityEntity } from './entities/inspection-finding-severity.entity';
import { InspectionFindingTypeEntity } from './entities/inspection-finding-type.entity';

@Injectable()
export class InspectionFindingCatalogService {
  constructor(
    @InjectRepository(InspectionFindingTypeEntity)
    private readonly findingTypes: Repository<InspectionFindingTypeEntity>,
    @InjectRepository(InspectionFindingSeverityEntity)
    private readonly findingSeverities: Repository<InspectionFindingSeverityEntity>,
  ) {}

  async findTypes(): Promise<InspectionFindingTypeResponse[]> {
    const rows = await this.findingTypes.find({ where: { isActive: true }, order: { sortOrder: 'ASC', name: 'ASC' } });
    return rows.map((row) => this.toTypeResponse(row));
  }

  async findSeverities(): Promise<InspectionFindingSeverityResponse[]> {
    const rows = await this.findingSeverities.find({ where: { isActive: true }, order: { sortOrder: 'ASC', name: 'ASC' } });
    return rows.map((row) => this.toSeverityResponse(row));
  }

  private toTypeResponse(entity: InspectionFindingTypeEntity): InspectionFindingTypeResponse {
    return { id: entity.id, code: entity.code, name: entity.name, sortOrder: entity.sortOrder, isActive: entity.isActive, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }

  private toSeverityResponse(entity: InspectionFindingSeverityEntity): InspectionFindingSeverityResponse {
    return { id: entity.id, code: entity.code, name: entity.name, description: entity.description, closureTimeLabel: entity.closureTimeLabel, sortOrder: entity.sortOrder, isActive: entity.isActive, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
  }
}
