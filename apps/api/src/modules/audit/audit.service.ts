import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogResponse } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogResponse> {
    const entity = this.auditLogs.create({
      entityType: dto.entityType ?? null,
      entityId: dto.entityId ?? null,
      actorUserId: dto.actorUserId ?? null,
      action: dto.action,
      oldValue: dto.oldValue ?? null,
      newValue: dto.newValue ?? null,
      metadata: dto.metadata ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
    });
    return this.toResponse(await this.auditLogs.save(entity));
  }

  async logSafe(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.log(dto);
    } catch (err) {
      this.logger.warn(err instanceof Error ? err.message : 'Audit log failed');
    }
  }

  async findAll(entityType?: string, entityId?: string): Promise<AuditLogResponse[]> {
    const qb = this.auditLogs
      .createQueryBuilder('a')
      .orderBy('a.created_at', 'DESC')
      .take(500);

    if (entityType) qb.andWhere('a.entity_type = :entityType', { entityType });
    if (entityId) qb.andWhere('a.entity_id = :entityId', { entityId });

    return (await qb.getMany()).map((e) => this.toResponse(e));
  }

  private toResponse(entity: AuditLogEntity): AuditLogResponse {
    return {
      id: entity.id,
      entityType: entity.entityType,
      entityId: entity.entityId,
      actorUserId: entity.actorUserId,
      action: entity.action,
      oldValue: entity.oldValue,
      newValue: entity.newValue,
      metadata: entity.metadata,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
