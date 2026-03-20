export type OrganizationType = 'CLEARING_AGENT' | 'TRAINING_PROVIDER';

export interface Organization {
  id: string;
  name: string;
  organizationType: OrganizationType;
}

export interface OrganizationRequest {
  name: string;
  organizationType: OrganizationType;
}

