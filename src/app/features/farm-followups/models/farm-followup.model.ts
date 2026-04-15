export interface FarmFollowUp {
  id: string;
  externalId: string;
  remark: string;
  attachment: string;
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
}

