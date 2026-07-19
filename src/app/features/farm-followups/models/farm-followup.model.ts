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
  extensionWorker?: any;
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

