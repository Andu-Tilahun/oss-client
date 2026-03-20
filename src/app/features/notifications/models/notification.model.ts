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
  createdAt: Date;
  updatedAt: Date;
}

