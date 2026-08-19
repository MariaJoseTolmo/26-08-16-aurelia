import type { WorkflowStatus } from '../enums';
import type { ID, ISODateString } from '../types/common';
import type { BaseEntity } from './entity.interface';

export interface WorkflowStep extends BaseEntity {
  entityType: 'INSPECTION' | 'INCIDENT';
  entityId: ID;
  status: WorkflowStatus;
  assignedToId: ID | null;
  comment: string | null;
  decidedAt: ISODateString | null;
}
