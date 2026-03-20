export type ClearingAgentApplicantType =
  | 'REGIONAL'
  | 'ORGANIZATIONAL'
  | 'PRIVATE'
  | 'FORMER_EMPLOYEE';

export type ClearingAgentDocumentType =
  | 'CERTIFICATE'
  | 'WORK_EXPERIENCE'
  | 'NATIONAL_ID'
  | 'OTHER';

export interface ClearingAgentDocument {
  id?: string;
  documentType: ClearingAgentDocumentType;
  attachmentId?: string;
}

export interface ClearingAgentApplicant {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;

  gender: string;
  dateOfBirth: string;

  photoId?: string;

  email?: string;
  phoneNumber?: string;

  applicantType: ClearingAgentApplicantType;

  trainingProgramId: string;
  trainingProgramTitle?: string;

  externalId?: string;

  referenceNumber: string;

  userRequestId?: string;
  applicationNumber?: string;
  userRequestStatus?: string;

  documents?: ClearingAgentDocument[];
}

export interface ClearingAgentApplicantCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;

  gender: string;
  dateOfBirth: string;

  photoId?: string;

  email?: string;
  phoneNumber?: string;

  applicantType: ClearingAgentApplicantType;
  trainingProgramId: string;
  externalId?: string;
}

export interface ClearingAgentDocumentRequest {
  documentType: ClearingAgentDocumentType;
  attachmentId: string;
}

export interface ClearingAgentApplicantFilterRequest {
  searchText?: string;
  trainingProgramId?: string;
  applicantTypes?: ClearingAgentApplicantType[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

