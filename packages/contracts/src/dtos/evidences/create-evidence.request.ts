import type { EvidenceStatus } from '../../enums';
import type { ID, ISODateString } from '../../types/common';

export interface CreateEvidenceRequest {
  fileId?: ID;
  title?: string;
  description?: string;
  evidenceType?: string;
  capturedAt?: ISODateString;
  latitude?: number;
  longitude?: number;
  createdByUserId?: ID;
}

export interface LinkEvidenceRequest {
  entityType: string;
  entityId: ID;
  relationType?: string;
}

export interface ValidateEvidenceRequest {
  status: EvidenceStatus.VALIDATED | EvidenceStatus.REJECTED;
  validationNotes?: string;
  validatedByUserId?: ID;
}
