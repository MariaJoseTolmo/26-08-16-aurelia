import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SprParameterResponse } from '@aurelia/contracts';
import { resolveSprEvidenceRelationType } from '../../modules/spr/sprEvidence';
import { createEvidence, uploadFile } from '../services/inspections.service';
import { linkSprRecordEvidence } from '../services/spr.service';

interface UploadSprRecordEvidenceInput {
  recordId: string;
  file: File;
  parameter: Pick<SprParameterResponse, 'isSox' | 'name'>;
}

export function useUploadSprRecordEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, file, parameter }: UploadSprRecordEvidenceInput) => {
      const uploadedFile = await uploadFile(file);
      const evidence = await createEvidence({
        fileId: uploadedFile.id,
        title: file.name,
        description: `Documento adjunto al formulario SPR (${parameter.name})`,
        evidenceType: 'supporting_document',
        capturedAt: new Date().toISOString(),
      });
      await linkSprRecordEvidence(recordId, evidence.id, {
        relationType: resolveSprEvidenceRelationType(parameter),
      });
      return evidence;
    },
    onSuccess: async (_evidence, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['spr', 'record-evidences', variables.recordId] });
    },
  });
}
