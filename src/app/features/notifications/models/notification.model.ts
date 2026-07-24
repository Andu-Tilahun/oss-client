export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  RETRY: 'RETRY',
  DLQ: 'DLQ',
} as const;

export type NotificationStatusValue = typeof NotificationStatus[keyof typeof NotificationStatus];

export const NotificationPriority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type NotificationPriorityValue = typeof NotificationPriority[keyof typeof NotificationPriority];

export interface NotificationLog {
  id: number;
  notificationType: string;
  recipient: string;
  subject?: string;
  message?: string;
  status: string;
  eventType?: string;
  errorMessage?: string;
  sentAt?: Date;
  readAt?: Date;
  isRead?: boolean;
  entityId?: string;
  eventData?: string;
  createdAt: Date;
  updatedAt: Date;
}

