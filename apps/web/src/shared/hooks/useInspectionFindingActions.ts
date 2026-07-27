import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InspectionEvidenceRelationType, InspectionFindingStatus, type UpdateInspectionFindingRequest } from '@aurelia/contracts';
import { useInspectionCapabilities } from '../auth/inspection-capabilities';
import {
  resubmitInspectionFindingEvidence,
  updateInspectionFinding,
} from '../services/inspection-detail.service';
import { createEvidence, linkEvidence, uploadFile } from '../services/inspections.service';

type FindingActionInput = {
  inspectionId: string;
  findingId: string;
  payload: UpdateInspectionFindingRequest;
};

type ExecuteFindingWithAfterEvidenceInput = {
  inspectionId: string;
  findingId: string;
  executedActionDescription: string;
  file: File;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type ResubmitRejectedFindingWithAfterEvidenceInput = ExecuteFindingWithAfterEvidenceInput & {
  reason: string;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeCoordinate(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : undefined;
}

function deniedCapability(capability: string): Error {
  return new Error(`No tienes la capacidad requerida para ${capability}`);
}

async function createAfterEvidence(input: ExecuteFindingWithAfterEvidenceInput) {
  const fileResponse = await uploadFile(input.file, null);
  return createEvidence({
    fileId: fileResponse.id,
    title: 'Evidencia posterior del hallazgo',
    description: input.executedActionDescription,
    evidenceType: 'photo',
    capturedAt: nowIso(),
    latitude: normalizeCoordinate(input.latitude),
    longitude: normalizeCoordinate(input.longitude),
  });
}

export function useInspectionFindingActions() {
  const queryClient = useQueryClient();
  const capabilities = useInspectionCapabilities();
  const invalidateInspectionQueries = async (inspectionId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inspections', 'detail', inspectionId] }),
      queryClient.invalidateQueries({ queryKey: ['inspections', 'management'] }),
      queryClient.invalidateQueries({ queryKey: ['inspections', 'dashboard'] }),
    ]);
  };
  const mutation = useMutation({
    mutationFn: ({ findingId, payload }: FindingActionInput) => updateInspectionFinding(findingId, payload),
    onSuccess: async (_result, variables) => {
      await invalidateInspectionQueries(variables.inspectionId);
    },
  });
  const executionMutation = useMutation({
    mutationFn: async (input: ExecuteFindingWithAfterEvidenceInput) => {
      const evidence = await createAfterEvidence(input);
      await linkEvidence(evidence.id, {
        entityType: 'inspection_finding',
        entityId: input.findingId,
        relationType: InspectionEvidenceRelationType.AFTER_PHOTO,
      });
      return updateInspectionFinding(input.findingId, {
        status: InspectionFindingStatus.IN_PROGRESS,
        executedAt: nowIso(),
        executedActionDescription: input.executedActionDescription,
      });
    },
    onSuccess: async (_result, variables) => {
      await invalidateInspectionQueries(variables.inspectionId);
    },
  });
  const resubmissionMutation = useMutation({
    mutationFn: async (input: ResubmitRejectedFindingWithAfterEvidenceInput) => {
      const evidence = await createAfterEvidence(input);
      return resubmitInspectionFindingEvidence(input.findingId, {
        reason: input.reason,
        evidenceIds: [evidence.id],
        executedActionDescription: input.executedActionDescription,
      });
    },
    onSuccess: async (_result, variables) => {
      await invalidateInspectionQueries(variables.inspectionId);
    },
  });
  const buildRejectPayload = (rejectionReason: string | null): UpdateInspectionFindingRequest => ({
    status: InspectionFindingStatus.REJECTED,
    rejectedAt: nowIso(),
    rejectionReason,
  });

  return {
    canExecute: capabilities.execute,
    canReview: capabilities.review,
    canReassign: capabilities.reassign,
    isPending: mutation.isPending || executionMutation.isPending || resubmissionMutation.isPending,
    executeFinding: (inspectionId: string, findingId: string, executedActionDescription: string | null) => {
      if (!capabilities.execute) return;
      mutation.mutate({
        inspectionId,
        findingId,
        payload: {
          status: InspectionFindingStatus.IN_PROGRESS,
          executedAt: nowIso(),
          executedActionDescription,
        },
      });
    },
    executeFindingWithAfterEvidence: (input: ExecuteFindingWithAfterEvidenceInput) => {
      if (!capabilities.execute) return Promise.reject(deniedCapability('ejecutar hallazgos'));
      return executionMutation.mutateAsync(input);
    },
    resubmitRejectedFindingWithAfterEvidence: (input: ResubmitRejectedFindingWithAfterEvidenceInput) => {
      if (!capabilities.execute) return Promise.reject(deniedCapability('reenviar evidencia rechazada'));
      return resubmissionMutation.mutateAsync(input);
    },
    approveFinding: (inspectionId: string, findingId: string) => {
      if (!capabilities.review) return;
      mutation.mutate({
        inspectionId,
        findingId,
        payload: {
          status: InspectionFindingStatus.CLOSED,
          closedAt: nowIso(),
        },
      });
    },
    rejectFinding: (inspectionId: string, findingId: string, rejectionReason: string | null) => {
      if (!capabilities.review) return;
      mutation.mutate({ inspectionId, findingId, payload: buildRejectPayload(rejectionReason) });
    },
    rejectFindingAsync: (inspectionId: string, findingId: string, rejectionReason: string | null) => {
      if (!capabilities.review) return Promise.reject(deniedCapability('revisar hallazgos'));
      return mutation.mutateAsync({
        inspectionId,
        findingId,
        payload: buildRejectPayload(rejectionReason),
      });
    },
    rescheduleFinding: (inspectionId: string, findingId: string, dueAt: string) => {
      if (!capabilities.reassign) return;
      mutation.mutate({ inspectionId, findingId, payload: { dueAt } });
    },
    reassignResponsibleUsers: async (inspectionId: string, findingIds: string[], responsibleUserIds: string[]) => {
      if (!capabilities.reassign) throw deniedCapability('reasignar responsables');
      for (const findingId of findingIds) {
        await mutation.mutateAsync({
          inspectionId,
          findingId,
          payload: { responsibleUserIds },
        });
      }
    },
  };
}
