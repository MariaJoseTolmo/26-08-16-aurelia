import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  InspectionEvidenceRelationType,
  InspectionFindingStatus,
  type InspectionDetailResponse,
  type InspectionFindingResponse,
  type UpdateInspectionFindingRequest,
} from '@aurelia/contracts';
import { uploadFile } from '../../../shared/services/api/files.api';
import {
  createInspectionEvidence,
  fetchInspectionDetail,
  fetchInspectionHistoryKpis,
  fetchInspectionManagementKpis,
  fetchInspectionManagementTable,
  linkInspectionEvidence,
  resubmitInspectionFindingEvidence,
  updateInspectionFinding,
  type MobileInspectionManagementFilters,
  type MobileInspectionManagementMode,
} from '../../../shared/services/inspections.api';
import { useMobileInspectionCapabilities } from '../mobileInspectionCapabilities';

export type MobileFindingEvidenceInput = {
  uri: string;
  filename: string;
  mimeType?: string | null;
};

export type MobileExecuteFindingInput = {
  inspectionId: string;
  findingId: string;
  description: string;
  evidence: MobileFindingEvidenceInput;
  latitude?: string | number | null;
  longitude?: string | number | null;
  rejectionReason?: string;
  resubmission?: boolean;
};

type FindingMutationInput = {
  inspectionId: string;
  findingId: string;
  payload: UpdateInspectionFindingRequest;
};

function coordinate(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function denied(message: string): Error {
  return new Error(`No tienes permiso para ${message}.`);
}

export function useMobileInspectionManagement(
  mode: MobileInspectionManagementMode,
  filters: MobileInspectionManagementFilters,
) {
  const managementKpis = useQuery({
    queryKey: ['mobile-inspecciones', 'management-kpis'],
    queryFn: fetchInspectionManagementKpis,
    enabled: mode === 'management',
    staleTime: 30_000,
  });
  const historyKpis = useQuery({
    queryKey: ['mobile-inspecciones', 'history-kpis'],
    queryFn: fetchInspectionHistoryKpis,
    enabled: mode === 'history',
    staleTime: 30_000,
  });
  const table = useQuery({
    queryKey: ['mobile-inspecciones', 'management-table', mode, filters],
    queryFn: () => fetchInspectionManagementTable(mode, filters),
    staleTime: 15_000,
  });

  return { managementKpis, historyKpis, table };
}

export function useMobileInspectionDetail(inspectionId: string | null, enabled = true) {
  return useQuery<InspectionDetailResponse>({
    queryKey: ['mobile-inspecciones', 'inspection-detail', inspectionId],
    queryFn: () => fetchInspectionDetail(inspectionId ?? ''),
    enabled: enabled && Boolean(inspectionId),
    staleTime: 15_000,
  });
}

export function useMobileInspectionFindingActions() {
  const capabilities = useMobileInspectionCapabilities();
  const queryClient = useQueryClient();

  async function invalidate(inspectionId: string) {
    const detailKey = inspectionId
      ? ['mobile-inspecciones', 'inspection-detail', inspectionId]
      : ['mobile-inspecciones', 'inspection-detail'];
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: detailKey }),
      queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'management-table'] }),
      queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'management-kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'history-kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['mobile-inspecciones', 'inspection-home-summary'] }),
    ]);
  }

  const findingMutation = useMutation<InspectionFindingResponse, Error, FindingMutationInput>({
    mutationFn: ({ findingId, payload }) => updateInspectionFinding(findingId, payload),
    onSuccess: async (_result, input) => invalidate(input.inspectionId),
  });

  const executionMutation = useMutation<unknown, Error, MobileExecuteFindingInput>({
    mutationFn: async (input) => {
      const uploaded = await uploadFile(
        input.evidence.uri,
        input.evidence.filename,
        input.evidence.mimeType ?? 'image/jpeg',
      );
      const evidence = await createInspectionEvidence({
        fileId: uploaded.id,
        title: 'Evidencia posterior del hallazgo',
        description: input.description,
        evidenceType: 'photo',
        capturedAt: new Date().toISOString(),
        latitude: coordinate(input.latitude),
        longitude: coordinate(input.longitude),
      });

      if (input.resubmission) {
        return resubmitInspectionFindingEvidence(input.findingId, {
          reason: input.rejectionReason?.trim() || 'Nueva evidencia posterior',
          evidenceIds: [evidence.id],
          executedActionDescription: input.description,
        });
      }

      await linkInspectionEvidence(evidence.id, {
        entityType: 'inspection_finding',
        entityId: input.findingId,
        relationType: InspectionEvidenceRelationType.AFTER_PHOTO,
      });
      return updateInspectionFinding(input.findingId, {
        status: InspectionFindingStatus.IN_PROGRESS,
        executedAt: new Date().toISOString(),
        executedActionDescription: input.description,
      });
    },
    onSuccess: async (_result, input) => invalidate(input.inspectionId),
  });

  return {
    canExecute: capabilities.execute,
    canReview: capabilities.review,
    canReassign: capabilities.reassign,
    isPending: findingMutation.isPending || executionMutation.isPending,
    error: findingMutation.error ?? executionMutation.error,
    executeWithEvidence: (input: MobileExecuteFindingInput) => {
      if (!capabilities.execute) return Promise.reject(denied('ejecutar hallazgos'));
      return executionMutation.mutateAsync(input);
    },
    approve: (inspectionId: string, findingId: string) => {
      if (!capabilities.review) return Promise.reject(denied('aprobar cierres'));
      return findingMutation.mutateAsync({
        inspectionId,
        findingId,
        payload: { status: InspectionFindingStatus.CLOSED, closedAt: new Date().toISOString() },
      });
    },
    reject: (inspectionId: string, findingId: string, reason: string) => {
      if (!capabilities.review) return Promise.reject(denied('rechazar ejecuciones'));
      return findingMutation.mutateAsync({
        inspectionId,
        findingId,
        payload: {
          status: InspectionFindingStatus.REJECTED,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      });
    },
    rescheduleFinding: (inspectionId: string, findingId: string, dueAt: string) => {
      if (!capabilities.reassign) return Promise.reject(denied('reasignar SLA'));
      return findingMutation.mutateAsync({
        inspectionId,
        findingId,
        payload: { dueAt },
      });
    },
    reassignResponsibles: async (
      inspectionId: string,
      findingIds: string[],
      responsibleUserIds: string[],
    ) => {
      if (!capabilities.reassign) throw denied('reasignar responsables');
      for (const findingId of findingIds) {
        await findingMutation.mutateAsync({
          inspectionId,
          findingId,
          payload: { responsibleUserIds },
        });
      }
    },
  };
}
