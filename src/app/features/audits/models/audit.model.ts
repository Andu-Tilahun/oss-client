export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  data: string;
  createdAt: Date;
  createdBy?: string;
}

