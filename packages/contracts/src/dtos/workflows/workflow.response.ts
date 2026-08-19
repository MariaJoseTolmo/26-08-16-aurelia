import type {
  WorkflowDefinitionRecord,
  WorkflowDefinitionStepRecord,
  WorkflowInstanceRecord,
  WorkflowInstanceStepRecord,
} from '../../interfaces/workflow-record.interface';
import type { WorkflowStepAction } from '../../enums';
import type { ID } from '../../types/common';

export type WorkflowDefinitionResponse = WorkflowDefinitionRecord;
export type WorkflowDefinitionStepResponse = WorkflowDefinitionStepRecord;
export type WorkflowInstanceResponse = WorkflowInstanceRecord;
export type WorkflowInstanceStepResponse = WorkflowInstanceStepRecord;

export interface StartWorkflowRequest {
  workflowDefinitionId: ID;
  entityType: string;
  entityId: ID;
  startedByUserId?: ID;
}

export interface AdvanceWorkflowStepRequest {
  stepId: ID;
  action: WorkflowStepAction;
  notes?: string;
  completedByUserId?: ID;
}
