import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentResponse, EvidenceLinkResponse, EvidenceResponse } from '@aurelia/contracts';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CommentsService } from '../comments/comments.service';
import { EvidencesService } from '../evidences/evidences.service';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { LinkIncidentEvidenceDto } from './dto/link-incident-evidence.dto';
import { IncidentActionPlanEntity } from './entities/incident-action-plan.entity';
import { IncidentFiveWhyAnalysisEntity } from './entities/incident-five-why-analysis.entity';
import { IncidentFlashReportEntity } from './entities/incident-flash-report.entity';
import { IncidentImmediateActionEntity } from './entities/incident-immediate-action.entity';
import { IncidentInvestigationEntity } from './entities/incident-investigation.entity';
import { IncidentPeepoAnalysisEntity } from './entities/incident-peepo-analysis.entity';
import { IncidentStatusHistoryEntity } from './entities/incident-status-history.entity';
import { IncidentEntity } from './entities/incident.entity';

@Injectable()
export class IncidentTransversalService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidents: Repository<IncidentEntity>,
    @InjectRepository(IncidentFlashReportEntity)
    private readonly flashReports: Repository<IncidentFlashReportEntity>,
    @InjectRepository(IncidentImmediateActionEntity)
    private readonly immediateActions: Repository<IncidentImmediateActionEntity>,
    @InjectRepository(IncidentInvestigationEntity)
    private readonly investigations: Repository<IncidentInvestigationEntity>,
    @InjectRepository(IncidentFiveWhyAnalysisEntity)
    private readonly fiveWhyAnalyses: Repository<IncidentFiveWhyAnalysisEntity>,
    @InjectRepository(IncidentPeepoAnalysisEntity)
    private readonly peepoAnalyses: Repository<IncidentPeepoAnalysisEntity>,
    @InjectRepository(IncidentActionPlanEntity)
    private readonly actionPlans: Repository<IncidentActionPlanEntity>,
    @InjectRepository(IncidentStatusHistoryEntity)
    private readonly statusHistory: Repository<IncidentStatusHistoryEntity>,
    private readonly evidencesService: EvidencesService,
    private readonly commentsService: CommentsService,
    private readonly auditService: AuditService,
  ) {}

  async findEvidences(incidentId: string): Promise<EvidenceResponse[]> {
    await this.getIncidentOrThrow(incidentId);
    return this.evidencesService.findAll('incident', incidentId);
  }

  async linkEvidence(incidentId: string, evidenceId: string, dto: LinkIncidentEvidenceDto, actorId: string | null): Promise<EvidenceLinkResponse> {
    await this.getIncidentOrThrow(incidentId);
    const result = await this.evidencesService.link(evidenceId, {
      entityType: 'incident',
      entityId: incidentId,
      relationType: dto.relationType ?? 'incident_evidence',
    });
    await this.logAudit('incident.evidence.linked', incidentId, actorId, undefined, { evidenceId, relationType: result.relationType });
    return result;
  }

  async findComments(incidentId: string): Promise<CommentResponse[]> {
    await this.getIncidentOrThrow(incidentId);
    return this.commentsService.findAll('incident', incidentId);
  }

  async createComment(incidentId: string, dto: CreateIncidentCommentDto, actorId: string | null): Promise<CommentResponse> {
    await this.getIncidentOrThrow(incidentId);
    const result = await this.commentsService.create({
      entityType: 'incident',
      entityId: incidentId,
      body: dto.body,
      isInternal: dto.isInternal,
      authorUserId: dto.authorUserId ?? actorId ?? undefined,
    });
    await this.logAudit('incident.comment.created', incidentId, actorId, undefined, { commentId: result.id, isInternal: result.isInternal });
    return result;
  }

  async getExportPayload(incidentId: string): Promise<Record<string, unknown>> {
    const incident = await this.getIncidentOrThrow(incidentId);
    const flashReport = await this.flashReports.findOne({ where: { incidentId } });
    const immediateActions = await this.immediateActions.find({ where: { incidentId }, order: { createdAt: 'ASC' } });
    const investigations = await this.investigations.find({ where: { incidentId }, order: { createdAt: 'ASC' } });
    const actionPlans = await this.actionPlans.find({ where: { incidentId }, order: { createdAt: 'ASC' } });
    const history = await this.statusHistory.find({ where: { incidentId }, order: { createdAt: 'ASC' } });
    const evidences = await this.evidencesService.findAll('incident', incidentId);
    const comments = await this.commentsService.findAll('incident', incidentId);

    const investigationsWithAnalyses = await Promise.all(
      investigations.map(async (investigation) => ({
        ...investigation,
        fiveWhy: await this.fiveWhyAnalyses.findOne({ where: { investigationId: investigation.id } }),
        peepo: await this.peepoAnalyses.findOne({ where: { investigationId: investigation.id } }),
        actionPlans: actionPlans.filter((actionPlan) => actionPlan.investigationId === investigation.id),
      })),
    );

    return {
      generatedAt: new Date().toISOString(),
      incident,
      flashReport,
      immediateActions,
      investigations: investigationsWithAnalyses,
      actionPlans,
      statusHistory: history,
      evidences,
      comments,
      summary: {
        immediateActionsCount: immediateActions.length,
        investigationsCount: investigations.length,
        actionPlansCount: actionPlans.length,
        evidencesCount: evidences.length,
        commentsCount: comments.length,
      },
    };
  }

  async getExportPdf(incidentId: string): Promise<Buffer> {
    const payload = await this.getExportPayload(incidentId);
    const incident = payload.incident as IncidentEntity;
    const summary = payload.summary as Record<string, unknown>;
    const lines = [
      'Aurelia - Reporte de incidente',
      `Generado: ${String(payload.generatedAt)}`,
      `ID: ${incident.id}`,
      `Titulo: ${incident.title}`,
      `Estado: ${incident.status}`,
      `Ocurrido: ${incident.occurredAt.toISOString()}`,
      `Reportado: ${incident.reportedAt.toISOString()}`,
      `SLA: ${incident.slaDueAt ? incident.slaDueAt.toISOString() : 'N/A'}`,
      `Cierre: ${incident.closedAt ? incident.closedAt.toISOString() : 'N/A'}`,
      `Acciones inmediatas: ${String(summary.immediateActionsCount ?? 0)}`,
      `Investigaciones: ${String(summary.investigationsCount ?? 0)}`,
      `Planes de accion: ${String(summary.actionPlansCount ?? 0)}`,
      `Evidencias: ${String(summary.evidencesCount ?? 0)}`,
      `Comentarios: ${String(summary.commentsCount ?? 0)}`,
      '',
      'Este PDF es una salida operativa base. El formato visual avanzado queda para frontend/reporting.',
    ];
    return this.createSimplePdf(lines);
  }

  private async getIncidentOrThrow(id: string): Promise<IncidentEntity> {
    const incident = await this.incidents.findOneBy({ id });
    if (!incident) throw new NotFoundException(`Incident ${id} not found`);
    return incident;
  }

  private async logAudit(
    action: string,
    entityId: string,
    actorId: string | null,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      action,
      entityType: 'incident',
      entityId,
      actorUserId: actorId ?? undefined,
      oldValue,
      newValue,
    });
  }

  private createSimplePdf(lines: string[]): Buffer {
    const normalizedLines = lines.flatMap((line) => this.wrapLine(line, 88)).slice(0, 44);
    const content = ['BT', '/F1 11 Tf', '14 TL', '50 780 Td', ...normalizedLines.flatMap((line) => [`(${this.escapePdfText(line)}) Tj`, 'T*']), 'ET'].join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let index = 0; index < objects.length; index += 1) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n');
    pdf += `\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, 'utf8');
  }

  private wrapLine(value: string, maxLength: number): string[] {
    if (value.length <= maxLength) return [value];
    const chunks: string[] = [];
    for (let index = 0; index < value.length; index += maxLength) chunks.push(value.slice(index, index + maxLength));
    return chunks;
  }

  private escapePdfText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}
