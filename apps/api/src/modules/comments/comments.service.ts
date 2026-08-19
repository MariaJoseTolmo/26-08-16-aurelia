import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentResponse } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { EntityReferenceTypeEntity } from '../evidences/entities/entity-reference-type.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly comments: Repository<CommentEntity>,
    @InjectRepository(EntityReferenceTypeEntity)
    private readonly entityRefTypes: Repository<EntityReferenceTypeEntity>,
  ) {}

  async create(dto: CreateCommentDto): Promise<CommentResponse> {
    const refType = await this.entityRefTypes.findOneBy({ code: dto.entityType });
    if (!refType) throw new NotFoundException(`Entity type '${dto.entityType}' not registered`);

    const entity = this.comments.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      body: dto.body,
      isInternal: dto.isInternal ?? false,
      authorUserId: dto.authorUserId ?? null,
      isDeleted: false,
    });
    return this.toResponse(await this.comments.save(entity));
  }

  async findAll(entityType?: string, entityId?: string): Promise<CommentResponse[]> {
    const qb = this.comments
      .createQueryBuilder('c')
      .where('c.is_deleted = false')
      .orderBy('c.created_at', 'ASC');

    if (entityType) qb.andWhere('c.entity_type = :entityType', { entityType });
    if (entityId) qb.andWhere('c.entity_id = :entityId', { entityId });

    return (await qb.getMany()).map((e) => this.toResponse(e));
  }

  async softDelete(id: string): Promise<void> {
    const entity = await this.comments.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Comment ${id} not found`);
    entity.isDeleted = true;
    await this.comments.save(entity);
  }

  private toResponse(entity: CommentEntity): CommentResponse {
    return {
      id: entity.id,
      entityType: entity.entityType,
      entityId: entity.entityId,
      authorUserId: entity.authorUserId,
      body: entity.body,
      isInternal: entity.isInternal,
      isDeleted: entity.isDeleted,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
