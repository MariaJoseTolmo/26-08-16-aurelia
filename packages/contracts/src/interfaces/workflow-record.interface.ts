import type { WorkflowInstanceStatus, WorkflowStepStatus } from '../enums';
import type { ID, ISODateString } from '../types/common';

export interface WorkflowDefinitionRecord {
  id: ID;
  code: string;
  name: string;
  description: string | null;
  entityType: string;
  isActive: boolean;
  steps: WorkflowDefinitionStepRecord[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface WorkflowDefinitionStepRecord {
  id: ID;
  stepOrder: number;
  code: string;
  name: string;
  requiredRoleId: ID | null;
  slaHours: number | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface WorkflowInstanceRecord {
  id: ID;
  workflowDefinitionId: ID;
  entityType: string;
  entityId: ID;
  status: WorkflowInstanceStatus;
  startedByUserId: ID | null;
  startedAt: ISODateString;
  completedAt: ISODateString | null;
  steps: WorkflowInstanceStepRecord[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface WorkflowInstanceStepRecord {
  id: ID;
  workflowInstanceId: ID;
  stepOrder: number;
  code: string;
  name: string;
  status: WorkflowStepStatus;
  assignedToUserId: ID | null;
  assignedRoleId: ID | null;
  dueAt: ISODateString | null;
  completedByUserId: ID | null;
  completedAt: ISODateString | null;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
