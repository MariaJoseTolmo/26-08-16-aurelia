import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import {
  INSPECTION_CAPABILITIES,
  InspectionAiAssessmentResponse,
  InspectionProcessRequestResponse,
} from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequireAnyPermissions } from '../auth/require-any-permissions.decorator';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { InspectionAiPreValidationDto, RecordInspectionAiDecisionDto, ResubmitInspectionEvidenceDto } from './dto/inspection-process.dto';
import { InspectionAccessService } from './inspection-access.service';
import { InspectionProcessService } from './inspection-process.service';

@RequirePermissions(INSPECTION_CAPABILITIES.read)
@Controller('inspections')
export class InspectionProcessController {
  constructor(
    private readonly processService: InspectionProcessService,
    private readonly inspectionAccess: InspectionAccessService,
  ) {}

  @RequirePermissions(INSPECTION_CAPABILITIES.execute)
  @Post('findings/:findingId/evidence-resubmissions')
  async resubmitEvidence(
    @Param('findingId', ParseUUIDPipe) findingId: string,
    @Body() dto: ResubmitInspectionEvidenceDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionProcessRequestResponse> {
    await this.inspectionAccess.assertFinding(request.user, findingId);
    return this.processService.resubmitEvidence(findingId, dto, request.user.sub);
  }

  @RequireAnyPermissions(INSPECTION_CAPABILITIES.create, INSPECTION_CAPABILITIES.execute)
  @Post(':inspectionId/ai/pre-validation')
  async preValidate(
    @Param('inspectionId', ParseUUIDPipe) inspectionId: string,
    @Body() dto: InspectionAiPreValidationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionAiAssessmentResponse> {
    await this.inspectionAccess.assertInspection(request.user, inspectionId);
    if (dto.findingId) await this.inspectionAccess.assertFinding(request.user, dto.findingId);
    return this.processService.preValidate(inspectionId, dto, request.user.sub);
  }

  @Get(':inspectionId/ai/assessments')
  async findAiAssessments(
    @Param('inspectionId', ParseUUIDPipe) inspectionId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionAiAssessmentResponse[]> {
    await this.inspectionAccess.assertInspection(request.user, inspectionId);
    return this.processService.findAiAssessments(inspectionId);
  }

  @RequireAnyPermissions(
    INSPECTION_CAPABILITIES.create,
    INSPECTION_CAPABILITIES.execute,
    INSPECTION_CAPABILITIES.review,
  )
  @Patch('ai/assessments/:assessmentId/decision')
  async recordAiDecision(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Body() dto: RecordInspectionAiDecisionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<InspectionAiAssessmentResponse> {
    const inspectionId = await this.processService.getAssessmentInspectionId(assessmentId);
    await this.inspectionAccess.assertInspection(request.user, inspectionId);
    return this.processService.recordAiDecision(assessmentId, dto, request.user.sub);
  }
}
