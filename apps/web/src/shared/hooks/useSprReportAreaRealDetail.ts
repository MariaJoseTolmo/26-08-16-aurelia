import { useQuery } from '@tanstack/react-query';
import type { EvidenceResponse } from '@aurelia/contracts';
import { SprRecordStatus } from '@aurelia/contracts';
import { getOrganizationAreas } from '../services/inspections.service';
import {
  getSprAssignments,
  getSprMonthlyRecords,
  getSprParameters,
  getSprRecordEvidences,
  getSprUnits,
} from '../services/spr.service';
import type { SprReportAreaDetailData } from '../../modules/spr/spr.constants';
import { buildSprReportAreaCompleteDetail } from '../../modules/spr/sprReportAreaDetail.complete';
import { buildSprReportAreaConsolidatingDetail } from '../../modules/spr/sprReportAreaDetail.consolidating';
import { buildSprReportAreaPendingDetail } from '../../modules/spr/sprReportAreaDetail.pending';
import { SPR_REPORT_AREA_CATALOG } from '../../modules/spr/sprReportDashboard.real';

const IN_CONSOLIDADO_FOR_EVIDENCE = new Set<string>([
  SprRecordStatus.SUBMITTED,
  SprRecordStatus.UNDER_REVIEW,
  SprRecordStatus.APPROVED,
]);

export type SprReportAreaRealDetail = {
  kind: 'pending' | 'consolidating' | 'complete';
  areaName: string;
  detail: SprReportAreaDetailData;
};

/** Detalle real Pendiente / En consolidado / Completa según records del ciclo seleccionado. */
export function useSprReportAreaRealDetail(
  areaSlug: string | undefined,
  periodYear: number,
  periodMonth: number,
  cycleLabel: string,
) {
  const areasQuery = useQuery({
    queryKey: ['organization', 'areas'],
    queryFn: getOrganizationAreas,
    staleTime: 300_000,
  });
  const parametersQuery = useQuery({
    queryKey: ['spr', 'parameters', 'all'],
    queryFn: () => getSprParameters(),
  });
  const assignmentsQuery = useQuery({
    queryKey: ['spr', 'assignments', 'all'],
    queryFn: () => getSprAssignments(),
  });
  const unitsQuery = useQuery({
    queryKey: ['spr', 'units'],
    queryFn: getSprUnits,
    staleTime: 300_000,
  });
  const recordsQuery = useQuery({
    queryKey: ['spr', 'monthly-records', 'area-detail', periodYear, periodMonth],
    queryFn: () =>
      getSprMonthlyRecords({
        periodYear,
        periodMonth,
      }),
  });

  const areaMeta = areaSlug
    ? SPR_REPORT_AREA_CATALOG.find((area) => area.slug === areaSlug)
    : undefined;
  const areaId =
    areaMeta && areasQuery.data
      ? areasQuery.data.find((area) => area.code === areaMeta.code)?.id
      : undefined;

  // Evidencias para Completa y En consolidado (records ya enviados al consolidado).
  const evidenceRecordIds =
    areaId && recordsQuery.data
      ? recordsQuery.data
          .filter(
            (record) =>
              record.areaId === areaId && IN_CONSOLIDADO_FOR_EVIDENCE.has(record.status),
          )
          .map((record) => record.id)
          .sort()
      : [];

  const evidencesQuery = useQuery({
    queryKey: ['spr', 'monthly-records', 'evidences-batch', periodYear, periodMonth, evidenceRecordIds],
    enabled: evidenceRecordIds.length > 0,
    queryFn: async (): Promise<EvidenceResponse[]> => {
      const batches = await Promise.all(
        evidenceRecordIds.map((recordId) => getSprRecordEvidences(recordId)),
      );
      const byId = new Map<string, EvidenceResponse>();
      for (const evidence of batches.flat()) {
        byId.set(evidence.id, evidence);
      }
      return [...byId.values()];
    },
  });

  const catalogLoading =
    areasQuery.isLoading ||
    parametersQuery.isLoading ||
    assignmentsQuery.isLoading ||
    unitsQuery.isLoading ||
    recordsQuery.isLoading;
  const evidencesLoading = evidenceRecordIds.length > 0 && evidencesQuery.isLoading;
  const isLoading = catalogLoading || evidencesLoading;
  const isError =
    areasQuery.isError ||
    parametersQuery.isError ||
    assignmentsQuery.isError ||
    unitsQuery.isError ||
    recordsQuery.isError ||
    evidencesQuery.isError;

  let resolved: SprReportAreaRealDetail | null = null;
  if (areaSlug && !isLoading && !isError) {
    const input = {
      areaSlug,
      areas: areasQuery.data,
      parameters: parametersQuery.data,
      assignments: assignmentsQuery.data,
      records: recordsQuery.data,
      units: unitsQuery.data,
      evidences: evidencesQuery.data ?? [],
      cycleLabel,
    };

    const complete = buildSprReportAreaCompleteDetail(input);
    if (complete) {
      resolved = { kind: 'complete', areaName: complete.areaName, detail: complete.detail };
    } else {
      const consolidating = buildSprReportAreaConsolidatingDetail(input);
      if (consolidating) {
        resolved = {
          kind: 'consolidating',
          areaName: consolidating.areaName,
          detail: consolidating.detail,
        };
      } else {
        const pending = buildSprReportAreaPendingDetail(input);
        if (pending) {
          resolved = { kind: 'pending', areaName: pending.areaName, detail: pending.detail };
        }
      }
    }
  }

  return { isLoading, isError, resolved };
}
