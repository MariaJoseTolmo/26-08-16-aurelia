import { BadRequestException, Body, Controller, ForbiddenException, Get, Logger, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import {
  INSPECTION_CAPABILITIES,
  InspectionAssignmentScopeResponse,
  InspectionCapability,
  InspectionChecklistAnswerResponse,
  InspectionChecklistTemplateResponse,
  InspectionDashboardSummaryResponse,
  InspectionDetailResponse,
  InspectionFindingResponse,
  InspectionFindingStatus,
  InspectionFollowupResponse,
  InspectionResponse,
  InspectionStatus,
  InspectionTypeResponse,
  UserResponse,
} from '@aurelia/contracts';
import { ResourceScopeService } from '../access-control/resource-scope.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequireAnyPermissions } from '../auth/require-any-permissions.decorator';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { UsersService } from '../users/users.service';
import { CloseInspectionDto } from './dto/close-inspection.dto';
import { CreateInspectionFindingDto } from './dto/create-inspection-finding.dto';
import { CreateInspectionFollowupDto } from './dto/create-inspection-followup.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionFindingDto } from './dto/update-inspection-finding.dto';
import { UpdateInspectionFollowupDto } from './dto/update-inspection-followup.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { UpdateInspectionStatusDto } from './dto/update-inspection-status.dto';
import { UpsertInspectionAnswerDto } from './dto/upsert-inspection-answer.dto';
import { InspectionAccessService } from './inspection-access.service';
import { InspectionAssignmentEmailService } from './inspection-assignment-email.service';
import { InspectionDetailService } from './inspection-detail.service';
import { InspectionTransitionPolicyService } from './inspection-transition-policy.service';
import { InspectionsService } from './inspections.service';

@RequirePermissions(INSPECTION_CAPABILITIES.read)
@Controller('inspections')
export class InspectionsController {
  private readonly logger = new Logger(InspectionsController.name);

  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly inspectionAccess: InspectionAccessService,
    private readonly usersService: UsersService,
    private readonly inspectionDetailService: InspectionDetailService,
    private readonly resourceScopeService: ResourceScopeService,
    private readonly assignmentEmails: InspectionAssignmentEmailService,
    private readonly transitions: InspectionTransitionPolicyService,
  ) {}

  @Get('types')
  findTypes(): Promise<InspectionTypeResponse[]> {
    return this.inspectionsService.findTypes();
  }

  @Get('templates')
  findTemplates(): Promise<InspectionChecklistTemplateResponse[]> {
    return this.inspectionsService.findTemplates();
  }

  @Get('responsible-users')
  async findResponsibleUsers(
    @Req() request: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ): Promise<UserResponse[]> {
    this.assertAnyCapability(request, [INSPECTION_CAPABILITIES.create, INSPECTION_CAPABILITIES.reassign]);
    const scopedCompanyId = await this.resourceScopeService.resolveInspectionAssignmentCompany(request.user, companyId);
    return this.usersService.findAll({ companyId: scopedCompanyId ?? undefined });
  }

  @Get('assignment-scope')
  getAssignmentScope(@Req() request: AuthenticatedRequest): Promise<InspectionAssignmentScopeResponse> {
    this.assertAnyCapability(request, [INSPECTION_CAPABILITIES.create, INSPECTION_CAPABILITIES.reassign]);
    return this.resourceScopeService.getInspectionAssignmentScope(request.user);
  }

  @Get('dashboard/summary')
  getDashboardSummary(@Req() request: AuthenticatedRequest): Promise<InspectionDashboardSummaryResponse> {
    return this.inspectionAccess.getDashboardSummary(request.user);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('inspectionTypeId') inspectionTypeId?: string,
  ): Promise<InspectionResponse[]> {
    const inspections = await this.inspectionsService.findAll({ status, inspectionTypeId });
    return this.inspectionAccess.filterResponses(request.user, inspections);
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.create)
  @Post()
  async create(@Body() dto: CreateInspectionDto, @Req() request: AuthenticatedRequest): Promise<InspectionResponse> {
    const companyId = await this.resourceScopeService.resolveInspectionAssignmentCompany(request.user, dto.companyId);
    await this.resourceScopeService.assertCanAccessInspection(request.user, { companyId, areaId: dto.areaId });
    return this.inspectionsService.create({ ...dto, companyId }, request.user.sub);
  }

  @Get(':id/findings')
  async findFindings(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionFindingResponse[]> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionsService.findFindings(id);
  }

  @Get(':id/detail')
  async getDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionDetailResponse> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionDetailService.getDetail(id, request.user.sub);
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.create)
  @Post(':id/findings')
  async createFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInspectionFindingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionFindingResponse> {
    await this.inspectionAccess.assertInspection(request.user, id);
    const responsibleCompanyId = await this.resourceScopeService.resolveInspectionAssignmentCompany(
      request.user,
      dto.responsibleCompanyId,
    );
    return this.inspectionsService.createFinding(id, { ...dto, responsibleCompanyId }, request.user.sub);
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.review)
  @Post(':id/close')
  async closeInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseInspectionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionResponse> {
    const inspection = await this.inspectionAccess.assertInspection(request.user, id);
    this.transitions.assertInspectionTransition(inspection.status, InspectionStatus.CLOSED);
    if (inspection.openFindingsCount > 0) throw new BadRequestException('Inspection has open findings');
    const closedAt = new Date().toISOString();
    return this.inspectionsService.update(
      id,
      {
        status: InspectionStatus.CLOSED,
        completedAt: inspection.completedAt?.toISOString() ?? closedAt,
        closedAt: inspection.closedAt?.toISOString() ?? closedAt,
        reason: dto.reason ?? null,
      },
      request.user.sub,
    );
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.execute)
  @Post(':id/answers')
  async upsertAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertInspectionAnswerDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionChecklistAnswerResponse> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionsService.upsertAnswer(id, dto, request.user.sub);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionResponse> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionsService.findOne(id);
  }

  @RequireAnyPermissions(
    INSPECTION_CAPABILITIES.execute,
    INSPECTION_CAPABILITIES.review,
    INSPECTION_CAPABILITIES.admin,
  )
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionStatusDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionResponse> {
    const previousEntity = await this.inspectionAccess.assertInspection(request.user, id);
    this.transitions.assertInspectionTransition(previousEntity.status, dto.status);
    if (dto.status === InspectionStatus.CLOSED) this.assertCapability(request, INSPECTION_CAPABILITIES.review);
    else if (dto.status === InspectionStatus.CANCELLED) this.assertCapability(request, INSPECTION_CAPABILITIES.admin);
    else this.assertCapability(request, INSPECTION_CAPABILITIES.execute);

    const previous = await this.inspectionsService.findOne(previousEntity.id);
    if (dto.status !== InspectionStatus.CLOSED) {
      const updated = await this.inspectionsService.updateStatus(id, dto, request.user.sub);
      await this.notifyIfInspectionActivated(previous.status, updated);
      return updated;
    }
    const closedAt = new Date().toISOString();
    return this.inspectionsService.update(
      id,
      {
        status: InspectionStatus.CLOSED,
        completedAt: previous.completedAt ?? closedAt,
        closedAt: previous.closedAt ?? closedAt,
        reason: dto.comment ?? null,
      },
      request.user.sub,
    );
  }

  @RequireAnyPermissions(
    INSPECTION_CAPABILITIES.execute,
    INSPECTION_CAPABILITIES.review,
    INSPECTION_CAPABILITIES.reassign,
    INSPECTION_CAPABILITIES.admin,
  )
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionResponse> {
    const previous = await this.inspectionAccess.assertInspection(request.user, id);
    const changesScope = dto.companyId !== undefined
      || dto.areaId !== undefined
      || dto.sectorId !== undefined
      || dto.locationId !== undefined;
    if (changesScope) {
      this.assertCapability(request, INSPECTION_CAPABILITIES.reassign);
      const companyId = dto.companyId === undefined ? previous.companyId : dto.companyId;
      const areaId = dto.areaId === undefined ? previous.areaId : dto.areaId;
      await this.resourceScopeService.assertCanAccessInspection(request.user, { companyId, areaId });
    }

    if (dto.status !== undefined) {
      this.transitions.assertInspectionTransition(previous.status, dto.status);
      if (dto.status === InspectionStatus.CLOSED) this.assertCapability(request, INSPECTION_CAPABILITIES.review);
      else if (dto.status === InspectionStatus.CANCELLED) this.assertCapability(request, INSPECTION_CAPABILITIES.admin);
      else this.assertCapability(request, INSPECTION_CAPABILITIES.execute);
    }

    if (this.hasInspectionOperationalChanges(dto)) this.assertCapability(request, INSPECTION_CAPABILITIES.execute);

    const updated = await this.inspectionsService.update(id, dto, request.user.sub);
    await this.notifyIfInspectionActivated(previous.status, updated);
    return updated;
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.execute)
  @Post('findings/:findingId/followups')
  async createFollowup(
    @Param('findingId', ParseUUIDPipe) findingId: string,
    @Body() dto: CreateInspectionFollowupDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionFollowupResponse> {
    await this.inspectionAccess.assertFinding(request.user, findingId);
    return this.inspectionsService.createFollowup(findingId, dto, request.user.sub);
  }

  @RequireAnyPermissions(
    INSPECTION_CAPABILITIES.execute,
    INSPECTION_CAPABILITIES.review,
    INSPECTION_CAPABILITIES.reassign,
    INSPECTION_CAPABILITIES.admin,
  )
  @Patch('findings/:findingId')
  async updateFinding(
    @Param('findingId', ParseUUIDPipe) findingId: string,
    @Body() dto: UpdateInspectionFindingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionFindingResponse> {
    const currentFinding = await this.inspectionAccess.assertFinding(request.user, findingId);
    if (dto.status !== undefined) {
      this.transitions.assertFindingTransition(currentFinding.status, dto.status);
    }
    const isCancellation = dto.status === InspectionFindingStatus.CANCELLED;
    const isReviewAction = dto.status === InspectionFindingStatus.CLOSED
      || dto.status === InspectionFindingStatus.REJECTED
      || dto.closedAt !== undefined
      || dto.rejectedAt !== undefined
      || dto.rejectionReason !== undefined;

    if (isCancellation) {
      this.assertCapability(request, INSPECTION_CAPABILITIES.admin);
    } else if (isReviewAction) {
      this.assertCapability(request, INSPECTION_CAPABILITIES.review);
      if (!(await this.resourceScopeService.canReviewInspectionFindings(request.user))) {
        throw new ForbiddenException('Only authorized Gold Fields users can approve or reject findings');
      }
    }

    const changesAssignment = dto.ownerUserId !== undefined
      || dto.responsibleUserIds !== undefined
      || dto.dueAt !== undefined;
    if (changesAssignment) this.assertCapability(request, INSPECTION_CAPABILITIES.reassign);

    if (this.hasFindingOperationalChanges(dto, isReviewAction, isCancellation)) {
      this.assertCapability(request, INSPECTION_CAPABILITIES.execute);
    }

    const finding = await this.inspectionsService.updateFinding(findingId, dto, request.user.sub);
    await this.closeInspectionIfAllFindingsClosed(finding.inspectionId, request.user.sub);
    return finding;
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.execute)
  @Patch('followups/:followupId')
  async updateFollowup(
    @Param('followupId', ParseUUIDPipe) followupId: string,
    @Body() dto: UpdateInspectionFollowupDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionFollowupResponse> {
    await this.inspectionAccess.assertFollowup(request.user, followupId);
    return this.inspectionsService.updateFollowup(followupId, dto);
  }

  private hasInspectionOperationalChanges(dto: UpdateInspectionDto): boolean {
    return dto.inspectionTypeId !== undefined
      || dto.templateId !== undefined
      || dto.title !== undefined
      || dto.description !== undefined
      || dto.scheduledAt !== undefined
      || dto.startedAt !== undefined
      || dto.completedAt !== undefined
      || dto.latitude !== undefined
      || dto.longitude !== undefined
      || dto.score !== undefined
      || dto.notes !== undefined;
  }

  private hasFindingOperationalChanges(
    dto: UpdateInspectionFindingDto,
    isReviewAction: boolean,
    isCancellation: boolean,
  ): boolean {
    const operationalStatus = dto.status !== undefined
      && dto.status !== InspectionFindingStatus.CLOSED
      && dto.status !== InspectionFindingStatus.REJECTED
      && dto.status !== InspectionFindingStatus.CANCELLED;
    return operationalStatus
      || dto.title !== undefined
      || dto.description !== undefined
      || dto.detectedCondition !== undefined
      || dto.proposedCorrectiveAction !== undefined
      || dto.executedActionDescription !== undefined
      || dto.severity !== undefined
      || dto.executedAt !== undefined
      || (!isReviewAction && !isCancellation && dto.reason !== undefined);
  }

  private assertAnyCapability(request: AuthenticatedRequest, capabilities: InspectionCapability[]): void {
    if (request.user.roles.includes('ADMIN')) return;
    if (request.user.permissions.includes(INSPECTION_CAPABILITIES.admin)) return;
    if (capabilities.some((capability) => request.user.permissions.includes(capability))) return;
    throw new ForbiddenException('Insufficient inspection capability');
  }

  private assertCapability(request: AuthenticatedRequest, capability: InspectionCapability): void {
    this.assertAnyCapability(request, [capability]);
  }

  private async notifyIfInspectionActivated(previousStatus: InspectionStatus, updated: InspectionResponse): Promise<void> {
    if (previousStatus === InspectionStatus.IN_PROGRESS || updated.status !== InspectionStatus.IN_PROGRESS) return;
    await this.assignmentEmails.notifyInspectionAssigned(updated.id).catch((error) => {
      this.logAssignmentEmailFailure(updated.id, error);
    });
  }

  private logAssignmentEmailFailure(inspectionId: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    this.logger.error(`Unable to dispatch inspection assignment email inspection=${inspectionId}: ${detail}`);
  }

  private async closeInspectionIfAllFindingsClosed(inspectionId: string, actorId: string | null): Promise<void> {
    const [inspection, findings] = await Promise.all([
      this.inspectionsService.findOne(inspectionId),
      this.inspectionsService.findFindings(inspectionId),
    ]);
    if (inspection.status === InspectionStatus.CLOSED || inspection.status === InspectionStatus.CANCELLED) return;
    const activeFindings = findings.filter((finding) => finding.status !== InspectionFindingStatus.CANCELLED);
    if (activeFindings.length === 0) return;
    if (activeFindings.some((finding) => finding.status !== InspectionFindingStatus.CLOSED)) return;
    this.transitions.assertInspectionTransition(inspection.status, InspectionStatus.CLOSED);
    const closedAt = new Date().toISOString();
    await this.inspectionsService.update(
      inspectionId,
      {
        status: InspectionStatus.CLOSED,
        completedAt: inspection.completedAt ?? closedAt,
        closedAt: inspection.closedAt ?? closedAt,
        reason: 'all findings closed',
      },
      actorId,
    );
  }
}
