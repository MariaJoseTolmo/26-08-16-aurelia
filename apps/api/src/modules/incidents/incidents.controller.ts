import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  IncidentActionPlanResponse,
  IncidentDashboardSummaryResponse,
  IncidentFiveWhyAnalysisResponse,
  IncidentFlashReportResponse,
  IncidentImmediateActionResponse,
  IncidentInvestigationResponse,
  IncidentLevelResponse,
  IncidentPeepoAnalysisResponse,
  IncidentResponse,
  IncidentTypeResponse,
} from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateIncidentFlashReportDto } from './dto/create-incident-flash-report.dto';
import { CreateIncidentImmediateActionDto, UpdateIncidentImmediateActionDto } from './dto/create-incident-immediate-action.dto';
import {
  CloseIncidentDto,
  CreateIncidentActionPlanDto,
  CreateIncidentInvestigationDto,
  UpdateIncidentActionPlanDto,
  UpdateIncidentInvestigationDto,
  UpsertIncidentFiveWhyAnalysisDto,
  UpsertIncidentPeepoAnalysisDto,
} from './dto/create-incident-investigation.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsService } from './incidents.service';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@RequirePermissions('incidents:read')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get('types')
  findTypes(): Promise<IncidentTypeResponse[]> {
    return this.incidentsService.findTypes();
  }

  @Get('levels')
  findLevels(): Promise<IncidentLevelResponse[]> {
    return this.incidentsService.findLevels();
  }

  @Get('dashboard/summary')
  dashboardSummary(): Promise<IncidentDashboardSummaryResponse> {
    return this.incidentsService.dashboardSummary();
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('incidentTypeId') incidentTypeId?: string,
    @Query('incidentLevelId') incidentLevelId?: string,
  ): Promise<IncidentResponse[]> {
    return this.incidentsService.findAll({ status, incidentTypeId, incidentLevelId });
  }

  @RequirePermissions('incidents:write')
  @Post()
  create(@Body() dto: CreateIncidentDto): Promise<IncidentResponse> {
    return this.incidentsService.create(dto);
  }

  @RequirePermissions('incidents:write')
  @Post(':id/flash-report')
  upsertFlashReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateIncidentFlashReportDto,
  ): Promise<IncidentFlashReportResponse> {
    return this.incidentsService.upsertFlashReport(id, dto);
  }

  @Get(':id/flash-report')
  findFlashReport(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentFlashReportResponse> {
    return this.incidentsService.findFlashReport(id);
  }

  @Get(':id/immediate-actions')
  findImmediateActions(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentImmediateActionResponse[]> {
    return this.incidentsService.findImmediateActions(id);
  }

  @RequirePermissions('incidents:write')
  @Post(':id/immediate-actions')
  createImmediateAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateIncidentImmediateActionDto,
  ): Promise<IncidentImmediateActionResponse> {
    return this.incidentsService.createImmediateAction(id, dto);
  }

  @RequirePermissions('incidents:write')
  @Patch('immediate-actions/:actionId')
  updateImmediateAction(
    @Param('actionId', ParseUUIDPipe) actionId: string,
    @Body() dto: UpdateIncidentImmediateActionDto,
  ): Promise<IncidentImmediateActionResponse> {
    return this.incidentsService.updateImmediateAction(actionId, dto);
  }

  @Get(':id/investigations')
  findInvestigations(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentInvestigationResponse[]> {
    return this.incidentsService.findInvestigations(id);
  }

  @RequirePermissions('incidents:write')
  @Post(':id/investigations')
  createInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateIncidentInvestigationDto,
  ): Promise<IncidentInvestigationResponse> {
    return this.incidentsService.createInvestigation(id, dto);
  }

  @RequirePermissions('incidents:write')
  @Patch('investigations/:investigationId')
  updateInvestigation(
    @Param('investigationId', ParseUUIDPipe) investigationId: string,
    @Body() dto: UpdateIncidentInvestigationDto,
  ): Promise<IncidentInvestigationResponse> {
    return this.incidentsService.updateInvestigation(investigationId, dto);
  }

  @RequirePermissions('incidents:write')
  @Post('investigations/:investigationId/five-why')
  upsertFiveWhy(
    @Param('investigationId', ParseUUIDPipe) investigationId: string,
    @Body() dto: UpsertIncidentFiveWhyAnalysisDto,
  ): Promise<IncidentFiveWhyAnalysisResponse> {
    return this.incidentsService.upsertFiveWhy(investigationId, dto);
  }

  @RequirePermissions('incidents:write')
  @Post('investigations/:investigationId/peepo')
  upsertPeepo(
    @Param('investigationId', ParseUUIDPipe) investigationId: string,
    @Body() dto: UpsertIncidentPeepoAnalysisDto,
  ): Promise<IncidentPeepoAnalysisResponse> {
    return this.incidentsService.upsertPeepo(investigationId, dto);
  }

  @Get(':id/action-plans')
  findActionPlans(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentActionPlanResponse[]> {
    return this.incidentsService.findActionPlans(id);
  }

  @RequirePermissions('incidents:write')
  @Post(':id/action-plans')
  createActionPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateIncidentActionPlanDto,
  ): Promise<IncidentActionPlanResponse> {
    return this.incidentsService.createActionPlan(id, dto);
  }

  @RequirePermissions('incidents:write')
  @Patch('action-plans/:actionPlanId')
  updateActionPlan(
    @Param('actionPlanId', ParseUUIDPipe) actionPlanId: string,
    @Body() dto: UpdateIncidentActionPlanDto,
  ): Promise<IncidentActionPlanResponse> {
    return this.incidentsService.updateActionPlan(actionPlanId, dto);
  }

  @RequirePermissions('incidents:write')
  @Post(':id/close')
  close(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CloseIncidentDto): Promise<IncidentResponse> {
    return this.incidentsService.close(id, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentResponse> {
    return this.incidentsService.findOne(id);
  }

  @RequirePermissions('incidents:write')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.updateStatus(id, dto);
  }

  @RequirePermissions('incidents:write')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.update(id, dto);
  }
}
