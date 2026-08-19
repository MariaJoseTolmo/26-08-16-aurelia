import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EvidenceResponse, EvidenceLinkResponse } from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { EvidencesService } from './evidences.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { LinkEvidenceDto } from './dto/link-evidence.dto';
import { ValidateEvidenceDto } from './dto/validate-evidence.dto';

@RequirePermissions('evidences:read')
@Controller('evidences')
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @RequirePermissions('evidences:write')
  @Post()
  create(@Body() dto: CreateEvidenceDto): Promise<EvidenceResponse> {
    return this.evidencesService.create(dto);
  }

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<EvidenceResponse[]> {
    return this.evidencesService.findAll(entityType, entityId);
  }

  @RequirePermissions('evidences:write')
  @Post(':id/link')
  link(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkEvidenceDto,
  ): Promise<EvidenceLinkResponse> {
    return this.evidencesService.link(id, dto);
  }

  @RequirePermissions('evidences:validate')
  @Patch(':id/validate')
  validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidateEvidenceDto,
  ): Promise<EvidenceResponse> {
    return this.evidencesService.validate(id, dto);
  }
}
