import {User} from "../../users/models/user.model";
import {FarmPlot} from "../../farm-plots/models/farm-plot.model";
import {FarmFollowUp} from "../../farm-followups/models/farm-followup.model";

export type LeaseStatus = 'ACTIVE' | 'PENDING' | 'TERMINATED';
export type LeaseTermStatus = 'ACTIVE' | 'PAID' | 'PASSED';

export interface LeaseTerm {
  id: string;
  scheduledDate: string; // yyyy-MM-dd
  dueDate: string;
  amount: number;
  paidDate?: string;
  status: LeaseTermStatus;
}

export interface LeaseAgreement {
  id: string;
  farmPlotId: string;
  investorId: string;
  startDate: string;
  endDate: string;
  totalDurationMonths: number;
  status: LeaseStatus;
  totalAmount: number;
  investorUser: User;
  farmPlot: FarmPlot;
  extensionWorker: User;
  followUpDtoList: FarmFollowUp[];
  terms?: LeaseTerm[];
}

export interface LeaseCreateRequest {
  farmPlotId: string;
  startDate: string; // yyyy-MM-dd
  totalDurationMonths: number;
  endDate?: string; // optional
  totalAmount: number;
  leasePaymentLineRequests: FarmLeasePaymentLine;
}

export interface LeaseGenerateTermsRequest {
  paymentStartDate: string; // yyyy-MM-dd
}

/** One line in a custom payment schedule (repeater row). */
export interface FarmLeasePaymentLine {
  dueDate: string; // yyyy-MM-dd
  amount: number;
}

/** Request body for POST .../leases/{id}/terms/define */
export interface LeaseDefineTermsRequest {
  terms: FarmLeasePaymentLine[];
}

export interface LeaseFilterRequest {
  searchText?: string;
  statuses?: LeaseStatus[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

