export type ExtensionFollowUpStatus =
  | 'SUBMITTED'
  | 'AMEND'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export interface FarmOperationFollowUp {
  id: string;
  farmOperationId: string;
  farmPlotId: string;
  scheduledDate: string; // ISO local date-time
  notify: boolean;
  remark?: string;
  followUpRemark?: string;
  issuesEncountered?: string;
  reportDate?: string;
  status: ExtensionFollowUpStatus;
  assignedTo: string;
}

export interface LeaseFollowUp {
  id: string;
  leaseId: string;
  farmPlotId: string;
  scheduledDate: string; // ISO local date-time
  notify: boolean;
  remark?: string;
  followUpRemark?: string;
  issuesEncountered?: string;
  reportDate?: string;
  status: ExtensionFollowUpStatus;
  assignedTo: string;
  investorId?: string;
}

