import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CommentResponse, EvidenceLinkResponse, EvidenceResponse } from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { LinkIncidentEvidenceDto } from './dto/link-incident-evidence.dto';
import { IncidentTransversalService } from './incident-transversal.service';

@RequirePermissions('incidents:read')
@Controller('incidents')
export class IncidentTransversalController {
  constructor(private readonly incidentTransversalService: IncidentTransversalService) {}

  @RequirePermissions('evidences:read')
  @Get(':id/evidences')
  findEvidences(@Param('id', ParseUUIDPipe) id: string): Promise<EvidenceResponse[]> {
    return this.incidentTransversalService.findEvidences(id);
  }

  @RequirePermissions('incidents:write', 'evidences:write')
  @Post(':id/evidences/:evidenceId/link')
  linkEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body() dto: LinkIncidentEvidenceDto,
  ): Promise<EvidenceLinkResponse> {
    return this.incidentTransversalService.linkEvidence(id, evidenceId, dto, null);
  }

  @RequirePermissions('comments:read')
  @Get(':id/comments')
  findComments(@Param('id', ParseUUIDPipe) id: string): Promise<CommentResponse[]> {
    return this.incidentTransversalService.findComments(id);
  }

  @RequirePermissions('comments:write')
  @Post(':id/comments')
  createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateIncidentCommentDto,
  ): Promise<CommentResponse> {
    return this.incidentTransversalService.createComment(id, dto, null);
  }

  @Get(':id/export')
  getExportPayload(@Param('id', ParseUUIDPipe) id: string): Promise<Record<string, unknown>> {
    return this.incidentTransversalService.getExportPayload(id);
  }

  @Get(':id/export/pdf')
  async getExportPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const pdf = await this.incidentTransversalService.getExportPdf(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="incident-${id}.pdf"`);
    response.send(pdf);
  }
}
