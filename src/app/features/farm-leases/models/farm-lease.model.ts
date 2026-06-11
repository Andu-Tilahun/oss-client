import {User} from "../../users/models/user.model";
import {FarmPlot, FarmPlotSoilType} from "../../farm-plots/models/farm-plot.model";
import {FarmFollowUp} from "../../farm-followups/models/farm-followup.model";
import {
  FarmActivity,
  FundingStatus,
  InvestmentPackageType,
  InvestmentPaymentStatus,
  WaterSource,
} from "../../investment-package/models/investment-package.model";

export type LeaseStatus = 'ACTIVE' | 'PENDING' | 'TERMINATED' | 'ACCEPTED' | 'SENT';
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
  startDate: string;
  endDate: string;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
  title: string;
  agreementId?: string | null;
  targetAmount: number;
  minimumContribution: number;
  paidDate?: string | null;
  attachmentIdList?: string[];
  paymentStatus?: InvestmentPaymentStatus;
  investorIdList?: string[];
  expectedInvestorNumber?: number;
  fundingDeadline?: string;
  fundingStatus: FundingStatus;
  investmentPackageType?: InvestmentPackageType;
  remark?: string | null;
  description?: string;
  farmPlotId?: string;
  farmPlot: FarmPlot;
  followUpDtoList?: FarmFollowUp[];
  extensionWorker?: User | null;
  // Legacy lease-agreement fields (optional — used by create/edit/modals and lease endpoints)
  investorId?: string;
  investorUser?: User;
  totalDurationMonths?: number;
  status?: LeaseStatus;
  totalAmount?: number;
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
  statuses?: FundingStatus[];
  paymentStatuses?: InvestmentPaymentStatus[];
  soilTypes?: FarmPlotSoilType[];
  investmentPackageType?: InvestmentPackageType;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
