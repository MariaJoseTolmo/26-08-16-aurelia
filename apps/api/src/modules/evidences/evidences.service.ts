import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EvidenceResponse, EvidenceLinkResponse, EvidenceStatus } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { EvidenceEntity } from './entities/evidence.entity';
import { EvidenceLinkEntity } from './entities/evidence-link.entity';
import { EntityReferenceTypeEntity } from './entities/entity-reference-type.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { LinkEvidenceDto } from './dto/link-evidence.dto';
import { ValidateEvidenceDto } from './dto/validate-evidence.dto';

@Injectable()
export class EvidencesService {
  constructor(
    @InjectRepository(EvidenceEntity)
    private readonly evidences: Repository<EvidenceEntity>,
    @InjectRepository(EvidenceLinkEntity)
    private readonly evidenceLinks: Repository<EvidenceLinkEntity>,
    @InjectRepository(EntityReferenceTypeEntity)
    private readonly entityRefTypes: Repository<EntityReferenceTypeEntity>,
  ) {}

  async create(dto: CreateEvidenceDto): Promise<EvidenceResponse> {
    const entity = this.evidences.create({
      fileId: dto.fileId ?? null,
      title: dto.title ?? null,
      description: dto.description ?? null,
      evidenceType: dto.evidenceType ?? null,
      capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      createdByUserId: dto.createdByUserId ?? null,
      status: EvidenceStatus.UPLOADED,
    });
    const saved = await this.evidences.save(entity);
    return this.toResponse(await this.findEntity(saved.id));
  }

  async findAll(entityType?: string, entityId?: string): Promise<EvidenceResponse[]> {
    if (entityType && entityId) {
      const links = await this.evidenceLinks.find({
        where: { entityType, entityId },
        relations: { evidence: { links: true } },
      });
      return links.map((l) => this.toResponse(l.evidence));
    }
    const rows = await this.evidences.find({
      order: { createdAt: 'DESC' },
      relations: { links: true },
    });
    return rows.map((r) => this.toResponse(r));
  }

  async link(evidenceId: string, dto: LinkEvidenceDto): Promise<EvidenceLinkResponse> {
    const evidence = await this.evidences.findOneBy({ id: evidenceId });
    if (!evidence) throw new NotFoundException(`Evidence ${evidenceId} not found`);

    const refType = await this.entityRefTypes.findOneBy({ code: dto.entityType });
    if (!refType) throw new NotFoundException(`Entity type '${dto.entityType}' not registered`);

    const existing = await this.evidenceLinks.findOne({
      where: {
        evidenceId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        relationType: dto.relationType ?? 'supporting_evidence',
      },
    });
    if (existing) return this.toLinkResponse(existing);

    const link = this.evidenceLinks.create({
      evidenceId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      relationType: dto.relationType ?? 'supporting_evidence',
    });
    return this.toLinkResponse(await this.evidenceLinks.save(link));
  }

  async validate(evidenceId: string, dto: ValidateEvidenceDto): Promise<EvidenceResponse> {
    const entity = await this.findEntity(evidenceId);
    entity.status = dto.status;
    entity.validationNotes = dto.validationNotes ?? null;
    entity.validatedByUserId = dto.validatedByUserId ?? null;
    entity.validatedAt = new Date();
    await this.evidences.save(entity);
    return this.toResponse(await this.findEntity(evidenceId));
  }

  private async findEntity(id: string): Promise<EvidenceEntity> {
    const entity = await this.evidences.findOne({
      where: { id },
      relations: { links: true },
    });
    if (!entity) throw new NotFoundException(`Evidence ${id} not found`);
    return entity;
  }

  private toResponse(entity: EvidenceEntity): EvidenceResponse {
    return {
      id: entity.id,
      fileId: entity.fileId,
      title: entity.title,
      description: entity.description,
      evidenceType: entity.evidenceType,
      status: entity.status,
      capturedAt: entity.capturedAt ? entity.capturedAt.toISOString() : null,
      latitude: entity.latitude !== null ? Number(entity.latitude) : null,
      longitude: entity.longitude !== null ? Number(entity.longitude) : null,
      createdByUserId: entity.createdByUserId,
      validatedByUserId: entity.validatedByUserId,
      validatedAt: entity.validatedAt ? entity.validatedAt.toISOString() : null,
      validationNotes: entity.validationNotes,
      links: entity.links?.map((l) => this.toLinkResponse(l)) ?? [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toLinkResponse(entity: EvidenceLinkEntity): EvidenceLinkResponse {
    return {
      id: entity.id,
      evidenceId: entity.evidenceId,
      entityType: entity.entityType,
      entityId: entity.entityId,
      relationType: entity.relationType,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
