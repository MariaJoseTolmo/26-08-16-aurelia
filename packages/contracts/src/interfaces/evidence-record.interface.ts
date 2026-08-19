import type { EvidenceStatus } from '../enums';
import type { ID, ISODateString } from '../types/common';

export interface EvidenceRecord {
  id: ID;
  fileId: ID | null;
  title: string | null;
  description: string | null;
  evidenceType: string | null;
  status: EvidenceStatus;
  capturedAt: ISODateString | null;
  latitude: number | null;
  longitude: number | null;
  createdByUserId: ID | null;
  validatedByUserId: ID | null;
  validatedAt: ISODateString | null;
  validationNotes: string | null;
  links: EvidenceLinkRecord[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EvidenceLinkRecord {
  id: ID;
  evidenceId: ID;
  entityType: string;
  entityId: ID;
  relationType: string;
  createdAt: ISODateString;
}
