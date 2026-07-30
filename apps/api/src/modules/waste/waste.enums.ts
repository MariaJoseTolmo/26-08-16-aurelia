export enum WasteLotStatus {
  AVAILABLE = 'available',
  PARTIALLY_RESERVED = 'partially_reserved',
  FULLY_RESERVED = 'fully_reserved',
  PARTIALLY_WITHDRAWN = 'partially_withdrawn',
  DEPLETED = 'depleted',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum WasteMovementType {
  RECEIPT = 'receipt',
  RESERVATION = 'reservation',
  RESERVATION_RELEASE = 'reservation_release',
  WITHDRAWAL = 'withdrawal',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  RETURN = 'return',
  CANCELLATION = 'cancellation',
}

export enum WasteWithdrawalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  OPEN = 'open',
  WITHDRAWAL_REGISTERED = 'withdrawal_registered',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum WasteApprovalStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum WasteSidrepStatus {
  AWAITING_APPROVAL = 'awaiting_approval',
  OPEN = 'open',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum WasteSinaderPeriodStatus {
  IN_PROGRESS = 'in_progress',
  PENDING_DECLARATION = 'pending_declaration',
  DECLARED = 'declared',
}
