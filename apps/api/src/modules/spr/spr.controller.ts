import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import {
  CommentResponse,
  EvidenceLinkResponse,
  EvidenceResponse,
  Role,
  SprCycleResponse,
  SprCycleSacSubmissionResponse,
  SprCycleSignatureResponse,
  SprCycleValidationResponse,
  SprMonthlyRecordResponse,
  SprRecordApprovalResponse,
} from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { RequireRoles } from '../auth/require-roles.decorator';
import { SprService } from './spr.service';
import { CreateSprCycleSignatureDto } from './dto/create-spr-cycle-signature.dto';
import { CreateSprCycleValidationDto } from './dto/create-spr-cycle-validation.dto';
import { ReopenSprCycleValidationDto } from './dto/reopen-spr-cycle-validation.dto';
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

/** Stubs SAC de ciclo: especialista / gerente MA / admin (tienen spr:validate). */
const SPR_CYCLE_SAC_STUB_ROLES = [
  Role.ADMIN,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_ENVIRONMENT_MANAGER,
] as const;

/** Firmas de ciclo: especialista / gerente MA / admin. */
const SPR_CYCLE_SIGNATURE_ROLES = [
  Role.ADMIN,
  Role.SPR_SUSTAINABILITY_SPECIALIST,
  Role.SPR_ENVIRONMENT_MANAGER,
] as const;

/** Validación SOX: Responsable de área / admin. */
const SPR_CYCLE_VALIDATION_ROLES = [Role.ADMIN, Role.SPR_RESPONSIBLE] as const;

/** Reabrir área SOX: Especialista / admin. */
const SPR_CYCLE_REOPEN_ROLES = [Role.ADMIN, Role.SPR_SUSTAINABILITY_SPECIALIST] as const;

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

  @Get('cycles')
  findCycles(
    @Query('periodYear') periodYear: string | undefined,
    @Query('periodMonth') periodMonth: string | undefined,
    @Query('status') status: string | undefined,
  ): Promise<SprCycleResponse[]> {
    return this.sprService.findCycles({ periodYear, periodMonth, status });
  }

  @Get('cycles/:id/sac')
  findCycleSacSubmission(@Param('id', ParseUUIDPipe) id: string): Promise<SprCycleSacSubmissionResponse> {
    return this.sprService.findCycleSacSubmission(id);
  }

  /** Stub demo Fase 2 — no integra SAC externo. */
  @RequirePermissions('spr:validate')
  @RequireRoles(...SPR_CYCLE_SAC_STUB_ROLES)
  @Post('cycles/:id/sac/prepare')
  prepareCycleSacSubmission(@Param('id', ParseUUIDPipe) id: string): Promise<SprCycleSacSubmissionResponse> {
    return this.sprService.prepareCycleSacSubmission(id);
  }

  /** Stub demo Fase 2 — marca report_ready + ciclo sac_available. */
  @RequirePermissions('spr:validate')
  @RequireRoles(...SPR_CYCLE_SAC_STUB_ROLES)
  @Post('cycles/:id/sac/mark-ready')
  markCycleSacReportReady(@Param('id', ParseUUIDPipe) id: string): Promise<SprCycleSacSubmissionResponse> {
    return this.sprService.markCycleSacReportReady(id);
  }

  @Get('cycles/:id/signatures')
  findCycleSignatures(@Param('id', ParseUUIDPipe) id: string): Promise<SprCycleSignatureResponse[]> {
    return this.sprService.findCycleSignatures(id);
  }

  /** Fase 3 — firma specialist | environment_manager (orden Tania→Gabriel). */
  @RequirePermissions('spr:validate')
  @RequireRoles(...SPR_CYCLE_SIGNATURE_ROLES)
  @Post('cycles/:id/signatures')
  createCycleSignature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSprCycleSignatureDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SprCycleSignatureResponse> {
    return this.sprService.createCycleSignature(id, dto, {
      userId: request.user.sub,
      roles: request.user.roles,
    });
  }

  @Get('cycles/:id/validations')
  findCycleValidations(@Param('id', ParseUUIDPipe) id: string): Promise<SprCycleValidationResponse[]> {
    return this.sprService.findCycleValidations(id);
  }

  /** Fase 5 — Responsable SOX aprueba o reporta discrepancia. */
  @RequirePermissions('spr:write')
  @RequireRoles(...SPR_CYCLE_VALIDATION_ROLES)
  @Post('cycles/:id/validations')
  createCycleValidation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSprCycleValidationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SprCycleValidationResponse> {
    return this.sprService.createCycleValidation(id, dto, {
      userId: request.user.sub,
      roles: request.user.roles,
    });
  }

  /** Fase 5.1 — Especialista reabre área SOX con discrepancia. */
  @RequirePermissions('spr:validate')
  @RequireRoles(...SPR_CYCLE_REOPEN_ROLES)
  @Post('cycles/:id/validations/:areaId/reopen')
  @HttpCode(200)
  reopenCycleValidation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('areaId', ParseUUIDPipe) areaId: string,
    @Body() dto: ReopenSprCycleValidationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SprCycleValidationResponse> {
    return this.sprService.reopenCycleValidation(id, areaId, {
      userId: request.user.sub,
      roles: request.user.roles,
    }, dto);
  }

  @Get('cycles/:id')
  findCycle(@Param('id', ParseUUIDPipe) id: string): Promise<SprCycleResponse> {
    return this.sprService.findCycle(id);
  }

  @Get('parameters')
  findParameters(@Query('areaId') areaId: string | undefined, @Req() request: AuthenticatedRequest) {
    return this.sprService.findParameters({
      areaId,
      roles: request.user.roles,
      userId: request.user.sub,
    });
  }

  @Get('assignments')
  findAssignments(@Query('areaId') areaId: string | undefined, @Req() request: AuthenticatedRequest) {
    return this.sprService.findAssignments({
      areaId,
      roles: request.user.roles,
      userId: request.user.sub,
    });
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
