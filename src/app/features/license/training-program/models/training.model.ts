export interface TrainingProgram {
  id: string;
  title: string;
  registrationStartDate: string;
  registrationEndDate: string;
  trainingStartDate: string;
  trainingEndDate: string;
  privateQuota: number;
  formerEmployeeQuota: number;
  status: TrainingStatus;
  regionalQuotaEnabled: boolean;
  organizationalQuotaEnabled: boolean;
  userRequestId?: string;
  applicationNumber?: string;
  userRequestStatus?: string;
  quotas: Quota[];
}

export interface TrainingProgramCreateRequest {
  title: string;
  registrationStartDate: string;
  registrationEndDate: string;
  trainingStartDate: string;
  trainingEndDate: string;
  privateQuota: number;
  formerEmployeeQuota: number;
}

export interface Quota {
  id: string;
  quotaType: QuotaType;
  externalId: string;
  externalName?: string;
  quota: number;
  usedQuota: number;
}

export interface QuotaAssignment {
  externalId: string;
  quota: number;
}

export interface RegionalQuotaRequest {
  enabled: boolean;
  quotas: QuotaAssignment[];
}

export interface OrganizationalQuotaRequest {
  enabled: boolean;
  quotas: QuotaAssignment[];
}

export interface TrainingProgramFilterRequest {
  searchText?: string;
  statuses?: TrainingStatus[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}


export enum TrainingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum QuotaType {
  REGIONAL = 'REGIONAL',
  ORGANIZATIONAL = 'ORGANIZATIONAL'
}
