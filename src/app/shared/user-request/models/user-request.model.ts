export interface UserRequestStatusLogAttachment {
  id: string;
  attachment: string; // fileId
  fileDescription: string;
  createdDate?: string;
  createdBy?: string;
}

export interface UserRequestStatusLog {
  id: string;
  status: string;
  previousStatus: string;
  userId?: string;
  userRequestId: string;
  remark: string;
  userRequestStatusLogAttachments: UserRequestStatusLogAttachment[];
  createdDate?: string;
  createdBy?: string;
}

export interface UserRequest {
  id: string;
  requestType: string; // ex: NEW_TRAINING_PROGRAM
  status: string; // ex: DRAFT
  userId?: string;
  requestedBy?: string; // used as "parent id" (trainingProgramId) in your current backend
  assignedToId?: string;
  applicationNumber: string;
  userRequestStatusLogList: UserRequestStatusLog[];
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface EditUserRequestCommand {
  remark: string;
  status: string; // next status
  assignedToId?: string | null;
  attachment?: string | null; // fileId
  userRequestId: string;
}

/** Optional action on a transition. ASSIGN_EXPERT means show Assign Officer and hide generic Actions. */
export type WorkflowTransitionAction = 'ASSIGN_EXPERT';

export interface WorkflowTransition {
  id: string;
  currentStatus: string;
  nextStatus: string;
  roleId?: string;
  label: string;
  /** When ASSIGN_EXPERT, hide Actions button and show Assign Officer as primary action. */
  action?: WorkflowTransitionAction | null;
}

export interface Workflow {
  id: string;
  name: string;
  requestType: string;
  workflowTransitions: WorkflowTransition[];
}

/** Maps user request type to the role used when loading assignable users (e.g. OPERATOR). */
export const USER_REQUEST_TYPE_ROLE_MAP: Record<string, string> = {
  NEW_TRAINING_PROGRAM: 'OPERATOR',
  NEW_TRAINING: 'OPERATOR',
  NEW_CLEARING_AGENT_APPLICANT:"EDUCATION_OPERATOR"
  // Add more request types and their assignee roles as needed
};

