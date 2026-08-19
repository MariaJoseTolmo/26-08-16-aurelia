import type { MarkAllNotificationsReadResult, NotificationMessage, NotificationRecipient } from '../../interfaces/notification.interface';

export type NotificationResponse = NotificationMessage;
export type NotificationRecipientResponse = NotificationRecipient;
export type MarkAllNotificationsReadResponse = MarkAllNotificationsReadResult;

export type InspectionNotificationEvent =
  | 'inspection.assigned'
  | 'inspection.finding.executed'
  | 'inspection.finding.closed'
  | 'inspection.finding.rejected'
  | 'inspection.finding.resubmitted'
  | 'inspection.closed';

export type InspectionNotificationTone = 'blue' | 'teal' | 'green' | 'red' | 'yellow';

export interface InspectionNotificationMetadata {
  event?: InspectionNotificationEvent;
  eventKey?: string;
  tone?: InspectionNotificationTone;
  tag?: string;
  headline?: string;
  inspectionId?: string;
  findingId?: string;
  inspectionNumber?: string;
  inspectionLabel?: string;
  detailLine?: string;
  footerLine?: string;
  reason?: string;
  severityLabels?: string[];
  progressLabel?: string;
  occurredAt?: string;
  unreadDot?: boolean;
}
