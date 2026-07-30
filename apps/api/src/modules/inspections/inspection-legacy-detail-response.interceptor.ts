import {
  CallHandler,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import {
  InspectionFindingSeverity,
  InspectionFindingStatus,
  type InspectionDetailFindingItemResponse,
  type InspectionDetailLegacySummaryResponse,
  type InspectionDetailResponse,
  type InspectionDetailFollowupResponse,
} from '@aurelia/contracts';
import { mergeMap, type Observable } from 'rxjs';
import { InspectionLegacyDetailProjectionService } from './inspection-legacy-detail-projection.service';

interface InspectionDetailRequest {
  method?: string;
  originalUrl?: string;
  params?: Record<string, string | undefined>;
}

@Injectable()
export class InspectionLegacyDetailResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly legacyProjection: InspectionLegacyDetailProjectionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<InspectionDetailRequest>();
    const inspectionId = request.params?.id ?? null;
    if (!this.isDetailRequest(request, inspectionId)) return next.handle();

    return next.handle().pipe(
      mergeMap(async (detail: InspectionDetailResponse) => {
        const legacy = await this.legacyProjection.getSummary(inspectionId as string);
        if (!legacy) return { ...detail, legacy: null };
        return this.projectLegacyDetail(detail, legacy);
      }),
    );
  }

  private projectLegacyDetail(
    detail: InspectionDetailResponse,
    legacy: InspectionDetailLegacySummaryResponse,
  ): InspectionDetailResponse {
    const total = Math.max(0, legacy.totalObservations);
    const closed = Math.max(0, Math.min(total, legacy.closedObservations));
    const open = Math.max(0, Math.min(total - closed, legacy.openObservations));
    const closedDates = this.buildLegacyClosedDates(detail, legacy, closed);
    const closedFindings = Array.from({ length: closed }, (_, index) =>
      this.buildLegacyFinding(detail.header.inspectionId, index, InspectionFindingStatus.CLOSED, closedDates[index] ?? null),
    );
    const openFindings = Array.from({ length: open }, (_, index) =>
      this.buildLegacyFinding(detail.header.inspectionId, closed + index, InspectionFindingStatus.OPEN, null),
    );
    const progressPercent = total === 0 ? 0 : Math.round((closed / total) * 100);

    return {
      ...detail,
      header: {
        ...detail.header,
        title: legacy.originalDetail?.trim() || detail.header.title,
        kind: legacy.mode,
        progressPercent,
        counts: {
          executed: 0,
          open,
          closed,
          rejected: 0,
        },
      },
      findings: {
        executed: [],
        open: openFindings,
        closed: closedFindings,
        rejected: [],
      },
      followups: this.buildLegacyFollowups(detail.header.inspectionId, legacy, closedFindings),
      general: {
        ...detail.general,
        inspectorName: legacy.originalInspectorName?.trim() || detail.general.inspectorName,
        areaName: legacy.originalAreaName?.trim() || detail.general.areaName,
        sectorName: legacy.originalSectorName?.trim() || detail.general.sectorName,
        companyName: legacy.originalCompanyName?.trim() || detail.general.companyName,
      },
      legacy,
    };
  }

  private buildLegacyFinding(
    inspectionId: string,
    index: number,
    status: InspectionFindingStatus.CLOSED | InspectionFindingStatus.OPEN,
    closedAt: string | null,
  ): InspectionDetailFindingItemResponse {
    const closed = status === InspectionFindingStatus.CLOSED;
    return {
      findingId: `legacy-${inspectionId}-${index + 1}`,
      checklistItemId: null,
      title: `Observación ${index + 1}`,
      condition: null,
      proposedCorrectiveAction: null,
      executedActionDescription: null,
      rejectionReason: null,
      severity: InspectionFindingSeverity.LOW,
      severityLabel: '—',
      status,
      statusGroup: closed ? 'closed' : 'open',
      responsibleCompanyId: null,
      responsibleCompanyName: null,
      responsibleUsers: [],
      dueAt: null,
      executedAt: null,
      closedAt,
      rejectedAt: null,
      beforeEvidence: [],
      afterEvidence: [],
    };
  }

  private buildLegacyClosedDates(
    detail: InspectionDetailResponse,
    legacy: InspectionDetailLegacySummaryResponse,
    closedCount: number,
  ): Array<string | null> {
    if (closedCount === 0) return [];
    const milestones = [...legacy.milestones].sort((left, right) => left.sequenceNumber - right.sequenceNumber);
    const firstMilestone = milestones[0];
    const initialPending = firstMilestone
      ? Math.max(0, firstMilestone.pendingAfter + firstMilestone.closedIncrement)
      : legacy.openObservations;
    const initialClosed = Math.max(0, Math.min(closedCount, legacy.totalObservations - initialPending));
    const dates: Array<string | null> = Array.from(
      { length: initialClosed },
      () => detail.general.scheduledAt,
    );

    milestones.forEach((milestone) => {
      const remaining = closedCount - dates.length;
      if (remaining <= 0) return;
      const increment = Math.max(0, Math.min(remaining, milestone.closedIncrement));
      for (let index = 0; index < increment; index += 1) dates.push(milestone.occurredAt);
    });

    const fallbackDate = milestones.at(-1)?.occurredAt ?? detail.general.scheduledAt;
    while (dates.length < closedCount) dates.push(fallbackDate);
    return dates;
  }

  private buildLegacyFollowups(
    inspectionId: string,
    legacy: InspectionDetailLegacySummaryResponse,
    closedFindings: InspectionDetailFindingItemResponse[],
  ): InspectionDetailFollowupResponse[] {
    const fallbackFindingId = closedFindings[0]?.findingId ?? `legacy-${inspectionId}-summary`;
    return [...legacy.milestones]
      .sort((left, right) => left.sequenceNumber - right.sequenceNumber)
      .map((milestone) => ({
        followupId: `legacy-followup-${inspectionId}-${milestone.sequenceNumber}`,
        findingId: fallbackFindingId,
        sequenceNumber: milestone.sequenceNumber,
        title: `Seguimiento ${milestone.sequenceNumber}`,
        description: [
          `Cerradas en seguimiento: ${milestone.closedIncrement}`,
          `Pendientes posteriores: ${milestone.pendingAfter}`,
        ].join(' · '),
        performedAt: milestone.occurredAt,
        performedByUserId: null,
        performedByName: null,
        completed: Boolean(milestone.occurredAt),
      }));
  }

  private isDetailRequest(
    request: InspectionDetailRequest,
    inspectionId: string | null,
  ): inspectionId is string {
    if (request.method?.toUpperCase() !== 'GET') return false;
    if (!inspectionId || !this.isUuid(inspectionId)) return false;
    return /(?:^|\/)inspections\/[^/]+\/detail(?:\?|$)/.test(request.originalUrl ?? '');
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
