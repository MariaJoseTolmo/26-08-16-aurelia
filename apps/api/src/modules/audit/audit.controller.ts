import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogResponse } from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
@RequirePermissions('permissions:read')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<AuditLogResponse[]> {
    return this.auditService.findAll(entityType, entityId);
  }
}
