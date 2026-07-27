import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import {
  CommentResponse,
  EvidenceLinkResponse,
  EvidenceResponse,
  Role,
  SprMonthlyRecordResponse,
  SprRecordApprovalResponse,
} from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { RequireRoles } from '../auth/require-roles.decorator';
import { SprService } from './spr.service';
import { CreateSprMonthlyRecordDto } from './dto/create-spr-monthly-record.dto';
import { CreateSprRecordCommentDto } from './dto/create-spr-record-comment.dto';
import { LinkSprRecordEvidenceDto } from './dto/link-spr-record-evidence.dto';
import { SprRecordActionDto } from './dto/spr-record-action.dto';
import { UpdateSprMonthlyRecordStatusDto } from './dto/update-spr-monthly-record-status.dto';
import { UpdateSprMonthlyRecordDto } from './dto/update-spr-monthly-record.dto';

const SPR_MODULE_ROLES = [
  Role.ADMIN,
  Role.SPR_RESPONSIBLE,
  Role.SPR_AREA_MANAGER,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_ENVIRONMENT_MANAGER,
] as const;

const SPR_WRITE_ROLES = [Role.ADMIN, Role.SPR_RESPONSIBLE, Role.SPR_AREA_MANAGER] as const;

const SPR_APPROVE_ROLES = [
  Role.ADMIN,
  Role.SPR_AREA_MANAGER,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_ENVIRONMENT_MANAGER,
] as const;

@RequirePermissions('spr:read')
@RequireRoles(...SPR_MODULE_ROLES)
@Controller('spr')
export class SprController {
  constructor(private readonly sprService: SprService) {}

  @Get('groups')
  findGroups() {
    return this.sprService.findGroups();
  }

  @Get('measure-groups')
  findMeasureGroups() {
    return this.sprService.findGroups();
  }

  @Get('units')
  findUnits() {
    return this.sprService.findUnits();
  }

  @Get('parameters')
  findParameters() {
    return this.sprService.findParameters();
  }

  @Get('assignments')
  findAssignments() {
    return this.sprService.findAssignments();
  }

  @RequirePermissions('spr:write')
  @RequireRoles(...SPR_WRITE_ROLES)
  @Post('monthly-records')
  createMonthlyRecord(@Body() dto: CreateSprMonthlyRecordDto) {
    return this.sprService.createMonthlyRecord(dto);
  }

  @Get('monthly-records')
  findMonthlyRecords(@Query() query: Record<string, string | undefined>) {
    return this.sprService.findMonthlyRecords(query);
  }

  @RequirePermissions('evidences:read')
  @Get('monthly-records/:id/evidences')
  findRecordEvidences(@Param('id', ParseUUIDPipe) id: string): Promise<EvidenceResponse[]> {
    return this.sprService.findRecordEvidences(id);
  }

  @RequirePermissions('spr:write', 'evidences:write')
  @RequireRoles(...SPR_WRITE_ROLES)
  @Post('monthly-records/:id/evidences/:evidenceId/link')
  linkRecordEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body() dto: LinkSprRecordEvidenceDto,
  ): Promise<EvidenceLinkResponse> {
    return this.sprService.linkRecordEvidence(id, evidenceId, dto, null);
  }

  @RequirePermissions('comments:read')
  @Get('monthly-records/:id/comments')
  findRecordComments(@Param('id', ParseUUIDPipe) id: string): Promise<CommentResponse[]> {
    return this.sprService.findRecordComments(id);
  }

  @RequirePermissions('comments:write')
  @Post('monthly-records/:id/comments')
  createRecordComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSprRecordCommentDto,
  ): Promise<CommentResponse> {
    return this.sprService.createRecordComment(id, dto, null);
  }

  @Get('monthly-records/:id/approvals')
  findRecordApprovals(@Param('id', ParseUUIDPipe) id: string): Promise<SprRecordApprovalResponse[]> {
    return this.sprService.findRecordApprovals(id);
  }

  @RequirePermissions('spr:submit')
  @RequireRoles(...SPR_WRITE_ROLES)
  @Post('monthly-records/:id/submit')
  @HttpCode(200)
  submitRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SprRecordActionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SprMonthlyRecordResponse> {
    return this.sprService.submitRecord(id, {
      ...dto,
      submittedByUserId: dto.submittedByUserId ?? request.user.sub,
    });
  }

  @RequirePermissions('spr:approve')
  @RequireRoles(...SPR_APPROVE_ROLES)
  @Post('monthly-records/:id/approve')
  @HttpCode(200)
  approveRecord(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SprRecordActionDto): Promise<SprMonthlyRecordResponse> {
    return this.sprService.approveRecord(id, dto);
  }

  @RequirePermissions('spr:approve')
  @RequireRoles(...SPR_APPROVE_ROLES)
  @Post('monthly-records/:id/reject')
  @HttpCode(200)
  rejectRecord(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SprRecordActionDto): Promise<SprMonthlyRecordResponse> {
    return this.sprService.rejectRecord(id, dto);
  }

  @Get('monthly-records/:id')
  findMonthlyRecord(@Param('id', ParseUUIDPipe) id: string) {
    return this.sprService.findMonthlyRecord(id);
  }

  @RequirePermissions('spr:write')
  @RequireRoles(...SPR_WRITE_ROLES)
  @Patch('monthly-records/:id')
  updateMonthlyRecord(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSprMonthlyRecordDto) {
    return this.sprService.updateMonthlyRecord(id, dto);
  }

  @RequirePermissions('spr:write')
  @RequireRoles(...SPR_WRITE_ROLES)
  @Patch('monthly-records/:id/status')
  updateMonthlyRecordStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSprMonthlyRecordStatusDto) {
    return this.sprService.updateMonthlyRecordStatus(id, dto);
  }
}
