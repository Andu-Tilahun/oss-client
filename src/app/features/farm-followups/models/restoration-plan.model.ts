export type RestorationPlanStatus = 'SUBMITTED' | 'ACTIVE' | 'RESTORATION_END' | 'CANCELLED';

export interface RestorationPlan {
  id: string;
  farmPlotId: string;
  startDate: string;
  endDate: string;
  remark?: string | null;
  assignedTo?: string | null;
  followUpRemark?: string | null;
  issuesEncountered?: string | null;
  reportDate?: string | null;
  status: RestorationPlanStatus;
}

export interface RestorationPlanCreateRequest {
  farmPlotId: string;
  startDate: string;
  endDate: string;
  remark?: string;
  assignedTo?: string | null;
}

export interface RestorationPlanUpdateRequest {
  startDate?: string;
  endDate?: string;
  remark?: string;
  assignedTo?: string | null;
  followUpRemark?: string;
  issuesEncountered?: string;
  reportDate?: string;
  status?: RestorationPlanStatus;
}
