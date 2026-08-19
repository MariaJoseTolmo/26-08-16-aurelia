export enum WorkflowInstanceStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkflowStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  RETURNED = 'returned',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
}

export enum WorkflowStepAction {
  APPROVE = 'approve',
  RETURN = 'return',
  REJECT = 'reject',
}
