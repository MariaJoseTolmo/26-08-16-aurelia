import type { EvidenceType } from '../enums';
import type { GeoLocation, ID } from '../types/common';
import type { BaseEntity } from './entity.interface';

export interface Evidence extends BaseEntity {
  type: EvidenceType;
  url: string;
  description: string | null;
  location: GeoLocation | null;
  inspectionId: ID | null;
  incidentId: ID | null;
}
