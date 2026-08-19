import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ControlSelfAssessment } from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CriticalControlsService } from './critical-controls.service';
import { CreateControlSelfAssessmentDto, UpsertControlSelfAssessmentAnswersDto } from './dto/create-control-self-assessment.dto';

@RequirePermissions('critical-controls:read')
@Controller('critical-controls')
export class CriticalControlsController {
  constructor(private readonly criticalControlsService: CriticalControlsService) {}

  @Get('self-assessments')
  findAssessments(
    @Query('mueId') mueId?: string,
    @Query('status') status?: string,
  ): Promise<ControlSelfAssessment[]> {
    return this.criticalControlsService.findAssessments(mueId, status);
  }

  @Get('self-assessments/:id')
  findAssessment(@Param('id', ParseUUIDPipe) id: string): Promise<ControlSelfAssessment> {
    return this.criticalControlsService.findAssessment(id);
  }

  @RequirePermissions('critical-controls:write')
  @Post('self-assessments')
  createAssessment(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateControlSelfAssessmentDto,
  ): Promise<ControlSelfAssessment> {
    return this.criticalControlsService.createAssessment(dto, request.user.sub);
  }

  @RequirePermissions('critical-controls:write')
  @Patch('self-assessments/:id/answers')
  upsertAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertControlSelfAssessmentAnswersDto,
  ): Promise<ControlSelfAssessment> {
    return this.criticalControlsService.upsertAnswers(id, dto);
  }

  @RequirePermissions('critical-controls:submit')
  @Post('self-assessments/:id/submit')
  submitAssessment(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControlSelfAssessment> {
    return this.criticalControlsService.submitAssessment(id, request.user.sub);
  }
}
