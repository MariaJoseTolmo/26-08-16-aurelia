import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  CommentResponse,
  EvidenceLinkResponse,
  EvidenceResponse,
  INSPECTION_CAPABILITIES,
} from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequireAnyPermissions } from '../auth/require-any-permissions.decorator';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateInspectionCommentDto } from './dto/create-inspection-comment.dto';
import { LinkInspectionEvidenceDto } from './dto/link-inspection-evidence.dto';
import { InspectionAccessService } from './inspection-access.service';
import { InspectionTransversalService } from './inspection-transversal.service';

@RequirePermissions(INSPECTION_CAPABILITIES.read)
@Controller('inspections')
export class InspectionTransversalController {
  constructor(
    private readonly inspectionTransversalService: InspectionTransversalService,
    private readonly inspectionAccess: InspectionAccessService,
  ) {}

  @RequirePermissions(INSPECTION_CAPABILITIES.read, 'evidences:read')
  @Get(':id/evidences')
  async findEvidences(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<EvidenceResponse[]> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionTransversalService.findEvidences(id);
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.execute, 'evidences:write')
  @Post(':id/evidences/:evidenceId/link')
  async linkEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body() dto: LinkInspectionEvidenceDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EvidenceLinkResponse> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionTransversalService.linkEvidence(id, evidenceId, dto, request.user.sub);
  }

  @RequirePermissions(INSPECTION_CAPABILITIES.read, 'comments:read')
  @Get(':id/comments')
  async findComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<CommentResponse[]> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionTransversalService.findComments(id);
  }

  @RequirePermissions('comments:write')
  @RequireAnyPermissions(INSPECTION_CAPABILITIES.execute, INSPECTION_CAPABILITIES.review)
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInspectionCommentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CommentResponse> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionTransversalService.createComment(id, dto, request.user.sub);
  }

  @Get(':id/export')
  async getExportPayload(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Record<string, unknown>> {
    await this.inspectionAccess.assertInspection(request.user, id);
    return this.inspectionTransversalService.getExportPayload(id);
  }

  @Get(':id/export/pdf')
  async getExportPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    await this.inspectionAccess.assertInspection(request.user, id);
    const pdf = await this.inspectionTransversalService.getExportPdf(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
    response.send(pdf.buffer);
  }
}
