export enum WorkflowStatuses {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  RETURN = 'RETURN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ASSIGN_EXPERT= "ASSIGN_EXPERT"
}

export enum WorkflowTransitionAction {
  ASSIGN_EXPERT = 'ASSIGN_EXPERT'
}

export enum UserRequestType {
  NEW_TRAINING_PROGRAM = 'NEW_TRAINING_PROGRAM',
  NEW_CLEARING_AGENT_APPLICANT ='NEW_CLEARING_AGENT_APPLICANT'
}

export interface WorkflowTransition {
  id?: string;
  currentStatus: WorkflowStatuses;
  nextStatus: WorkflowStatuses;
  roleId: string;
  label: string;
  action?: WorkflowTransitionAction | null;
  createdDate?: Date;
  modifiedDate?: Date;
  createdBy?: string;
  modifiedBy?: string;
}

export interface Workflow {
  id?: string;
  name: string;
  requestType: UserRequestType;
  workflowTransitions: WorkflowTransition[];
  createdDate?: Date;
  modifiedDate?: Date;
  createdBy?: string;
  modifiedBy?: string;
}
