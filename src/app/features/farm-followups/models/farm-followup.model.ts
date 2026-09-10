import {User} from '../../users/models/user.model';

export type FollowUpTaskStatus = 'ACTIVE' | 'DONE' | 'EXCLUDED' | 'REJECTED';

export interface FarmFollowUp {
  id: string;
  externalId: string;
  remark: string;
  attachment: string;
  startDate?: string | null;
  endDate?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  extensionWorker?: User;
  taskStatus: FollowUpTaskStatus;
  outcomeReason?: string | null;
  completedBy?: string | null;
  completedByUser?: User;
  completedAt?: string | null;
  referenceNumber: string;
}

export interface FarmFollowUpOutcomeRequest {
  reason: string;
}

export interface FarmFollowUpCreateRequest {
  remark: string;
  attachment?: string | null;
  externalId: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface FarmFollowUpReport {
  id: string;
  followUpId: string;
  content: string;
  fileUuids: string[];
  createdBy?: string;
  createdAt?: string;
}

export interface FarmFollowUpReportCreateRequest {
  content: string;
  fileUuids: string[];
}

